/**
 * Copyright 2024 OpenStack Foundation
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
// import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2,
  TextField
} from "@mui/material";
import Box from "@mui/material/Box";
// import Table from "@mui/material/Table";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import {
  getInventoryItems,
  getInventoryItem,
  saveInventoryItem,
  deleteInventoryItem,
  deleteInventoryItemImage,
  resetInventoryItemForm
} from "../../actions/inventory-item-actions";
import InventoryTable from "../../components/mui/table/inventory-table";
import SponsorInventoryDialog from "../../components/mui/popup/sponsor-inventory-popup";

const InventoryListPageMUI = ({
  inventoryItems,
  selectedInventoryItem,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalInventoryItems,
  history,
  saveInventoryItem,
  deleteInventoryItem,
  deleteInventoryItemImage,
  getInventoryItems,
  getInventoryItem,
  resetInventoryItemForm
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    getInventoryItems(term, currentPage, perPage, order, orderDir);
  }, []);

  const handleEdit = (itemId) => {
    history.push(`/app/inventory/${itemId}`);
  };

  const handleDelete = (itemId) => {
    const inventoryItem = inventoryItems.find((s) => s.id === itemId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "inventory_item_list.delete_inventory_item_warning"
      )} ${inventoryItem.name}?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteInventoryItem(itemId);
      }
    });
  };

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (ev) => {
    console.log("CHECK TERM", searchTerm);
    if (ev.key === "Enter") {
      getInventoryItems(searchTerm, currentPage, perPage, order, orderDir);
    }
  };

  const handleRowEdit = (row) => {
    if (row) getInventoryItem(row.id);
    setOpen(true);
  };

  const handleNewInventoryItem = () => {
    resetInventoryItemForm();
    setOpen(true);
  };

  const handleInventorySave = (item) => {
    saveInventoryItem(item).then(() =>
      getInventoryItems(term, currentPage, perPage, order, orderDir)
    );
    setOpen(false);
  };

  const handleRemoveFile = (file, inventoryId) => {
    deleteInventoryItemImage(file.id, inventoryId);
  };

  const handleMetaFieldTypeDelete = () => {};

  const handleMetaFieldTypeValueDelete = () => {};

  const columns = [
    { columnKey: "id", value: "Id", sortable: true },
    {
      columnKey: "code",
      value: T.translate("inventory_item_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      value: T.translate("inventory_item_list.name_column_label"),
      sortable: true
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("inventory_item_list.inventory_items")} (
        {totalInventoryItems}){" "}
      </h3>
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
        <Grid2 size={6}>
          <Box component="span">{totalInventoryItems} items</Box>
        </Grid2>
        <Grid2
          container
          size={6}
          spacing={1}
          sx={{
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={(ev) =>
                      console.log("CHECK BOX", ev.target.checked)
                    }
                    inputProps={{
                      "aria-label": T.translate(
                        "inventory_item_list.hide_archived"
                      )
                    }}
                  />
                }
                label={T.translate("inventory_item_list.hide_archived")}
              />
            </FormGroup>
          </Grid2>
          <Grid2 size={4}>
            <TextField
              variant="outlined"
              value={searchTerm}
              placeholder={T.translate(
                "inventory_item_list.placeholders.search_inventory_items"
              )}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }
              }}
              onChange={() => setSearchTerm(event.target.value)}
              onKeyDown={handleSearch}
            />
          </Grid2>
          <Grid2 size={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleNewInventoryItem}
              startIcon={<AddIcon />}
            >
              {T.translate("inventory_item_list.add_inventory_item")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

      {inventoryItems.length > 0 && (
        <div>
          <InventoryTable
            columns={columns}
            data={inventoryItems}
            options={table_options}
            perPage={perPage}
            currentPage={currentPage}
            onRowEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}

      <SponsorInventoryDialog
        initialValues={selectedInventoryItem}
        open={open}
        onSave={handleInventorySave}
        onClose={handleClose}
        onMetaFieldTypeDeleted={handleMetaFieldTypeDelete}
        onMetaFieldTypeValueDeleted={handleMetaFieldTypeValueDelete}
        onImageDeleted={handleRemoveFile}
        onRemoveFile={handleRemoveFile}
      />
    </div>
  );
};

const mapStateToProps = ({
  currentInventoryItemListState,
  currentInventoryItemState
}) => ({
  ...currentInventoryItemListState,
  selectedInventoryItem: currentInventoryItemState.entity
});

export default connect(mapStateToProps, {
  getInventoryItems,
  getInventoryItem,
  resetInventoryItemForm,
  saveInventoryItem,
  deleteInventoryItem,
  deleteInventoryItemImage
})(InventoryListPageMUI);
