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
import { Box, Button, Divider, TextField, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from "@mui/x-data-grid";
import CustomTablePagination from "openstack-uicore-foundation/lib/components/mui/table/custom-table-pagination";
import showConfirmDialog from "./showConfirmDialog";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../../utils/constants";

// MUI DataGrid version of uicore's BulkEditTable: same props and the same
// select -> "Edit Selected" -> Apply flow, so callers can swap one for the
// other. Kept self-contained so it can move to Core UI later.

const COLUMN_MIN_WIDTH = 150;
const EDIT_COLUMN_MIN_WIDTH = 250;
const DESC_ORDER_DIR = -1;

// the grid uses arrows/space for cell navigation and row selection, which
// would otherwise swallow typing inside the bulk-edit inputs
const stopGridKeyDown = (ev) => ev.stopPropagation();

// toolbar buttons show only their icon; the label stays as tooltip/aria-label
const ICON_ONLY_BUTTON_SX = {
  minWidth: 0,
  "& .MuiButton-startIcon": { m: 0 }
};

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

// search icon that expands into the grid's quick filter; starts open when a
// search term is already applied, and collapses again when left empty
const ExpandableQuickFilter = ({ placeholder, term }) => {
  const [expanded, setExpanded] = useState(!!term);

  if (!expanded) {
    return (
      <Tooltip title={T.translate("general.search")}>
        <Button
          size="small"
          startIcon={<SearchIcon />}
          onClick={() => setExpanded(true)}
          aria-label={T.translate("general.search")}
          sx={ICON_ONLY_BUTTON_SX}
        />
      </Tooltip>
    );
  }

  return (
    <GridToolbarQuickFilter
      autoFocus
      placeholder={placeholder}
      quickFilterParser={(input) => (input ? [input] : [])}
      quickFilterFormatter={(values) => values.join(" ")}
      onBlur={(ev) => {
        if (!ev.target.value) setExpanded(false);
      }}
    />
  );
};

ExpandableQuickFilter.propTypes = {
  placeholder: PropTypes.string,
  term: PropTypes.string
};

ExpandableQuickFilter.defaultProps = {
  placeholder: "",
  term: ""
};

const Toolbar = ({
  filter,
  onExport,
  searchProps,
  editEnabled,
  selectedCount,
  onEditSelected,
  onApply,
  onCancel
}) => (
  <GridToolbarContainer
    sx={{ p: 1, gap: 1, borderBottom: 1, borderColor: "divider" }}
  >
    {editEnabled ? (
      <>
        <Button size="small" variant="contained" onClick={onApply}>
          {T.translate("general.apply_changes")}
        </Button>
        <Button size="small" variant="outlined" onClick={onCancel}>
          {T.translate("general.cancel")}
        </Button>
      </>
    ) : (
      <Button
        size="small"
        variant="contained"
        onClick={onEditSelected}
        disabled={selectedCount === 0}
      >
        {T.translate("general.edit_selected")}
        {selectedCount > 0 ? ` (${selectedCount})` : ""}
      </Button>
    )}
    <Box sx={{ flex: 1 }} />
    <GridToolbarColumnsButton
      slotProps={{ button: { sx: ICON_ONLY_BUTTON_SX } }}
    />
    {filter}
    {onExport && (
      <>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={T.translate("general.export")}>
          <Button
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={onExport}
            aria-label={T.translate("general.export")}
            sx={ICON_ONLY_BUTTON_SX}
          />
        </Tooltip>
      </>
    )}
    {searchProps && (
      <>
        <Divider orientation="vertical" flexItem />
        <ExpandableQuickFilter
          placeholder={searchProps.placeholder}
          term={searchProps.term}
        />
      </>
    )}
  </GridToolbarContainer>
);

// replaces the grid's footer with the uicore pagination BulkEditTable uses
const Footer = ({
  totalRows,
  perPage,
  currentPage,
  onPageChange,
  onPerPageChange
}) => (
  <Box sx={{ px: 2, borderTop: 1, borderColor: "divider" }}>
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

Footer.propTypes = {
  totalRows: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPerPageChange: PropTypes.func.isRequired
};

Toolbar.propTypes = {
  filter: PropTypes.node,
  onExport: PropTypes.func,
  searchProps: PropTypes.shape({
    placeholder: PropTypes.string,
    term: PropTypes.string
  }),
  editEnabled: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
  onEditSelected: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

Toolbar.defaultProps = {
  filter: null,
  onExport: null,
  searchProps: null
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
  filter,
  onExport,
  searchProps,
  noRowsLabel
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [editRows, setEditRows] = useState({});
  const [editEnabled, setEditEnabled] = useState(false);
  // the list always has a default order; only show the sort arrow once the
  // user has sorted a column themselves
  const [hasUserSorted, setHasUserSorted] = useState(false);

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
      // the action's error handler reports the failure; keep the edits so
      // the user can retry
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
      Number.isNaN(customMinWidth) ? COLUMN_MIN_WIDTH : customMinWidth,
      editEnabled && col.editableField ? EDIT_COLUMN_MIN_WIDTH : 0
    );

    return {
      field: col.columnKey,
      headerName: col.header ?? col.label ?? col.value,
      sortable: !!col.sortable,
      hideable: col.hideable ?? true,
      flex: 1,
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

  const sortModel =
    hasUserSorted && options.sortCol
      ? [
          {
            field: options.sortCol,
            sort: options.sortDir === DESC_ORDER_DIR ? "desc" : "asc"
          }
        ]
      : [];

  const handleSortModelChange = (model) => {
    if (model.length === 0) return;
    setHasUserSorted(true);
    const { field, sort } = model[0];
    onSort(
      columns.findIndex((col) => col.columnKey === field),
      field,
      sort === "desc" ? DESC_ORDER_DIR : DEFAULT_ORDER_DIR
    );
  };

  const filterModel = searchProps
    ? {
        items: [],
        quickFilterValues: searchProps.term ? [searchProps.term] : []
      }
    : undefined;

  const handleFilterModelChange = (model) => {
    const newTerm = (model.quickFilterValues ?? []).join(" ");
    if (newTerm !== (searchProps.term ?? "")) searchProps.onSearch(newTerm);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* top copy has no range text and is hidden on phones, as in BulkEditTable */}
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <CustomTablePagination
          totalRows={totalRows}
          perPage={perPage}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      </Box>
      {/* flex parent + maxHeight: the grid fits its rows, and once they
          outgrow the viewport it scrolls internally, keeping the column
          headers in view */}
      <Box sx={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <DataGrid
          rows={data}
          columns={gridColumns}
          getRowId={(row) => row[idKey]}
          getRowHeight={() => "auto"}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={setSelectedIds}
          isRowSelectable={() => !editEnabled}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          disableColumnFilter
          sortingMode="server"
          sortingOrder={["asc", "desc"]}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          disableColumnSorting={editEnabled}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={
            searchProps ? handleFilterModelChange : undefined
          }
          localeText={{
            toolbarColumns: "",
            ...(noRowsLabel && { noRowsLabel })
          }}
          slots={{ toolbar: Toolbar, footer: Footer }}
          slotProps={{
            footer: {
              totalRows,
              perPage,
              currentPage,
              onPageChange,
              onPerPageChange
            },
            toolbar: {
              filter,
              onExport,
              searchProps,
              editEnabled,
              selectedCount: selectedIds.length,
              onEditSelected: enterEditMode,
              onApply: handleApply,
              onCancel: reset
            }
          }}
          sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
        />
      </Box>
    </Box>
  );
};

BulkEditDataGrid.propTypes = {
  options: PropTypes.shape({
    sortCol: PropTypes.string,
    sortDir: PropTypes.number
  }).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({ columnKey: PropTypes.string.isRequired })
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
  deleteDialogBody: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  columnVisibilityModel: PropTypes.objectOf(PropTypes.bool),
  onColumnVisibilityModelChange: PropTypes.func,
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
  filter: null,
  onExport: null,
  searchProps: null,
  noRowsLabel: null
};

export default BulkEditDataGrid;
