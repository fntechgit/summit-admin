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
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  getInventoryItems,
  getInventoryItem,
  saveInventoryItem,
  deleteInventoryItem,
  deleteInventoryItemImage,
  resetInventoryItemForm,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue
} from "../../actions/inventory-item-actions";
import MuiTable from "../../components/mui/table/mui-table";
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
  saveInventoryItem,
  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
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
    getInventoryItems(term, 1, perPage, order, orderDir);
  }, []);

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (ev) => {
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

  const columns = [
    {
      // The key in data, used to render default cell content unless `render` is provided
      columnKey: "code",
      header: "Code",
      width: 120,
      sortable: true
      // Optionally a custom render function
      // render: (row) => <strong>{row.code}</strong>,
    },
    {
      columnKey: "name",
      header: "Name",
      sortable: true
    },
    {
      columnKey: "hasImage",
      header: "", // or "Image" if you want a label
      width: 40,
      align: "center",
      // We don't usually display the boolean text; we render an icon or nothing
      render: (row) =>
        row.hasImage ? (
          <IconButton size="small">
            <ImageIcon fontSize="small" />
          </IconButton>
        ) : null
    },
    {
      columnKey: "edit",
      header: "", // no header label
      width: 40,
      align: "center",
      // A custom column for editing
      render: (row, { onRowEdit }) => (
        <IconButton size="small" onClick={() => onRowEdit(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
      // If you need a dotted border, you could do it via cell styling (shown below)
      className: "dottedBorderLeft"
    },
    {
      columnKey: "archive",
      header: "",
      width: 70,
      align: "center",
      render: () => <IconButton size="small">Archive</IconButton>,
      className: "dottedBorderLeft"
    },
    {
      columnKey: "more",
      header: "",
      width: 40,
      align: "center",
      render: () => (
        <IconButton size="small">
          <UnfoldMoreIcon fontSize="small" />
        </IconButton>
      ),
      className: "dottedBorderLeft"
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
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
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={handleSearch}
            />
          </Grid2>
          <Grid2 size={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleNewInventoryItem()}
              startIcon={<AddIcon />}
            >
              {T.translate("inventory_item_list.add_inventory_item")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

      {inventoryItems.length > 0 && (
        <div>
          <MuiTable
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
        onMetaFieldTypeDeleted={deleteInventoryItemMetaFieldType}
        onMetaFieldTypeValueDeleted={deleteInventoryItemMetaFieldTypeValue}
        onImageDeleted={deleteInventoryItemImage}
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
  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue
})(InventoryListPageMUI);
