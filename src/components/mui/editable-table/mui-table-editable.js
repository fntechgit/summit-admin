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
import { IconButton, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { visuallyHidden } from "@mui/utils";

import {
  DEFAULT_PER_PAGE,
  FIFTY_PER_PAGE,
  TWENTY_PER_PAGE
} from "../../../utils/constants";
import showConfirmDialog from "../components/showConfirmDialog";

// Updated component to handle editable cells with hover edit icon
const EditableCell = ({ value, isEditing, onBlur }) => {
  const [inputValue, setInputValue] = React.useState(value);
  const [isHovering, setIsHovering] = React.useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onBlur(inputValue);
    }
  };

  if (isEditing) {
    return (
      <TextField
        autoFocus
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => {
          onBlur(inputValue);
        }}
        onKeyDown={handleKeyDown}
        size="small"
        fullWidth
        variant="standard"
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
      <span style={{ flex: 1 }}>{value}</span>
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
  options = { sortCol: "", sortDir: "" },
  getName = (item) => item.name,
  onEdit,
  onDelete,
  onCellChange // New prop for handling cell value changes
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

  const handleDelete = async (item) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("general.row_remove_warning")} ${getName(item)}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
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
  const handleCellBlur = (rowId, columnKey, newValue) => {
    if (onCellChange) {
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
                      maxWidth: col.width
                    }}
                    align={col.align ?? "left"}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortCol === col.columnKey}
                        direction={
                          sortCol === col.columnKey && sortDir === "-1"
                            ? "desc"
                            : "asc"
                        }
                        onClick={() => onSort(col.columnKey, sortDir * -1)}
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
                {onEdit && <TableCell sx={{ width: 40 }} />}
                {onDelete && <TableCell sx={{ width: 40 }} />}
              </TableRow>
            </TableHead>
            {/* TABLE BODY */}
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover>
                  {columns.map((col) => (
                    <TableCell
                      key={`${row.id}-${col.columnKey}`}
                      onClick={() => handleCellClick(row.id, col.columnKey)}
                      sx={{
                        cursor: col.editable ? "pointer" : "default",
                        padding: col.editable ? "8px 16px" : undefined // Ensure enough space for the edit icon
                      }}
                    >
                      {col.editable ? (
                        <EditableCell
                          value={row[col.columnKey]}
                          isEditing={
                            editingCell &&
                            editingCell.rowId === row.id &&
                            editingCell.columnKey === col.columnKey
                          }
                          onBlur={(newValue) =>
                            handleCellBlur(row.id, col.columnKey, newValue)
                          }
                        />
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        row[col.columnKey]
                      )}
                    </TableCell>
                  ))}
                  {onEdit && (
                    <TableCell>
                      <IconButton
                        onClick={() => onEdit(row)}
                        size="small"
                        aria-label={T.translate("general.edit")}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  )}
                  {onDelete && (
                    <TableCell>
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
