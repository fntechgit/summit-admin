import * as React from "react";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { IconButton, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { visuallyHidden } from "@mui/utils";
import styles from "./mui-table-editable.module.less";

import {
  DEFAULT_PER_PAGE,
  FIFTY_PER_PAGE,
  TWENTY_PER_PAGE
} from "../../../utils/constants";
import showConfirmDialog from "../showConfirmDialog";

const ARCHIVED_CELL_SX = {
  backgroundColor: "background.light",
  color: "text.disabled"
};

const validateValue = (value, validation) => {
  if (!validation) return { isValid: true };

  // validate with yup schema
  if (
    validation.schema &&
    typeof validation.schema.validateSync === "function"
  ) {
    try {
      validation.schema.validateSync(value);
      return { isValid: true, message: null };
    } catch (err) {
      return { isValid: false, message: err.message };
    }
  }

  return { isValid: true };
};

// Updated component to handle editable cells with hover edit icon
const EditableCell = ({ value, isEditing, onBlur, validation }) => {
  const [inputValue, setInputValue] = React.useState(value);
  const [isHovering, setIsHovering] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setInputValue(value);
    setError(null);
  }, [value]);

  const handleValidationAndSave = (newValue) => {
    const { isValid, message } = validateValue(newValue, validation);

    if (isValid) {
      setError(null);
      onBlur(newValue, true);
    } else {
      setError(message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidationAndSave(inputValue);
    }
  };

  if (isEditing) {
    return (
      <TextField
        autoFocus
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (error) setError(null);
        }}
        onBlur={() => {
          handleValidationAndSave(inputValue);
        }}
        onKeyDown={handleKeyDown}
        size="small"
        fullWidth
        variant="standard"
        error={!!error}
        helperText={error}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width: "100%",
        height: "100%"
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span style={{ flex: 1, fontWeight: "normal" }}>{value}</span>
      {isHovering && (
        <EditIcon
          fontSize="small"
          sx={{
            opacity: 0.5,
            position: "absolute",
            right: 0,
            "&:hover": {
              opacity: 1
            }
          }}
        />
      )}
    </Box>
  );
};

const MuiTableEditable = ({
  columns = [],
  data = [],
  totalRows,
  perPage,
  currentPage,
  onPageChange,
  onPerPageChange,
  onSort,
  options = { sortCol: "", sortDir: 1, disableProp: null },
  getName = (item) => item.name,
  onEdit,
  onArchive,
  onDelete,
  onCellChange, // New prop for handling cell value changes
  deleteDialogBody
}) => {
  // State to track which cell is currently being edited
  const [editingCell, setEditingCell] = React.useState(null);

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

  const customPerPageOptions = basePerPageOptions.includes(perPage)
    ? basePerPageOptions
    : [...basePerPageOptions, perPage].sort((a, b) => a - b);

  const { sortCol, sortDir } = options;

  const getArchivedCellSx = (row) =>
    options.disableProp && row[options.disableProp] ? ARCHIVED_CELL_SX : null;

  const getCellSx = (row, baseSx = {}) => ({
    ...baseSx,
    ...(getArchivedCellSx(row) || {})
  });

  const handleDelete = async (item) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: deleteDialogBody
        ? deleteDialogBody(getName(item))
        : `${T.translate("general.row_remove_warning")} ${getName(item)}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "warning",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      onDelete(item.id);
    }
  };

  // Handler for starting edit mode on a cell
  const handleCellClick = (rowId, columnKey) => {
    // Check if the column is editable
    const column = columns.find((col) => col.columnKey === columnKey);
    if (column && column.editable) {
      setEditingCell({ rowId, columnKey });
    }
  };

  // Handler for saving changes when editing is complete
  const handleCellBlur = (rowId, columnKey, newValue, isValid) => {
    if (onCellChange && isValid) {
      onCellChange(rowId, columnKey, newValue);
    }
    setEditingCell(null);
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
                      maxWidth: col.width,
                      fontWeight: "normal"
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
                        sx={{ fontWeight: "normal" }}
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
                      <span style={{ fontWeight: "normal" }}>{col.header}</span>
                    )}
                  </TableCell>
                ))}
                {onEdit && (
                  <TableCell sx={{ width: 40, fontWeight: "normal" }} />
                )}
                {onArchive && (
                  <TableCell sx={{ width: 80, fontWeight: "normal" }} />
                )}
                {onDelete && (
                  <TableCell sx={{ width: 40, fontWeight: "normal" }} />
                )}
              </TableRow>
            </TableHead>
            {/* TABLE BODY */}
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell
                      key={`${row.id}-${col.columnKey}`}
                      onClick={() => handleCellClick(row.id, col.columnKey)}
                      sx={getCellSx(row, {
                        cursor: col.editable ? "pointer" : "default",
                        padding: col.editable ? "8px 16px" : undefined,
                        fontWeight: "normal"
                      })}
                    >
                      {col.editable ? (
                        <EditableCell
                          value={row[col.columnKey]}
                          isEditing={
                            editingCell &&
                            editingCell.rowId === row.id &&
                            editingCell.columnKey === col.columnKey
                          }
                          onBlur={(newValue, isValid) =>
                            handleCellBlur(
                              row.id,
                              col.columnKey,
                              newValue,
                              isValid
                            )
                          }
                          validation={col.validation}
                        />
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        <span style={{ fontWeight: "normal" }}>
                          {row[col.columnKey]}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  {onEdit && (
                    <TableCell
                      sx={getCellSx(row)}
                      className={styles.dottedBorderLeft}
                    >
                      <IconButton
                        onClick={() => onEdit(row)}
                        size="small"
                        aria-label={T.translate("general.edit")}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  )}
                  {onArchive && (
                    <TableCell
                      align="center"
                      sx={{
                        ...getCellSx(row, { width: 80, fontWeight: "normal" })
                      }}
                      className={styles.dottedBorderLeft}
                    >
                      <Button
                        variant="text"
                        color="inherit"
                        size="small"
                        onClick={() => onArchive(row)}
                        sx={{
                          fontSize: "1.3rem",
                          fontWeight: "normal",
                          lineHeight: "2.2rem",
                          padding: "4px 5px",
                          color: "rgba(0,0,0,0.56)"
                        }}
                      >
                        {row.is_archived
                          ? T.translate("general.unarchive")
                          : T.translate("general.archive")}
                      </Button>
                    </TableCell>
                  )}
                  {onDelete && (
                    <TableCell
                      sx={getCellSx(row)}
                      className={styles.dottedBorderLeft}
                    >
                      <IconButton
                        onClick={() => handleDelete(row)}
                        size="small"
                        aria-label={T.translate("general.delete")}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={customPerPageOptions}
          component="div"
          count={totalRows ?? data.length}
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

export default MuiTableEditable;
