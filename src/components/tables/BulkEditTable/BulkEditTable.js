import React, { useEffect } from "react";
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
import { SORT_ASCENDING, SORT_DESCENDING } from "../../../utils/constants";
import styles from "./BulkEditTable.module.less";

const defaults = {
  sortFunc: (a, b) => {
    if (a < b) {
      return SORT_DESCENDING;
    }
    if (a > b) {
      return SORT_ASCENDING;
    }
    return 0;
  },
  sortable: false,
  sortCol: 0,
  sortDir: 1,
  colWidth: ""
};

function BulkEditTable(props) {
  const {
    options,
    columns,
    currentSummit,
    page,
    data,
    handleSort,
    updateData,
    handleDeleteRow,
    formattingFunction,
    afterUpdate = []
  } = props;

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

  // reset selection/edit state on data changes/pagination
  useEffect(() => {
    reset();
  }, [page]);

  const getSortDir = (columnKey, columnIndex, sortCol, sortDir) => {
    if (columnKey && columnKey === sortCol) {
      return sortDir;
    }
    if (sortCol === columnIndex) {
      return sortDir;
    }
    return null;
  };

  const handledAfterUpdateData = () => {
    const actionsAfterUpdate = [];
    if (afterUpdate.length > 0) {
      afterUpdate.forEach(({ action, propertyName }) => {
        selectedRows.forEach((row) => {
          if (Array.isArray(row[propertyName])) {
            row[propertyName].forEach((e) => {
              actionsAfterUpdate.push(action(e));
            });
          } else {
            actionsAfterUpdate.push(action(row[propertyName]));
          }
        });
      });
    }
    return Promise.all(actionsAfterUpdate);
  };

  const onUpdateEvents = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    updateData(currentSummit.id, selectedRows)
      .then(() => handledAfterUpdateData())
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
        onApply={onUpdateEvents}
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
                    inputProps={{ "aria-label": "select all" }}
                  />
                </TableCell>
                {columns.map((col, i) => {
                  const sortCol =
                    typeof options.sortCol !== "undefined"
                      ? options.sortCol
                      : defaults.sortCol;
                  const sortDir =
                    typeof options.sortDir !== "undefined"
                      ? options.sortDir
                      : defaults.sortDir;
                  const sortFunc =
                    typeof options.sortFunc !== "undefined"
                      ? options.sortFunc
                      : defaults.sortFunc;
                  const sortable =
                    typeof col.sortable !== "undefined"
                      ? col.sortable
                      : defaults.sortable;
                  const colWidth =
                    typeof col.width !== "undefined"
                      ? col.width
                      : defaults.colWidth;

                  return (
                    <Heading
                      editEnabled={editEnabled}
                      onSort={handleSort}
                      sortDir={getSortDir(col.columnKey, i, sortCol, sortDir)}
                      sortable={sortable}
                      sortFunc={sortFunc}
                      columnIndex={i}
                      columnKey={col.columnKey}
                      width={colWidth}
                      key={`heading_${col.columnKey}_${col.value}`}
                    >
                      {col.value}
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
                data.map((row, i) => {
                  if (Array.isArray(row) && row.length !== columns.length) {
                    console.warn(
                      `Data at row ${i} is ${row.length}. It should be ${columns.length}.`
                    );
                    return <TableRow key={`row_${row.id}`} />;
                  }

                  return (
                    <Row
                      key={`row_${row.id}`}
                      row={row}
                      currentSummit={currentSummit}
                      editEnabled={editEnabled}
                      isSelected={isSelected(row.id)}
                      editRow={selectedRows.find((r) => r.id === row.id) || row}
                      onToggle={() => toggleRow(row)}
                      onFieldChange={(key, value) =>
                        editField(row.id, key, value)
                      }
                      deleteRow={handleDeleteRow}
                      columns={columns}
                      actions={options.actions}
                      formattingFunction={formattingFunction}
                    />
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default BulkEditTable;
