import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import Toolbar from "./components/Toolbar";
import Heading from "./components/Heading";
import Row from "./components/Row";
import useRowSelection from "./hooks/useRowSelection";
import styles from "./BulkEditTable.module.less";

const BulkEditTable = ({ options, columns, data, onSort, onUpdate }) => {
  const {
    selectedRows,
    isSelected,
    toggleRow,
    isAllSelected,
    toggleAll,
    editField,
    editEnabled,
    enterEditMode,
    cancel,
    reset
  } = useRowSelection();

  const dataIds = data.map((row) => row.id).join(",");

  // reset selection/edit state whenever the set of rows shown changes
  // (pagination, filtering, sorting, search, etc.)
  useEffect(() => {
    reset();
  }, [dataIds]);

  const getSortDir = (columnKey) =>
    columnKey === options.sortCol ? options.sortDir : null;

  const handleUpdateEvents = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    onUpdate(selectedRows)
      .then(() => reset())
      .catch((error) => {
        console.error("Error updating events:", error);
      });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Toolbar
        editEnabled={editEnabled}
        hasSelection={selectedRows.length > 0}
        onEdit={enterEditMode}
        onApply={handleUpdateEvents}
        onCancel={cancel}
      />
      <Paper elevation={0} sx={{ width: "100%", mb: 2 }}>
        <TableContainer
          component={Paper}
          className={styles.tableWrapper}
          sx={{ borderRadius: 0, boxShadow: "none" }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "#EAEDF4" }}>
              <TableRow>
                <TableCell
                  align="center"
                  className={styles.checkColumn}
                  sx={{ backgroundColor: "#EAEDF4" }}
                >
                  <Checkbox
                    checked={isAllSelected(data)}
                    onChange={() => toggleAll(data)}
                    slotProps={{ input: { "aria-label": "select all" } }}
                  />
                </TableCell>
                {columns.map((col, i) => {
                  const sortable = !!col.sortable;
                  const colWidth = col.width ?? "";

                  return (
                    <Heading
                      editEnabled={editEnabled}
                      onSort={onSort}
                      sortDir={getSortDir(col.columnKey)}
                      sortable={sortable}
                      columnIndex={i}
                      columnKey={col.columnKey}
                      width={colWidth}
                      key={`heading_${col.columnKey}`}
                    >
                      {col.label}
                    </Heading>
                  );
                })}
                {options.actions && (
                  <TableCell
                    align="center"
                    className={styles.actionColumn}
                    sx={{ backgroundColor: "#EAEDF4" }}
                  >
                    {options.actionsHeader || " "}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {columns.length > 0 &&
                data.map((row) => (
                  <Row
                    key={`row_${row.id}`}
                    row={row}
                    editEnabled={editEnabled}
                    isSelected={isSelected(row.id)}
                    editRow={selectedRows.find((r) => r.id === row.id) || row}
                    onToggle={() => toggleRow(row)}
                    onFieldChange={(key, value) =>
                      editField(row.id, key, value)
                    }
                    columns={columns}
                    actions={options.actions}
                  />
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

BulkEditTable.propTypes = {
  options: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  onSort: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default BulkEditTable;
