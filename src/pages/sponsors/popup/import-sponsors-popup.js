import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";

const ACTION_LABEL_KEYS = {
  create: "action_create",
  skip_existing_sponsor: "action_skip_existing_sponsor",
  skip_duplicate: "action_skip_duplicate",
  error: "action_error",
  not_attempted: "action_not_attempted"
};

const t = (key, vars) => T.translate(`sponsor_list.import.${key}`, vars);

const rowShape = PropTypes.shape({
  row: PropTypes.number,
  company_input: PropTypes.string,
  action: PropTypes.string,
  company: PropTypes.shape({
    name: PropTypes.string,
    match: PropTypes.string
  }),
  duplicate_of_row: PropTypes.number,
  candidates: PropTypes.arrayOf(PropTypes.string),
  error: PropTypes.string
});

const ResultCell = ({ row }) => {
  if (row.action === "error") {
    return (
      <Typography variant="body2" color="error">
        {row.error}
      </Typography>
    );
  }
  return (
    <Typography variant="body2">
      {t(ACTION_LABEL_KEYS[row.action], { row: row.duplicate_of_row })}
    </Typography>
  );
};

ResultCell.propTypes = { row: rowShape.isRequired };

const MatchedCompanyCell = ({ row }) => {
  const { company, candidates } = row;
  return (
    <>
      {company?.match === "new" && (
        <Typography variant="body2">{t("new_company")}</Typography>
      )}
      {company && company.match !== "new" && (
        <Typography variant="body2">
          {company.name}
          {company.match === "normalized" &&
            company.name !== row.company_input && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                {t("normalized_hint")}
              </Typography>
            )}
        </Typography>
      )}
      {candidates.length > 0 && (
        <Typography variant="body2">{candidates.join(", ")}</Typography>
      )}
    </>
  );
};

MatchedCompanyCell.propTypes = { row: rowShape.isRequired };

const ImportSponsorsPopup = ({ onClose, onPreview, onImport }) => {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const requestGeneration = useRef(0);
  const inFlight = useRef(false);

  const isResult = !!report && !report.dry_run;
  const isPreview = !!report && report.dry_run;

  const changeFile = (newFile) => {
    requestGeneration.current += 1;
    setFile(newFile);
    setReport(null);
  };

  const run = (action) => {
    if (inFlight.current || !file) return Promise.resolve();
    inFlight.current = true;
    setIsSaving(true);
    const generation = requestGeneration.current;
    return action(file)
      .then((newReport) => {
        if (generation === requestGeneration.current) setReport(newReport);
      })
      .catch(() => {})
      .finally(() => {
        inFlight.current = false;
        setIsSaving(false);
      });
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  let primaryAction = {
    label: t("preview"),
    onClick: () => run(onPreview),
    disabled: !file || isSaving
  };
  if (isResult) {
    primaryAction = { label: t("close"), onClick: handleClose };
  } else if (isPreview) {
    primaryAction = {
      label: t("import"),
      onClick: () => run(onImport),
      disabled: report.summary.sponsors_created === 0 || isSaving
    };
  }

  const hasNormalizedMatch =
    !!report && report.rows.some((r) => r.company?.match === "normalized");

  return (
    <CustomDialog
      title={t("title")}
      open
      maxWidth="md"
      onClose={handleClose}
      primaryAction={primaryAction}
    >
      <Typography variant="body2" sx={{ mb: 1 }}>
        {t("format_intro")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">{t("format_company")}</Typography>
        <Typography variant="body2">{t("format_tier")}</Typography>
        <Typography variant="body2">{t("format_excel")}</Typography>
      </Box>
      <UploadInput
        value={file && file.name}
        handleUpload={changeFile}
        handleRemove={() => changeFile(null)}
        className="dropzone"
        multiple={false}
        accept=".csv"
      />
      {report && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {t(isResult ? "summary_result" : "summary_preview", report.summary)}
          </Typography>
          {isPreview && report.summary.errors > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {t("errors_skipped_warning")}
            </Alert>
          )}
          {isPreview && report.summary.sponsors_created === 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {t("nothing_to_import")}
            </Alert>
          )}
          {isResult && report.summary.not_attempted > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {t("stopped_warning", {
                not_attempted: report.summary.not_attempted
              })}
            </Alert>
          )}
          {hasNormalizedMatch && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("normalized_help")}
            </Typography>
          )}
          <Box sx={{ maxHeight: "50vh", overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t("col_row")}</TableCell>
                  <TableCell>{t("col_company")}</TableCell>
                  <TableCell>{t("col_match")}</TableCell>
                  <TableCell>{t("col_tiers")}</TableCell>
                  <TableCell>{t("col_result")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.rows.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.company_input}</TableCell>
                    <TableCell>
                      <MatchedCompanyCell row={row} />
                    </TableCell>
                    <TableCell>{row.tiers.join(", ")}</TableCell>
                    <TableCell>
                      <ResultCell row={row} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </CustomDialog>
  );
};

ImportSponsorsPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired
};

export default ImportSponsorsPopup;
