/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  DataGrid,
  GRID_STRING_COL_DEF,
  GridActionsCellItem,
  useGridApiRef
} from "@mui/x-data-grid";
import CustomTablePagination from "openstack-uicore-foundation/lib/components/mui/table/custom-table-pagination";
import showConfirmDialog from "../showConfirmDialog";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  SORT_DESCENDING
} from "../../../utils/constants";
import Toolbar from "./components/toolbar";
import ColumnMenu from "./components/column-menu";

// MUI DataGrid version of uicore's BulkEditTable:
// same select -> "Edit Selected" -> Apply flow

const EDIT_COLUMN_MIN_WIDTH = 250;

// the grid uses arrows/space for cell navigation and row selection, which
// would otherwise swallow typing inside the bulk-edit inputs
const stopGridKeyDown = (ev) => ev.stopPropagation();

const renderEditor = (col, editRow, onChange) => {
  if (col.editableField === true) {
    return (
      <TextField
        id={col.columnKey}
        placeholder={col.placeholder || T.translate("placeholders.text")}
        multiline
        minRows={2}
        fullWidth
        size="small"
        onChange={(ev) => onChange(ev.target.value)}
        value={editRow[col.columnKey] ?? ""}
      />
    );
  }

  return (
    col.editableField({
      value:
        editRow[col.columnKey]?.id ??
        editRow[col.columnKey]?.value ??
        editRow[col.columnKey],
      onChange: (ev) => onChange(ev.target.value),
      row: editRow,
      rowData: editRow[col.columnKey]
    }) ?? null
  );
};

const BulkEditDataGrid = ({
  options,
  columns,
  data,
  onSort,
  onUpdate,
  idKey,
  totalRows,
  perPage,
  currentPage,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
  getName,
  deleteDialogBody,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  title,
  views,
  onAdd,
  addLabel,
  importItems,
  importLabel,
  filter,
  onExport,
  searchProps,
  noRowsLabel
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [editRows, setEditRows] = useState({});
  const [editEnabled, setEditEnabled] = useState(false);
  // the columns panel anchors to the column headers by default; anchor it to
  // its toolbar button instead
  const [columnsButtonEl, setColumnsButtonEl] = useState(null);
  const apiRef = useGridApiRef();
  // resized widths; the grid drops them whenever it gets new columns
  const [columnWidths, setColumnWidths] = useState({});

  // flex until a resize starts, then freeze widths so the others don't stretch
  useEffect(
    () =>
      apiRef.current.subscribeEvent("columnResizeStart", () =>
        setColumnWidths((current) => ({
          ...Object.fromEntries(
            apiRef.current
              .getVisibleColumns()
              .map((col) => [col.field, col.computedWidth])
          ),
          ...current
        }))
      ),
    []
  );

  const reset = () => {
    setSelectedIds([]);
    setEditRows({});
    setEditEnabled(false);
  };

  const dataIds = data.map((row) => row[idKey]).join(",");

  // reset selection/edit state whenever the set of rows shown changes
  // (pagination, filtering, sorting, search, etc.)
  useEffect(() => {
    reset();
  }, [dataIds]);

  const enterEditMode = () => {
    setEditRows(
      Object.fromEntries(
        data
          .filter((row) => selectedIds.includes(row[idKey]))
          .map((row) => [row[idKey], row])
      )
    );
    setEditEnabled(true);
  };

  const editField = (rowId, key, value) => {
    setEditRows((current) => ({
      ...current,
      [rowId]: { ...current[rowId], [key]: value }
    }));
  };

  const handleApply = () => {
    Promise.resolve(onUpdate(Object.values(editRows)))
      .then(() => reset())
      .catch(() => {});
  };

  const handleDelete = async (row) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text:
        typeof deleteDialogBody === "function"
          ? deleteDialogBody(getName(row))
          : `${T.translate("general.row_remove_warning")} ${getName(row)}`,
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) onDelete(row[idKey]);
  };

  const gridColumns = columns.map((col) => {
    const customMinWidth = parseFloat(col.customStyle?.minWidth);
    const minWidth = Math.max(
      // a page's min width is room for its editor, so only apply it while editing
      Number.isNaN(customMinWidth) || !editEnabled
        ? GRID_STRING_COL_DEF.minWidth
        : customMinWidth,
      editEnabled && col.editableField ? EDIT_COLUMN_MIN_WIDTH : 0
    );
    // a saved or page-given width is fixed; otherwise flex by the page's weight
    const width = columnWidths[col.columnKey] ?? col.width;

    return {
      field: col.columnKey,
      headerName: col.header ?? col.label ?? col.value,
      sortable: !!col.sortable,
      hideable: col.hideable ?? true,
      flex: width ? 0 : col.flex ?? 1,
      width,
      minWidth,
      renderCell: ({ row }) => {
        const rowId = row[idKey];

        if (editEnabled && col.editableField && editRows[rowId]) {
          return (
            <Box sx={{ width: "100%" }} onKeyDown={stopGridKeyDown}>
              {renderEditor(col, editRows[rowId], (value) =>
                editField(rowId, col.columnKey, value)
              )}
            </Box>
          );
        }

        if (col.render) return col.render(row[col.columnKey], row) ?? null;

        return row[col.columnKey] ?? null;
      }
    };
  });

  if (onEdit || onDelete) {
    gridColumns.push({
      field: "actions",
      type: "actions",
      headerName: T.translate("general.actions"),
      getActions: ({ row }) =>
        [
          onEdit && (
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label={T.translate("general.edit")}
              onClick={() => onEdit(row)}
            />
          ),
          onDelete && (
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon />}
              label={T.translate("general.delete")}
              onClick={() => handleDelete(row)}
            />
          )
        ].filter(Boolean)
    });
  }

  // like the other list grids, show the current order (kept in redux, so it
  // survives leaving the page) on its column
  const sortModel = options.sortCol
    ? [
        {
          field: options.sortCol,
          sort: options.sortDir === SORT_DESCENDING ? "desc" : "asc"
        }
      ]
    : [];

  const handleSortModelChange = (model) => {
    // "Unsort" (menu item or third header click): back to the API's default
    // order, reported as onSort(-1, null, null)
    if (model.length === 0) {
      onSort(-1, null, null);
      return;
    }
    const { field, sort } = model[0];
    onSort(
      columns.findIndex((col) => col.columnKey === field),
      field,
      sort === "desc" ? SORT_DESCENDING : DEFAULT_ORDER_DIR
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2
        }}
      >
        {title}
        {/* top copy has no range text and is hidden on phones, as in BulkEditTable */}
        <Box sx={{ display: { xs: "none", sm: "block" }, ml: "auto" }}>
          <CustomTablePagination
            totalRows={totalRows}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </Box>
      </Box>
      {/* flex parent + maxHeight: the grid fits its rows, and once they
          outgrow the viewport it scrolls internally, keeping the column
          headers in view */}
      <Box sx={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <DataGrid
          apiRef={apiRef}
          rows={data}
          columns={gridColumns}
          getRowId={(row) => row[idKey]}
          // rows truncate at MUI's default height; only rows being edited grow
          getRowHeight={({ id }) => (editRows[id] ? "auto" : null)}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={setSelectedIds}
          isRowSelectable={() => !editEnabled}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          onColumnWidthChange={({ colDef, width }) =>
            setColumnWidths((current) => ({
              ...current,
              [colDef.field]: width
            }))
          }
          disableColumnFilter
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          disableColumnSorting={editEnabled}
          localeText={{
            toolbarColumns: "",
            ...(noRowsLabel && { noRowsLabel })
          }}
          hideFooter
          slots={{ toolbar: Toolbar, columnMenu: ColumnMenu }}
          slotProps={{
            panel: { anchorEl: columnsButtonEl, placement: "bottom-end" },
            // bootstrap 3 sets box-sizing: border-box on input[type="search"],
            // which squeezes MUI's padding into the input's fixed height
            columnsManagement: {
              // the actions column should always be shown, so leave it out
              // of the list (and out of Show/Hide All)
              getTogglableColumns: (cols) =>
                cols
                  .filter((col) => col.field !== "actions")
                  .map((col) => col.field),
              searchInputProps: {
                sx: { "& .MuiInputBase-input": { boxSizing: "content-box" } }
              },
              sort: "asc"
            },
            toolbar: {
              views,
              onAdd,
              addLabel,
              importItems,
              importLabel,
              filter,
              onExport,
              searchProps,
              editEnabled,
              selectedCount: selectedIds.length,
              onEditSelected: enterEditMode,
              onApply: handleApply,
              onCancel: reset,
              setColumnsButtonEl
            }
          }}
          sx={{
            "& .MuiDataGrid-row--dynamicHeight > .MuiDataGrid-cell": { py: 1 }
          }}
        />
      </Box>
      <CustomTablePagination
        totalRows={totalRows}
        perPage={perPage}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        showRange
      />
    </Box>
  );
};

