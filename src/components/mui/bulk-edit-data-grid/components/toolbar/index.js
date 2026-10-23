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

import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Divider, Tooltip } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { GridToolbarContainer } from "@mui/x-data-grid";
import MenuButton from "../../../menu-button";
import ColumnsButton from "../columns-button";
import ExpandableQuickFilter from "../expandable-quick-filter";
import { ICON_ONLY_BUTTON_SX } from "../../constants";

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

export default Toolbar;
