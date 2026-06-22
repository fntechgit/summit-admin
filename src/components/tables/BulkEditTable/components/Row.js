import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Cell from "./Cell";
import styles from "../BulkEditTable.module.less";

const getCellStyle = (col, isEditingRow) => ({
  ...(isEditingRow && col.editableField ? { minWidth: 250 } : {}),
  ...(col.width
    ? { width: col.width, minWidth: col.width, maxWidth: col.width }
    : {}),
  ...col.customStyle
});

function Row(props) {
  const {
    row,
    columns,
    editEnabled,
    isSelected,
    editRow,
    onToggle,
    onFieldChange,
    actions
  } = props;

  const isEditingRow = isSelected && editEnabled;

  const onRowChange = (ev) => {
    const { value, id } = ev.target;

    if (id.includes("___")) {
      const [arrayProp, elementIdRaw, prop] = id.split("___"); // ['array property', '<element Id>', 'element property']
      const elementId = parseInt(elementIdRaw, 10);
      const arrayToChange = (editRow[arrayProp] || []).map((elem) =>
        elem.id === elementId ? { ...elem, [prop]: value } : elem
      );
      onFieldChange(arrayProp, arrayToChange);
    } else {
      onFieldChange(id, value);
    }
  };

  const onRemoveOption = (optionId, columnKey) => {
    const newOptions = (editRow[columnKey] || []).filter(
      (option) => option.id !== optionId
    );
    onFieldChange(columnKey, newOptions);
  };

  return (
    <TableRow role="row" hover>
      <TableCell
        align="center"
        className={styles.checkColumn}
        sx={{ backgroundColor: "#fff" }}
      >
        <Checkbox
          checked={isSelected}
          onChange={onToggle}
          inputProps={{ "aria-label": `Select row ${row.id}` }}
        />
      </TableCell>
      <TableCell sx={{ fontWeight: "normal" }}>{row.id}</TableCell>
      {columns
        .filter((col) => col.columnKey !== "id")
        .map((col) => (
          <TableCell
            key={`${row.id}_${col.columnKey}`}
            className={
              isEditingRow && col.editableField
                ? styles.bulkEditCol
                : styles.dataColumn
            }
            sx={{ fontWeight: "normal" }}
            style={getCellStyle(col, isEditingRow)}
          >
            <Cell
              col={col}
              row={row}
              editRow={editRow}
              isEditingRow={isEditingRow}
              onChange={onRowChange}
              onRemoveOption={onRemoveOption}
            />
          </TableCell>
        ))}
      {(actions?.edit || actions?.delete) && (
        <TableCell
          align="center"
          className={`${styles.actionColumn} ${styles.dottedBorderLeft}`}
          sx={{ backgroundColor: "#fff" }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            {actions.edit && (
              <IconButton
                size="medium"
                onClick={() => actions.edit.onClick(row)}
                sx={{ padding: 0 }}
                aria-label={`Edit event ${row.id}`}
              >
                <EditIcon fontSize="large" />
              </IconButton>
            )}
            {actions.delete && (
              <IconButton
                size="medium"
                onClick={() => actions.delete.onClick(row)}
                sx={{ padding: 0 }}
                aria-label={`Delete event ${row.id}`}
              >
                <DeleteIcon fontSize="large" />
              </IconButton>
            )}
          </Box>
        </TableCell>
      )}
    </TableRow>
  );
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  editEnabled: PropTypes.bool,
  isSelected: PropTypes.bool,
  editRow: PropTypes.object.isRequired,
  onToggle: PropTypes.func,
  onFieldChange: PropTypes.func,
  actions: PropTypes.object
};

export default Row;
