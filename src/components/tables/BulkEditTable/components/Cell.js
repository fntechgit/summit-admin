import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import TextField from "@mui/material/TextField";

function Cell({
  col,
  row,
  editRow,
  isEditingRow,
  onChange,
  onRemoveOption,
  formattedData
}) {
  if (isEditingRow && col.editableField === true) {
    return (
      <TextField
        id={col.columnKey}
        placeholder={T.translate(
          `bulk_actions_page.placeholders.${col.columnKey}`
        )}
        multiline
        minRows={2}
        fullWidth
        size="small"
        onChange={onChange}
        value={editRow[col.columnKey] || ""}
      />
    );
  }

  if (isEditingRow && col.editableField) {
    // editableField functions may short-circuit (e.g. `cond && <Input />`) and
    // return `undefined` rather than `false`, which React rejects as a component return value.
    return (
      col.editableField({
        value:
          editRow[col.columnKey]?.id ||
          editRow[col.columnKey]?.value ||
          editRow[col.columnKey],
        onChange,
        row: editRow,
        rowData: editRow[col.columnKey],
        onRemoveOption
      }) ?? null
    );
  }

  if (col.render) {
    return col.render(row[col.columnKey], row) ?? null;
  }

  return (
    <span style={{ fontWeight: "normal" }}>
      {formattedData[col.columnKey] ?? null}
    </span>
  );
}

Cell.propTypes = {
  col: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  editRow: PropTypes.object.isRequired,
  isEditingRow: PropTypes.bool,
  onChange: PropTypes.func,
  onRemoveOption: PropTypes.func,
  formattedData: PropTypes.object
};

export default Cell;
