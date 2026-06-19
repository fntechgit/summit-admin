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
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  archiveInventoryItem,
  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  getInventoryItem,
  getInventoryItems,
  resetInventoryItemForm,
  saveInventoryItem,
  unarchiveInventoryItem
} from "../../../actions/inventory-item-actions";
import SponsorInventoryDialog from "../form-templates/sponsor-inventory-popup";
import { ImagePreviewCell } from "../../../components/image-preview-cell";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

const InventoryListPage = ({
  inventoryItems,
  currentInventoryItem,
  currentInventoryItemErrors,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  showArchived,
  totalInventoryItems,
  saveInventoryItem,
  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  getInventoryItems,
  getInventoryItem,
  archiveInventoryItem,
  unarchiveInventoryItem,
  resetInventoryItemForm
}) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    resetInventoryItemForm();
    setOpen(false);
  };

  useEffect(() => {
    getInventoryItems(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      showArchived
    );
  }, [getInventoryItems]);

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir, showArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getInventoryItems(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleSort = (key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir, showArchived);
  };

  const handleSearch = (searchTerm) => {
    getInventoryItems(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleShowArchivedForms = (ev) => {
    getInventoryItems(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleRowEdit = async (row) => {
    if (row) {
      getInventoryItem(row.id).then(() => setOpen(true));
    }
  };

  const handleNewInventoryItem = () => {
    resetInventoryItemForm();
    setOpen(true);
  };

  const handleInventorySave = (item) =>
    saveInventoryItem(item).then(() =>
      getInventoryItems(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        showArchived
      )
    );

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveInventoryItem(item)
      : archiveInventoryItem(item);

  const columns = [
    {
      columnKey: "code",
      header: T.translate("inventory_item_list.code_column_label"),
      width: 120,
      sortable: true,
      truncateText: true
    },
    {
      columnKey: "name",
      header: T.translate("inventory_item_list.name_column_label"),
      sortable: true
    },
    {
      columnKey: "hasImage",
      header: "",
      width: 40,
      align: "center",
      render: (row) => {
        const img = row.images?.[0];
        const imageUrl = img?.file_url ?? img?.file_path;

        if (!imageUrl) return null;

        return (
          <ImagePreviewCell
            imageUrl={imageUrl}
            itemName={row.name}
            uploadDate={img?.created}
          />
        );
      }
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3> {T.translate("inventory_item_list.inventory_items")}</h3>
      <Alert
        severity="info"
        sx={{
          justifyContent: "start",
          alignItems: "center",
          mb: 2
        }}
      >
        {T.translate("inventory_item_list.alert_info")}
      </Alert>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">{totalInventoryItems} items</Box>
        </Grid2>
        <Grid2
          container
          size={10}
          spacing={1}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={handleShowArchivedForms}
                  checked={showArchived}
                  inputProps={{
                    "aria-label": T.translate(
                      "inventory_item_list.show_archived"
                    )
                  }}
                />
              }
              label={T.translate("inventory_item_list.show_archived")}
            />
          </FormGroup>
          <Grid2 size={3}>
            <SearchInput
              onSearch={handleSearch}
              placeholder={T.translate(
                "inventory_item_list.placeholders.search_inventory_items"
              )}
            />
          </Grid2>
          <Button
            variant="contained"
            onClick={() => handleNewInventoryItem()}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("inventory_item_list.add_inventory_item")}
          </Button>
        </Grid2>
      </Grid2>

      {inventoryItems.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={inventoryItems}
            options={tableOptions}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalInventoryItems}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
          />
        </div>
      )}

      {open && (
        <SponsorInventoryDialog
          entity={currentInventoryItem}
          errors={currentInventoryItemErrors}
          onSave={handleInventorySave}
          onClose={handleClose}
          onMetaFieldTypeDeleted={deleteInventoryItemMetaFieldType}
          onMetaFieldTypeValueDeleted={deleteInventoryItemMetaFieldTypeValue}
          onImageDeleted={deleteInventoryItemImage}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentInventoryItemListState,
  currentInventoryItemState
}) => ({
  ...currentInventoryItemListState,
  currentInventoryItem: currentInventoryItemState.entity,
  currentInventoryItemErrors: currentInventoryItemState.errors
});

export default connect(mapStateToProps, {
  getInventoryItems,
  getInventoryItem,
  resetInventoryItemForm,
  saveInventoryItem,

  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  archiveInventoryItem,
  unarchiveInventoryItem
})(InventoryListPage);
