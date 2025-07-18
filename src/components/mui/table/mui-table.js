import * as React from "react";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { visuallyHidden } from "@mui/utils";

import styles from "./mui-table.module.less";

import {
  DEFAULT_PER_PAGE,
  TWENTY_PER_PAGE,
  FIFTY_PER_PAGE
} from "../../../utils/constants";

const MuiTable = ({
  columns = [],
  data = [],
  totalRows,
  perPage,
  currentPage,
  onRowEdit,
  onPageChange,
  onPerPageChange,
  onSort,
  options = { sortCol: "", sortDir: "" }
}) => {
  const handleChangePage = (_, newPage) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (ev) => {
    onPerPageChange(ev.target.value);
  };

  const { sortCol, sortDir } = options;

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={0} sx={{ width: "100%", mb: 2 }}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 0, boxShadow: "none" }}
        >
          <Table>
            {/* TABLE HEADER */}
            <TableHead sx={{ backgroundColor: "#EAEAEA" }}>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.columnKey}
                    sx={{
                      width: col.width,
                      minWidth: col.width,
                      maxWidth: col.width
                    }}
                    align={col.align ?? "left"}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortCol === col.columnKey}
                        direction={
                          sortCol === col.columnKey
                            ? sortDir === 1
                              ? "asc"
                              : "desc"
                            : "asc"
                        }
                        onClick={() => onSort(_, col.columnKey, sortDir * -1)}
                      >
                        {col.header}
                        {sortCol === col.columnKey ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDir === "-1"
                              ? T.translate("mui_table.sorted_desc")
                              : T.translate("mui_table.sorted_asc")}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      col.header
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* TABLE BODY */}
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex}>
                  {columns.map((col) => {
                    const cellContent = col.render
                      ? col.render(row, { onRowEdit })
                      : row[col.columnKey];

                    const cellClassName = col.className
                      ? styles[col.className] || col.className
                      : "";

                    return (
                      <TableCell
                        key={col.columnKey}
                        align={col.align ?? "left"}
                        className={cellClassName}
                      >
                        {cellContent}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              {/* No items */}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    {T.translate("mui_table.no_items")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        <TablePagination
          component="div"
          count={totalRows}
          rowsPerPageOptions={[
            DEFAULT_PER_PAGE,
            TWENTY_PER_PAGE,
            FIFTY_PER_PAGE
          ]}
          rowsPerPage={perPage}
          page={currentPage - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={T.translate("mui_table.rows_per_page")}
          sx={{
            ".MuiTablePagination-toolbar": {
              alignItems: "baseline",
              marginTop: "1.6rem"
            },
            ".MuiTablePagination-spacer": {
              display: "none"
            },
            ".MuiTablePagination-displayedRows": {
              marginLeft: "auto"
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default MuiTable;
