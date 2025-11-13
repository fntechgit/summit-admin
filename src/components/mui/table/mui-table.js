import * as React from "react";
import T from "i18n-react/dist/i18n-react";
import { isBoolean } from "lodash";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { visuallyHidden } from "@mui/utils";
import {
  DEFAULT_PER_PAGE,
  FIFTY_PER_PAGE,
  TWENTY_PER_PAGE
} from "../../../utils/constants";
import showConfirmDialog from "../showConfirmDialog";
import styles from "./mui-table.module.less";

const MuiTable = ({
  columns = [],
  data = [],
  totalRows,
  perPage,
  currentPage,
  onPageChange,
  onPerPageChange,
  onSort,
  options = { sortCol: "", sortDir: 1, disableProp: null }, // disableProp is the prop that will disable the row
  getName = (item) => item.name,
  onEdit,
  onDelete,
  deleteDialogTitle = null,
  deleteDialogBody = null
}) => {
  const handleChangePage = (_, newPage) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (ev) => {
    onPerPageChange(ev.target.value);
  };

  const basePerPageOptions = [
    DEFAULT_PER_PAGE,
    TWENTY_PER_PAGE,
    FIFTY_PER_PAGE
  ];

  const initialPerPage = React.useRef(perPage);

  let customPerPageOptions = basePerPageOptions.includes(initialPerPage.current)
    ? basePerPageOptions
    : [...basePerPageOptions, initialPerPage.current].sort((a, b) => a - b);

  // remove per page selection if no action passed
  if (!onPerPageChange) {
    customPerPageOptions = [initialPerPage.current];
  }

  const { sortCol, sortDir } = options;

  const handleDelete = async (item) => {
    const isConfirmed = await showConfirmDialog({
      title: deleteDialogTitle || T.translate("general.are_you_sure"),
      text:
        deleteDialogBody ||
        `${T.translate("general.row_remove_warning")} ${getName(item)}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      onDelete(item.id);
    }
  };

  const renderCell = (row, col) => {
    if (col.render) {
      return col.render(row);
    }

    if (isBoolean(row[col.columnKey])) {
      return row[col.columnKey] ? (
        <CheckIcon fontSize="large" />
      ) : (
        <CloseIcon fontSize="large" />
      );
    }

    return row[col.columnKey];
  };

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
                          sortCol === col.columnKey && sortDir === -1
                            ? "desc"
                            : "asc"
                        }
                        onClick={() => onSort(col.columnKey, sortDir * -1)}
                      >
                        {col.header}
                        {sortCol === col.columnKey ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDir === -1
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
                {onEdit && <TableCell sx={{ width: 40 }} />}
                {onDelete && <TableCell sx={{ width: 40 }} />}
              </TableRow>
            </TableHead>

            {/* TABLE BODY */}
            <TableBody>
              {data.map((row, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <TableRow key={`row-${idx}`}>
                  {/* Main content columns */}
                  {columns.map((col) => (
                    <TableCell
                      key={col.columnKey}
                      align={col.align ?? "left"}
                      className={`${
                        col.dottedBorder && styles.dottedBorderLeft
                      } ${col.className}`}
                      sx={{
                        ...(options.disableProp && row[options.disableProp]
                          ? {
                              backgroundColor: "background.light",
                              color: "text.disabled"
                            }
                          : {})
                      }}
                    >
                      {renderCell(row, col)}
                    </TableCell>
                  ))}
                  {/* Edit column */}
                  {onEdit && (
                    <TableCell
                      align="center"
                      className={styles.dottedBorderLeft}
                      sx={{
                        width: 40,
                        ...(options.disableProp && row[options.disableProp]
                          ? {
                              backgroundColor: "background.light",
                              color: "text.disabled"
                            }
                          : {})
                      }}
                    >
                      <IconButton size="large" onClick={() => onEdit(row)}>
                        <EditIcon fontSize="large" />
                      </IconButton>
                    </TableCell>
                  )}
                  {/* Delete column */}
                  {onDelete && (
                    <TableCell
                      align="center"
                      className={styles.dottedBorderLeft}
                      sx={{
                        width: 40,
                        ...(options.disableProp && row[options.disableProp]
                          ? {
                              backgroundColor: "background.light",
                              color: "text.disabled"
                            }
                          : {})
                      }}
                    >
                      <IconButton
                        size="large"
                        onClick={() => handleDelete(row)}
                      >
                        <DeleteIcon fontSize="large" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
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
          rowsPerPageOptions={customPerPageOptions}
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