BulkEditDataGrid.propTypes = {
  options: PropTypes.shape({
    sortCol: PropTypes.string,
    sortDir: PropTypes.number
  }).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      columnKey: PropTypes.string.isRequired,
      width: PropTypes.number,
      flex: PropTypes.number
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onSort: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  idKey: PropTypes.string,
  totalRows: PropTypes.number,
  perPage: PropTypes.number,
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
  onPerPageChange: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  getName: PropTypes.func,
  deleteDialogBody: PropTypes.func,
  columnVisibilityModel: PropTypes.objectOf(PropTypes.bool),
  onColumnVisibilityModelChange: PropTypes.func,
  // page heading, shown on the same row as the top pagination
  title: PropTypes.node,
  // rendered next to "Edit Selected", e.g. a <SavedViews /> dropdown
  views: PropTypes.node,
  onAdd: PropTypes.func,
  // text of the add button
  addLabel: PropTypes.string,
  // options listed by the import icon's menu
  importItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired
    })
  ),
  // tooltip / aria-label of the import icon
  importLabel: PropTypes.string,
  // rendered in the grid toolbar, e.g. a uicore <GridFilter />
  filter: PropTypes.node,
  onExport: PropTypes.func,
  // same shape as GridToolbar's searchProps
  searchProps: PropTypes.shape({
    term: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    placeholder: PropTypes.string
  }),
  noRowsLabel: PropTypes.string
};

BulkEditDataGrid.defaultProps = {
  title: null,
  views: null,
  idKey: "id",
  totalRows: 0,
  perPage: DEFAULT_PER_PAGE,
  currentPage: DEFAULT_CURRENT_PAGE,
  onPageChange: () => {},
  onPerPageChange: () => {},
  onEdit: null,
  onDelete: null,
  getName: (row) => row.name,
  deleteDialogBody: null,
  columnVisibilityModel: undefined,
  onColumnVisibilityModelChange: undefined,
  onAdd: null,
  addLabel: "",
  importItems: [],
  importLabel: "",
  filter: null,
  onExport: null,
  searchProps: null,
  noRowsLabel: null
};

export default BulkEditDataGrid;
