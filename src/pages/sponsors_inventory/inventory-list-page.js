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
import ImageIcon from "@mui/icons-material/Image";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  archiveInventoryItem,
  deleteInventoryItem,
  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  getInventoryItem,
  getInventoryItems,
  resetInventoryItemForm,
  saveInventoryItem,
  unarchiveInventoryItem
} from "../../actions/inventory-item-actions";
import MuiTable from "../../components/mui/table/mui-table";
import SponsorInventoryDialog from "./popup/sponsor-inventory-popup";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const InventoryListPage = ({
  inventoryItems,
  currentInventoryItem,
  currentInventoryItemErrors,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  hideArchived,
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
  const [searchTerm, setSearchTerm] = useState("");

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    getInventoryItems(term, 1, perPage, order, orderDir, hideArchived);
  }, []);

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir, hideArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getInventoryItems(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleSort = (key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir, hideArchived);
  };

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      getInventoryItems(
        searchTerm,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      );
    }
  };

  const handleHideArchivedForms = (ev) => {
    getInventoryItems(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
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
      getInventoryItems(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        hideArchived
      )
    );
    setOpen(false);
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveInventoryItem(item)
      : archiveInventoryItem(item);

  const columns = [
    {
      columnKey: "code",
      header: T.translate("inventory_item_list.code_column_label"),
      width: 120,
      sortable: true
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
      render: (row) =>
        row.images.length > 0 ? (
          <IconButton size="small">
            <ImageIcon
              fontSize="small"
              onClick={() =>
                window.open(
                  row.images[0].file_url,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            />
          </IconButton>
        ) : null
    },
    {
      columnKey: "archive",
      header: "",
      width: 70,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleArchiveItem(row)}
          sx={{
            fontSize: "1.3rem",
            fontWeight: 500,
            lineHeight: "2.2rem",
            padding: "4px 5px"
          }}
        >
          {row.is_archived
            ? T.translate("inventory_item_list.unarchive_button")
            : T.translate("inventory_item_list.archive_button")}
        </Button>
      ),
      dottedBorder: true
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
      dottedBorder: true
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
                  onChange={handleHideArchivedForms}
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
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px"
              }
            }}
          />
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
            onEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
          />
        </div>
      )}

      <SponsorInventoryDialog
        entity={currentInventoryItem}
        errors={currentInventoryItemErrors}
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
  currentInventoryItem: currentInventoryItemState.entity,
  currentInventoryItemErrors: currentInventoryItemState.errors
});

export default connect(mapStateToProps, {
  getInventoryItems,
  getInventoryItem,
  resetInventoryItemForm,
  saveInventoryItem,
  deleteInventoryItem,
  deleteInventoryItemImage,
  deleteInventoryItemMetaFieldType,
  deleteInventoryItemMetaFieldTypeValue,
  archiveInventoryItem,
  unarchiveInventoryItem
})(InventoryListPage);
