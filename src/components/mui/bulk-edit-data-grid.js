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

import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Divider, TextField, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SearchIcon from "@mui/icons-material/Search";
import {
  DataGrid,
  GridActionsCellItem,
  GridColumnMenu,
  GridColumnMenuHideItem,
  GridPreferencePanelsValue,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  gridPreferencePanelStateSelector,
  useGridApiContext,
  useGridSelector
} from "@mui/x-data-grid";
import CustomTablePagination from "openstack-uicore-foundation/lib/components/mui/table/custom-table-pagination";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import MenuButton from "./menu-button";
import showConfirmDialog from "./showConfirmDialog";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  SORT_DESCENDING
} from "../../utils/constants";

// MUI DataGrid version of uicore's BulkEditTable:
// same select -> "Edit Selected" -> Apply flow

const COLUMN_MIN_WIDTH = 150;
const EDIT_COLUMN_MIN_WIDTH = 250;
const SEARCH_WIDTH = 250;

// the grid uses arrows/space for cell navigation and row selection, which
// would otherwise swallow typing inside the bulk-edit inputs
const stopGridKeyDown = (ev) => ev.stopPropagation();

// icon-only toolbar buttons; the label stays as tooltip/aria-label
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

// search icon that expands into uicore's SearchInput
const ExpandableQuickFilter = ({ placeholder, term, onSearch }) => {
  const [expanded, setExpanded] = useState(!!term);
  const searchRef = useRef(null);
  const focusOnOpenRef = useRef(false);

  // SearchInput takes no autoFocus, so focus its input once opened from the
  // icon (but not when it starts open with a term)
  useEffect(() => {
    if (expanded && focusOnOpenRef.current) {
      searchRef.current.querySelector("input").focus();
      focusOnOpenRef.current = false;
    }
  }, [expanded]);

  if (!expanded) {
    return (
      <Tooltip title={T.translate("general.search")}>
        <Button
          size="small"
          startIcon={<SearchIcon />}
          onClick={() => {
            focusOnOpenRef.current = true;
            setExpanded(true);
          }}
          aria-label={T.translate("general.search")}
          sx={ICON_ONLY_BUTTON_SX}
        />
      </Tooltip>
    );
  }

  return (
    <Box
      ref={searchRef}
      sx={{ width: SEARCH_WIDTH }}
      // SearchInput takes no onBlur either; collapse once focus leaves both
      // its input and its clear button with nothing typed
      onBlur={(ev) => {
        if (ev.currentTarget.contains(ev.relatedTarget)) return;
        if (!ev.currentTarget.querySelector("input").value) setExpanded(false);
      }}
    >
      <SearchInput term={term} placeholder={placeholder} onSearch={onSearch} />
    </Box>
  );
};

ExpandableQuickFilter.propTypes = {
  placeholder: PropTypes.string,
  term: PropTypes.string,
  onSearch: PropTypes.func.isRequired
};

ExpandableQuickFilter.defaultProps = {
  placeholder: "",
  term: ""
};

// the column menu's columns item is "Hide column" + "Manage columns"; keep
// only hide (the toolbar has the columns panel), and drop the item entirely
// for columns that can't be hidden so their menu has no empty section
const ColumnMenu = (props) => {
  const { colDef } = props;
  return (
    <GridColumnMenu
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      slots={{
        columnMenuColumnsItem:
          colDef.hideable === false ? null : GridColumnMenuHideItem
      }}
    />
  );
};

ColumnMenu.propTypes = {
  colDef: PropTypes.shape({ hideable: PropTypes.bool }).isRequired
};

// clicking the button while its panel is open should close it, but React 16
// runs the button's handlers on document, next to the panel's click-away
// listener, so the button can't stop it: the panel closes on pointerup and the
// button's click reopens it. Remember whether it was open when the press
// started and close it again after the click.
const ColumnsButton = ({ buttonRef }) => {
  const apiRef = useGridApiContext();
  const preferencePanel = useGridSelector(
    apiRef,
    gridPreferencePanelStateSelector
  );
  const wasOpenRef = useRef(false);

  return (
    <GridToolbarColumnsButton
      ref={buttonRef}
      slotProps={{
        button: {
          sx: ICON_ONLY_BUTTON_SX,
          onPointerDown: () => {
            wasOpenRef.current =
              preferencePanel.open &&
              preferencePanel.openedPanelValue ===
                GridPreferencePanelsValue.columns;
          },
          onClick: () => {
            if (wasOpenRef.current) apiRef.current.hidePreferences();
            wasOpenRef.current = false;
          }
        }
      }}
    />
  );
};

ColumnsButton.propTypes = {
  buttonRef: PropTypes.func.isRequired
};

const Toolbar = ({
  views,
  onAdd,
  addLabel,
  importItems,
  importLabel,
  filter,
  onExport,
  searchProps,
  editEnabled,
  selectedCount,
  onEditSelected,
  onApply,
  onCancel,
  setColumnsButtonEl
}) => (
  <GridToolbarContainer
    sx={{ p: 1, gap: 1, borderBottom: 1, borderColor: "divider" }}
  >
    {editEnabled ? (
      <>
        <Button size="small" variant="contained" onClick={onApply}>
          {T.translate("bulk_edit_table.apply_changes")}
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
    {views}
    <Box sx={{ flex: 1 }} />
    {onAdd && (
      <Button size="small" onClick={onAdd}>
        {addLabel}
      </Button>
    )}
    {importItems.length > 0 && (
      <MenuButton
        buttonId="bulk-edit-data-grid-import-button"
        menuId="bulk-edit-data-grid-import-menu"
        menuItems={importItems}
        size="small"
        aria-label={importLabel}
        // same startIcon slot as Export so both icons render at the same size
        startIcon={
          <Tooltip title={importLabel}>
            <FileUploadIcon />
          </Tooltip>
        }
        sx={ICON_ONLY_BUTTON_SX}
      />
    )}
    {(onAdd || importItems.length > 0) && (
      <Divider orientation="vertical" flexItem />
    )}
    <ColumnsButton buttonRef={setColumnsButtonEl} />
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
          onSearch={searchProps.onSearch}
        />
      </>
    )}
  </GridToolbarContainer>
);

Toolbar.propTypes = {
  views: PropTypes.node,
  onAdd: PropTypes.func,
  addLabel: PropTypes.string,
  importItems: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string, onClick: PropTypes.func })
  ),
  importLabel: PropTypes.string,
  filter: PropTypes.node,
  onExport: PropTypes.func,
  searchProps: PropTypes.shape({
    placeholder: PropTypes.string,
    term: PropTypes.string,
    onSearch: PropTypes.func.isRequired
  }),
  editEnabled: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
  onEditSelected: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  setColumnsButtonEl: PropTypes.func.isRequired
};

Toolbar.defaultProps = {
  views: null,
  onAdd: null,
  addLabel: "",
  importItems: [],
  importLabel: "",
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
              }
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
          sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
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
