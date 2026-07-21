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
import { Breadcrumb } from "react-breadcrumbs";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTableEditable from "openstack-uicore-foundation/lib/components/mui/editable-table";
import { ImagePreviewCell } from "../../../components/image-preview-cell";
import {
  deleteSponsorFormItem,
  getSponsorFormItem,
  getSponsorFormItems,
  saveSponsorFormItem,
  updateSponsorFormItem,
  addInventoryItems,
  resetSponsorFormItem,
  archiveSponsorFormItem,
  unarchiveSponsorFormItem
} from "../../../actions/sponsor-forms-actions";
import { getInventoryItems } from "../../../actions/inventory-item-actions";
import SponsorFormItemPopup from "./components/sponsor-form-item-popup";
import SponsorFormAddItemFromInventoryPopup from "./components/sponsor-form-add-item-from-inventory-popup";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";
import { rateCellValidation } from "../../../utils/yup";
import { rateToCents } from "../../../utils/rate-helpers";

const SponsorFormItemListPage = ({
  match,
  items,
  currentItem,
  currentPage,
  perPage,
  showArchived,
  order,
  orderDir,
  totalCount,
  inventoryItems,
  getInventoryItems,
  getSponsorFormItems,
  getSponsorFormItem,
  deleteSponsorFormItem,
  saveSponsorFormItem,
  updateSponsorFormItem,
  addInventoryItems,
  resetSponsorFormItem,
  archiveSponsorFormItem,
  unarchiveSponsorFormItem
}) => {
  const [openPopup, setOpenPopup] = useState(null);
  const { form_id: formId } = match.params;

  useEffect(() => {
    getSponsorFormItems(formId);
  }, []);

  const handlePageChange = (page) => {
    getSponsorFormItems(formId, page, perPage, order, orderDir, showArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorFormItems(
      formId,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleSort = (key, dir) => {
    getSponsorFormItems(formId, currentPage, perPage, key, dir, showArchived);
  };

  const handleShowArchivedForms = (ev) => {
    getSponsorFormItems(
      formId,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleRowEdit = (row) => {
    getSponsorFormItem(formId, row.id).then(() => {
      setOpenPopup("crud");
    });
  };

  const handleClosePopup = () => {
    resetSponsorFormItem();
    setOpenPopup(null);
  };

  const handleSaveItem = (values) => {
    const save = values.id ? updateSponsorFormItem : saveSponsorFormItem;
    return save(formId, values);
  };

  const handleAddFromInventory = (itemIds) =>
    addInventoryItems(formId, itemIds);

  const handleCellEdit = (rowId, column, value) => {
    // since editable cell is TextField and not PriceField, we need to convert to cents
    const valueInCents = rateToCents(value);
    const tmpEntity = { id: rowId, [column]: valueInCents };
    updateSponsorFormItem(formId, tmpEntity);
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveSponsorFormItem(formId, item.id)
      : archiveSponsorFormItem(formId, item.id);

  const handleRowDelete = (itemId) => {
    deleteSponsorFormItem(formId, itemId).then(() => {
      getSponsorFormItems(
        formId,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        showArchived
      );
    });
  };

  const handleNewItem = () => {
    resetSponsorFormItem();
    setOpenPopup("crud");
  };

  const handleNewInventoryItem = () => {
    setOpenPopup("inventory");
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("sponsor_form_item_list.code"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_form_item_list.name"),
      sortable: true
    },
    {
      columnKey: "early_bird_rate",
      header: T.translate("sponsor_form_item_list.early_bird_rate"),
      sortable: true,
      editable: (row) =>
        row.early_bird_rate !== T.translate("price_tiers.not_available"),
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "standard_rate",
      header: T.translate("sponsor_form_item_list.standard_rate"),
      sortable: true,
      editable: (row) =>
        row.standard_rate !== T.translate("price_tiers.not_available"),
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "onsite_rate",
      header: T.translate("sponsor_form_item_list.onsite_rate"),
      sortable: true,
      editable: (row) =>
        row.onsite_rate !== T.translate("price_tiers.not_available"),
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "default_quantity",
      header: T.translate("sponsor_form_item_list.default_quantity"),
      sortable: true
    },
    {
      columnKey: "hasImage",
      header: "",
      width: 40,
      align: "center",
      render: (row) => {
        const img = row.images?.[0];
        const url = img?.file_url ?? img?.file_path;
        if (!url) return null;
        return (
          <ImagePreviewCell
            imageUrl={url}
            itemName={row.name}
            uploadDate={img?.created}
          />
        );
      }
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir,
    disableProp: "is_archived"
  };

  return (
    <div className="container">
      <Breadcrumb
        data={{
          title: T.translate("sponsor_form_item_list.form_items"),
          pathname: match.url
        }}
      />
      <h3>{T.translate("sponsor_form_item_list.form_items")}</h3>
      <Alert
        severity="info"
        sx={{
          justifyContent: "start",
          alignItems: "center",
          mb: 2
        }}
      >
        {T.translate("sponsor_form_item_list.alert_info")}
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
        <Grid2 size={4}>
          <Box component="span">{totalCount} items</Box>
        </Grid2>
        <Grid2
          container
          size={8}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showArchived}
                  onChange={handleShowArchivedForms}
                  inputProps={{
                    "aria-label": T.translate(
                      "sponsor_form_item_list.show_archived"
                    )
                  }}
                />
              }
              label={T.translate("sponsor_form_item_list.show_archived")}
            />
          </FormGroup>
          <Button
            variant="contained"
            onClick={() => handleNewItem()}
            startIcon={<AddIcon />}
          >
            {T.translate("sponsor_form_item_list.add_item")}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleNewInventoryItem()}
            startIcon={<AddIcon />}
          >
            {T.translate("sponsor_form_item_list.add_item_from_inventory")}
          </Button>
        </Grid2>
      </Grid2>

      {items.length > 0 && (
        <div>
          <MuiTableEditable
            columns={columns}
            data={items}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onDelete={handleRowDelete}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onCellChange={handleCellEdit}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
            deleteDialogBody={(name) =>
              T.translate("sponsor_form_item_list.delete_dialog_body", {
                name
              })
            }
          />
        </div>
      )}
      {openPopup === "crud" && (
        <SponsorFormItemPopup
          item={currentItem}
          onSave={handleSaveItem}
          onClose={handleClosePopup}
        />
      )}
      {openPopup === "inventory" && (
        <SponsorFormAddItemFromInventoryPopup
          inventoryItems={inventoryItems}
          getInventoryItems={getInventoryItems}
          onSave={handleAddFromInventory}
          onClose={() => setOpenPopup(null)}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  sponsorFormItemsListState,
  currentInventoryItemListState
}) => ({
  ...sponsorFormItemsListState,
  inventoryItems: currentInventoryItemListState
});

export default connect(mapStateToProps, {
  getSponsorFormItems,
  deleteSponsorFormItem,
  getSponsorFormItem,
  saveSponsorFormItem,
  updateSponsorFormItem,
  addInventoryItems,
  resetSponsorFormItem,
  getInventoryItems,
  archiveSponsorFormItem,
  unarchiveSponsorFormItem
})(SponsorFormItemListPage);
