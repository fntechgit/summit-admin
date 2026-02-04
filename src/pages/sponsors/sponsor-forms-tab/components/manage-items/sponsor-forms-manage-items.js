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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2,
  IconButton,
  Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import {
  addSponsorManagedFormItems,
  archiveSponsorCustomizedFormItem,
  getSponsorCustomizedFormItems,
  saveSponsorFormManagedItem,
  deleteSponsorFormManagedItem,
  resetSponsorFormManagedItem,
  unarchiveSponsorCustomizedFormItem,
  getSponsorFormManagedItem
} from "../../../../../actions/sponsor-forms-actions";
import CustomAlert from "../../../../../components/mui/custom-alert";
import SearchInput from "../../../../../components/mui/search-input";
import MuiTableEditable from "../../../../../components/mui/editable-table/mui-table-editable";
import SponsorInventoryDialog from "../../../../sponsors-global/form-templates/sponsor-inventory-popup";
import SponsorFormItemFromInventoryPopup from "./sponsor-form-item-from-inventory";
import { DEFAULT_CURRENT_PAGE } from "../../../../../utils/constants";
import { rateCellValidation } from "../../../../../utils/yup";

const SponsorFormsManageItems = ({
  term,
  match,
  hideArchived,
  items,
  order,
  orderDir,
  perPage,
  currentPage,
  totalCount,
  getSponsorCustomizedFormItems,
  currentInventoryItem,
  resetSponsorFormManagedItem,
  addSponsorManagedFormItems,
  saveSponsorFormManagedItem,
  deleteSponsorFormManagedItem,
  archiveSponsorCustomizedFormItem,
  unarchiveSponsorCustomizedFormItem,
  getSponsorFormManagedItem
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  const handleClose = () => {
    setOpenPopup(null);
  };

  const formId = match.params.form_id;

  useEffect(() => {
    getSponsorCustomizedFormItems(formId);
  }, []);

  const handlePageChange = (page) => {
    getSponsorCustomizedFormItems(
      formId,
      term,
      page,
      perPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorCustomizedFormItems(
      formId,
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleSort = (key, dir) => {
    getSponsorCustomizedFormItems(
      formId,
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      hideArchived
    );
  };

  const handleSearch = (searchTerm) => {
    getSponsorCustomizedFormItems(
      formId,
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleItemSave = (item) => {
    saveSponsorFormManagedItem(formId, item).then(() => {
      getSponsorCustomizedFormItems(
        formId,
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      );
      resetSponsorFormManagedItem();
      setOpenPopup(null);
    });
  };

  const handleOpenItemPopup = () => {
    resetSponsorFormManagedItem();
    setOpenPopup("add_item");
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveSponsorCustomizedFormItem(formId, item.id)
      : archiveSponsorCustomizedFormItem(formId, item.id);

  const handleHideArchivedItems = (ev) => {
    getSponsorCustomizedFormItems(
      formId,
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleAddFromInventory = (itemsId) => {
    addSponsorManagedFormItems(formId, itemsId).then(() => handleClose());
  };

  const handleCellEdit = (rowId, column, value) => {
    const valueWithNoSign = String(value).replace(/^[^\d.-]+/, "");
    const tmpEntity = {
      id: rowId,
      [column]: valueWithNoSign
    };
    saveSponsorFormManagedItem(formId, tmpEntity);
  };

  const handleRowEdit = (row) => {
    getSponsorFormManagedItem(formId, row.id).then(() =>
      setOpenPopup("add_item")
    );
  };

  const handleRowDelete = (rowId) => {
    deleteSponsorFormManagedItem(formId, rowId).then(() =>
      getSponsorCustomizedFormItems(
        formId,
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      )
    );
  };

  const sponsorItemColumns = [
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.forms_tab.form_manage_items.code"),
      sortable: false
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.forms_tab.form_manage_items.name"),
      sortable: false
    },
    {
      columnKey: "early_bird_rate",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.early_bird_rate"
      ),
      sortable: false,
      editable: true,
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "standard_rate",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.standard_rate"
      ),
      sortable: false,
      editable: true,
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "onsite_rate",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.onsite_rate"
      ),
      sortable: false,
      editable: true,
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "default_quantity",
      header: T.translate(
        "edit_sponsor.forms_tab.form_manage_items.default_quantity"
      ),
      sortable: false
    },
    {
      columnKey: "images",
      header: "",
      width: 40,
      align: "center",
      render: (row) =>
        row.images?.length > 0 ? (
          <Tooltip title={row.images[0].file_url} placement="top" arrow>
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
          </Tooltip>
        ) : null
    }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <CustomAlert
        message={T.translate(
          "edit_sponsor.forms_tab.form_manage_items.alert_info"
        )}
        hideIcon
      />
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
          <Box component="span">{totalCount} items</Box>
        </Grid2>
        <Grid2 size={2} offset={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideArchived}
                  onChange={handleHideArchivedItems}
                  inputProps={{
                    "aria-label": T.translate(
                      "edit_sponsor.forms_tab.form_manage_items.hide_archived"
                    )
                  }}
                />
              }
              label={T.translate(
                "edit_sponsor.forms_tab.form_manage_items.hide_archived"
              )}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={2}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("edit_sponsor.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={2}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={handleOpenItemPopup}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.forms_tab.form_manage_items.add_item")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("add_item_inventory")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate(
              "edit_sponsor.forms_tab.form_manage_items.add_item_inventory"
            )}
          </Button>
        </Grid2>
      </Grid2>

      <div>
        <MuiTableEditable
          columns={sponsorItemColumns}
          data={items}
          options={{
            sortCol: order,
            sortDir: orderDir
          }}
          perPage={perPage}
          totalRows={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onArchive={handleArchiveItem}
          onEdit={handleRowEdit}
          onDelete={handleRowDelete}
          onCellChange={handleCellEdit}
        />
      </div>

      {/* ADD ITEM */}
      {openPopup === "add_item" && (
        <SponsorInventoryDialog
          entity={currentInventoryItem}
          open={openPopup === "add_item"}
          onSave={handleItemSave}
          onClose={handleClose}
        />
      )}

      {openPopup === "add_item_inventory" && (
        <SponsorFormItemFromInventoryPopup
          open={openPopup === "add_item_inventory"}
          onSave={handleAddFromInventory}
          onClose={handleClose}
        />
      )}
    </Box>
  );
};

const mapStateToProps = ({ sponsorCustomizedFormItemsListState }) => ({
  ...sponsorCustomizedFormItemsListState,
  currentInventoryItem: sponsorCustomizedFormItemsListState.currentItem
});

export default connect(mapStateToProps, {
  getSponsorCustomizedFormItems,
  resetSponsorFormManagedItem,
  addSponsorManagedFormItems,
  saveSponsorFormManagedItem,
  deleteSponsorFormManagedItem,
  getSponsorFormManagedItem,
  archiveSponsorCustomizedFormItem,
  unarchiveSponsorCustomizedFormItem
})(SponsorFormsManageItems);
