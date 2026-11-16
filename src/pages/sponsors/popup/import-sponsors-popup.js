import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Alert, Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import { downloadFileByContent } from "openstack-uicore-foundation/lib/utils/actions";

const CSV_TEMPLATE =
  "\"company\",\"tier\"\n\"Acme Robotics\",\"Gold\"\n\"Globex, Inc.\",\"Gold|Silver\"\n";
const TEMPLATE_FILE_NAME = "sponsors-template.csv";
const CSV_MIME = "text/csv;charset=utf-8";

const ACTION_LABEL_KEYS = {
  create: "sponsor_list.import.action_create",
  skip_existing_sponsor: "sponsor_list.import.action_skip_existing_sponsor",
  skip_duplicate: "sponsor_list.import.action_skip_duplicate",
  error: "sponsor_list.import.action_error",
  not_attempted: "sponsor_list.import.action_not_attempted"
};

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

const CODE_SX = {
  fontFamily: "monospace",
  fontSize: "0.85rem",
  bgcolor: "grey.100",
  px: 0.75,
  py: 0.25,
  borderRadius: 0.5
};

const ResultCell = ({ row, isResult }) => {
  if (row.error) {
    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <ErrorOutlineIcon color="error" fontSize="small" />
        <Typography variant="body1" color="error">
          {row.error}
        </Typography>
      </Box>
    );
  }
  const labelKey =
    isResult && row.action === "create"
      ? "sponsor_list.import.action_created"
      : ACTION_LABEL_KEYS[row.action];
  return (
    <Typography variant="body1">
      {T.translate(labelKey, { row: row.duplicate_of_row })}
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
        <Typography variant="body1">
          {T.translate("sponsor_list.import.new_company")}
        </Typography>
      )}
      {company && company.match !== "new" && (
        <Typography variant="body1">
          {company.name}
          {company.match === "normalized" &&
            company.name !== row.company_input && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                {T.translate("sponsor_list.import.normalized_hint")}
              </Typography>
            )}
        </Typography>
      )}
      {candidates.length > 0 && (
        <Typography variant="body1">{candidates.join(", ")}</Typography>
      )}
    </>
  );
};

MatchedCompanyCell.propTypes = { row: rowShape.isRequired };

const ImportSponsorsPopup = ({ onClose, onPreview, onImport }) => {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const requestGeneration = useRef(0);

  const isResult = !!report && !report.dry_run;
  const isPreview = !!report && report.dry_run;

  const changeFile = (newFile) => {
    requestGeneration.current += 1;
    setFile(newFile);
    setReport(null);
  };

  const run = (action) => {
    const generation = requestGeneration.current;
    return action(file).then((newReport) => {
      if (generation === requestGeneration.current) setReport(newReport);
    });
  };

  let primaryAction = {
    label: T.translate("sponsor_list.import.preview"),
    onClick: () => run(onPreview),
    disabled: !file
  };
  if (isResult) {
    primaryAction = {
      label: T.translate("sponsor_list.import.close"),
      onClick: onClose
    };
  } else if (isPreview) {
    primaryAction = {
      label: T.translate("sponsor_list.import.import"),
      onClick: () => run(onImport),
      disabled: report.summary.sponsors_created === 0
    };
  }

  const hasNormalizedMatch =
    !!report && report.rows.some((r) => r.company?.match === "normalized");

  const columns = [
    { columnKey: "row", header: T.translate("sponsor_list.import.col_row") },
    {
      columnKey: "company_input",
      header: T.translate("sponsor_list.import.col_company")
    },
    {
      columnKey: "company",
      header: T.translate("sponsor_list.import.col_match"),
      render: (r) => <MatchedCompanyCell row={r} />
    },
    {
      columnKey: "tiers",
      header: T.translate("sponsor_list.import.col_tiers"),
      render: (r) => r.tiers.join(", ")
    },
    {
      columnKey: "action",
      header: T.translate("sponsor_list.import.col_result"),
      render: (r) => <ResultCell row={r} isResult={isResult} />
    }
  ];
  // MuiTable keys rows by id; the CSV row number is unique per report
  const tableRows = report ? report.rows.map((r) => ({ ...r, id: r.row })) : [];

  return (
    <CustomDialog
      title={T.translate("sponsor_list.import.title")}
      open
      maxWidth="md"
      onClose={onClose}
      primaryAction={primaryAction}
    >
      <Typography variant="body1" sx={{ mb: 1.5 }}>
        {T.translate("sponsor_list.import.format_intro")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: 2,
          rowGap: 1,
          alignItems: "baseline",
          mb: 1.5
        }}
      >
        {[
          ["company", "sponsor_list.import.format_company"],
          ["tier", "sponsor_list.import.format_tier"]
        ].map(([column, descriptionKey]) => (
          <React.Fragment key={column}>
            <Box component="code" sx={CODE_SX}>
              {column}
            </Box>
            <Typography variant="body1">
              {T.translate(descriptionKey)}
            </Typography>
          </React.Fragment>
        ))}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {T.translate("sponsor_list.import.format_excel")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 0.5
        }}
      >
        <Typography variant="body1">
          {T.translate("sponsor_list.import.format_example")}
        </Typography>
        <Button
          size="small"
          onClick={() =>
            downloadFileByContent(TEMPLATE_FILE_NAME, CSV_TEMPLATE, CSV_MIME)
          }
        >
          {T.translate("sponsor_list.import.download_template")}
        </Button>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          mb: 2,
          p: 1.5,
          bgcolor: "grey.100",
          borderRadius: 1,
          fontFamily: "monospace",
          fontSize: "0.85rem"
        }}
      >
        {CSV_TEMPLATE}
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
            {T.translate(
              isResult
                ? "sponsor_list.import.summary_result"
                : "sponsor_list.import.summary_preview",
              report.summary
            )}
          </Typography>
          {isPreview && report.summary.errors > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {T.translate("sponsor_list.import.errors_skipped_warning")}
            </Alert>
          )}
          {isPreview && report.summary.sponsors_created === 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {T.translate("sponsor_list.import.nothing_to_import")}
            </Alert>
          )}
          {isPreview && report.summary.companies_created > 0 && (
            <Alert severity="info" sx={{ mb: 1 }}>
              {T.translate("sponsor_list.import.new_companies_warning", {
                companies_created: report.summary.companies_created
              })}
            </Alert>
          )}
          {isResult && report.summary.not_attempted > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {T.translate("sponsor_list.import.not_imported_warning", {
                not_attempted: report.summary.not_attempted
              })}
            </Alert>
          )}
          {hasNormalizedMatch && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              {T.translate("sponsor_list.import.normalized_help")}
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
