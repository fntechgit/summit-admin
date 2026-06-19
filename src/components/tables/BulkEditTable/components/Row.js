import React from "react";
import PropTypes from "prop-types";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import history from "../../../../history";
import Cell from "./Cell";
import styles from "../BulkEditTable.module.less";

// Same dimensions as openstack-uicore-foundation's mui-table.js ACTION_CELL_SX,
// plus `position: sticky` (unlike mui-table.js) so these columns stay visible
// while the many data columns scroll horizontally, matching the original table.
const ACTION_COLUMN_WIDTH = 40;

const CHECK_CELL_SX = {
  p: 0,
  textAlign: "center",
  verticalAlign: "middle",
  width: ACTION_COLUMN_WIDTH,
  minWidth: ACTION_COLUMN_WIDTH,
  maxWidth: ACTION_COLUMN_WIDTH,
  position: "sticky",
  left: 0,
  zIndex: 2,
  backgroundColor: "inherit"
};

const getActionCellSx = (rightOffset) => ({
  p: 0,
  textAlign: "center",
  verticalAlign: "middle",
  width: ACTION_COLUMN_WIDTH,
  minWidth: ACTION_COLUMN_WIDTH,
  maxWidth: ACTION_COLUMN_WIDTH,
  position: "sticky",
  right: rightOffset,
  zIndex: 2,
  backgroundColor: "inherit"
});

const getCellSx = (col, isEditingRow) => ({
  fontWeight: "normal",
  ...(isEditingRow && col.editableField ? { minWidth: 250 } : {}),
  ...(col.width
    ? { width: col.width, minWidth: col.width, maxWidth: col.width }
    : {})
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
    deleteRow,
    currentSummit,
    actions,
    formattingFunction
  } = props;

  const formattedData = formattingFunction(row, currentSummit);
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
      <TableCell align="center" sx={CHECK_CELL_SX}>
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
            sx={getCellSx(col, isEditingRow)}
            style={col.customStyle}
          >
            <Cell
              col={col}
              row={row}
              editRow={editRow}
              isEditingRow={isEditingRow}
              onChange={onRowChange}
              onRemoveOption={onRemoveOption}
              formattedData={formattedData}
            />
          </TableCell>
        ))}
      {actions?.edit && (
        <TableCell
          align="center"
          className={styles.dottedBorderLeft}
          sx={getActionCellSx(actions.delete ? ACTION_COLUMN_WIDTH : 0)}
        >
          <IconButton
            size="medium"
            onClick={() =>
              history.push(`/app/summits/${currentSummit.id}/events/${row.id}`)
            }
            sx={{ padding: 0 }}
            aria-label={`Edit event ${row.id}`}
          >
            <EditIcon fontSize="large" />
          </IconButton>
        </TableCell>
      )}
      {actions?.delete && (
        <TableCell
          align="center"
          className={styles.dottedBorderLeft}
          sx={getActionCellSx(0)}
        >
          <IconButton
            size="medium"
            onClick={() => deleteRow(row.id)}
            sx={{ padding: 0 }}
            aria-label={`Delete event ${row.id}`}
          >
            <DeleteIcon fontSize="large" />
          </IconButton>
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
  deleteRow: PropTypes.func,
  currentSummit: PropTypes.object,
  actions: PropTypes.object,
  formattingFunction: PropTypes.func.isRequired
};

export default Row;
