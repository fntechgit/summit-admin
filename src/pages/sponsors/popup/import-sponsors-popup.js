import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Alert, Box, Link, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";

// Shown as the format example and offered as the downloadable template
export const CSV_TEMPLATE =
  "company,tier\nAcme Robotics,Gold\n\"Globex, Inc.\",Gold|Silver\n";
const TEMPLATE_FILE_NAME = "sponsors-template.csv";

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

// Global page CSS bolds Typography paragraphs; keep cells at the table's weight
const CELL_TEXT_SX = { fontWeight: "inherit" };

const ResultCell = ({ row, isResult }) => {
  if (row.error) {
    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <ErrorOutlineIcon color="error" fontSize="small" />
        <Typography variant="body2" color="error" sx={CELL_TEXT_SX}>
          {row.error}
        </Typography>
      </Box>
    );
  }
  const labelKey =
    isResult && row.action === "create"
      ? "action_created"
      : ACTION_LABEL_KEYS[row.action];
  return (
    <Typography variant="body2" sx={CELL_TEXT_SX}>
      {t(labelKey, { row: row.duplicate_of_row })}
    </Typography>
  );
};

ResultCell.propTypes = {
  row: rowShape.isRequired,
  isResult: PropTypes.bool.isRequired
};

const MatchedCompanyCell = ({ row }) => {
  const { company, candidates } = row;
  return (
    <>
      {company?.match === "new" && (
        <Typography variant="body2" sx={CELL_TEXT_SX}>
          {t("new_company")}
        </Typography>
      )}
      {company && company.match !== "new" && (
        <Typography variant="body2" sx={CELL_TEXT_SX}>
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
        <Typography variant="body2" sx={CELL_TEXT_SX}>
          {candidates.join(", ")}
        </Typography>
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

  const columns = [
    { columnKey: "row", header: t("col_row") },
    { columnKey: "company_input", header: t("col_company") },
    {
      columnKey: "company",
      header: t("col_match"),
      render: (r) => <MatchedCompanyCell row={r} />
    },
    {
      columnKey: "tiers",
      header: t("col_tiers"),
      render: (r) => r.tiers.join(", ")
    },
    {
      columnKey: "action",
      header: t("col_result"),
      render: (r) => <ResultCell row={r} isResult={isResult} />
    }
  ];
  // MuiTable keys rows by id; the CSV row number is unique per report
  const tableRows = report ? report.rows.map((r) => ({ ...r, id: r.row })) : [];

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
      <Box
        component="pre"
        sx={{
          m: 0,
          mb: 1,
          p: 1.5,
          bgcolor: "grey.100",
          borderRadius: 1,
          fontFamily: "monospace",
          fontSize: "0.85rem"
        }}
      >
        {CSV_TEMPLATE}
      </Box>
      <Box sx={{ mb: 2 }}>
        <Link
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(
            CSV_TEMPLATE
          )}`}
          download={TEMPLATE_FILE_NAME}
          variant="body2"
        >
          {t("download_template")}
        </Link>
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
        // UploadInput floats its selected-file box (col-md-6), so clear it
        <Box sx={{ mt: 2, clear: "both" }}>
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
          <MuiTable columns={columns} data={tableRows} />
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
