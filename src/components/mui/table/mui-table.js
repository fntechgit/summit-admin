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
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { visuallyHidden } from "@mui/utils";

import styles from "./mui-table.module.less";

import {
  DEFAULT_PER_PAGE,
  FIFTY_PER_PAGE,
  TWENTY_PER_PAGE
} from "../../../utils/constants";
import showConfirmDialog from "../components/showConfirmDialog";

const MuiTable = ({
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
  onReorder,
  idKey = "id",
  updateOrderKey = "order"
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

  const customPerPageOptions = basePerPageOptions.includes(
    initialPerPage.current
  )
    ? basePerPageOptions
    : [...basePerPageOptions, initialPerPage.current].sort((a, b) => a - b);

  const { sortCol, sortDir } = options;

  const handleDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index)
      return;

    const reordered = [...data];
    const [movedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, movedItem);

    // change value based on updateOrderKey
    if (updateOrderKey) {
      reordered.forEach((item, idx) => {
        item[updateOrderKey] = idx + 1;
      });
    }

    const movedItemId = movedItem.id;
    const newOrder = reordered.find(
      (item) => item[idKey || "id"] === movedItemId
    )?.[updateOrderKey];

    onReorder?.(reordered, movedItemId, newOrder);
  };

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
                {onEdit && <TableCell sx={{ width: 40 }} />}
                {onDelete && <TableCell sx={{ width: 40 }} />}
                {onReorder && <TableCell sx={{ width: 40 }} />}
              </TableRow>
            </TableHead>

            {/* TABLE BODY */}
            {onReorder ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="mui-table-droppable">
                  {(droppableProvided) => (
                    <TableBody
                      ref={droppableProvided.innerRef}
                      {...droppableProvided.droppableProps}
                    >
                      {data.map((row, rowIndex) => (
                        <Draggable
                          key={row[idKey] || rowIndex}
                          draggableId={String(row[idKey] || rowIndex)}
                          index={rowIndex}
                        >
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                ...(snapshot.isDragging
                                  ? {
                                      display: "table",
                                      width: "100%",
                                      tableLayout: "fixed",
                                      backgroundColor: "#f0f0f0",
                                      transform: "scale(1.01)",
                                      boxShadow:
                                        "0 4px 12px rgba(0, 0, 0, 0.1)",
                                      zIndex: 1,
                                      position: "relative",
                                      transition:
                                        "transform 0.2s ease, background-color 0.2s ease"
                                    }
                                  : {
                                      transition: "background-color 0.2s ease"
                                    })
                              }}
                            >
                              {/* Main content columns */}
                              {columns.map((col) => (
                                <TableCell
                                  key={col.columnKey}
                                  align={col.align ?? "left"}
                                  className={`${
                                    col.dottedBorder && styles.dottedBorderLeft
                                  } ${col.className}`}
                                >
                                  {col.render?.(row) || row[col.columnKey]}
                                </TableCell>
                              ))}
                              {/* Edit column */}
                              {onEdit && (
                                <TableCell
                                  align="center"
                                  sx={{ width: 40 }}
                                  className={styles.dottedBorderLeft}
                                >
                                  <IconButton
                                    size="large"
                                    onClick={() => onEdit(row)}
                                  >
                                    <EditIcon fontSize="large" />
                                  </IconButton>
                                </TableCell>
                              )}
                              {/* Delete column */}
                              {onDelete && (
                                <TableCell
                                  align="center"
                                  sx={{ width: 40 }}
                                  className={styles.dottedBorderLeft}
                                >
                                  <IconButton
                                    size="large"
                                    onClick={() => handleDelete(row)}
                                  >
                                    <DeleteIcon fontSize="large" />
                                  </IconButton>
                                </TableCell>
                              )}
                              {/* Re order column */}
                              {onReorder && (
                                <TableCell
                                  align="center"
                                  sx={{ width: 40 }}
                                  className={styles.dottedBorderLeft}
                                  {...provided.dragHandleProps}
                                >
                                  <IconButton size="large">
                                    <UnfoldMoreIcon fontSize="large" />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {droppableProvided.placeholder}
                      {data.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={columns.length} align="center">
                            {T.translate("mui_table.no_items")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={row[idKey] || rowIndex}>
                    {/* Main content columns */}
                    {/* Main content columns */}
                    {columns.map((col) => (
                      <TableCell
                        key={col.columnKey}
                        align={col.align ?? "left"}
                        className={`${
                          col.dottedBorder && styles.dottedBorderLeft
                        } ${col.className}`}
                      >
                        {col.render?.(row) || row[col.columnKey]}
                      </TableCell>
                    ))}
                    {/* Edit column */}
                    {onEdit && (
                      <TableCell
                        align="center"
                        sx={{ width: 40 }}
                        className={styles.dottedBorderLeft}
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
                        sx={{ width: 40 }}
                        className={styles.dottedBorderLeft}
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
            )}
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
