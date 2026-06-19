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
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { ImagePreviewCell } from "../../../components/image-preview-cell";
import {
  cloneFromInventoryItem,
  getFormTemplateItem,
  getFormTemplateItems,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage,
  unarchiveFormTemplateItem,
  archiveFormTemplateItem
} from "../../../actions/form-template-item-actions";
import { getFormTemplate } from "../../../actions/form-template-actions";
import AddFormTemplateItemDialog from "./add-form-template-item-popup";
import SponsorInventoryDialog from "./sponsor-inventory-popup";
import { getInventoryItems } from "../../../actions/inventory-item-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

const FormTemplateItemListPage = ({
  formTemplateId,
  formTemplateItems,
  currentFormTemplate,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  showArchived,
  getInventoryItems,
  totalFormTemplateItems,
  cloneFromInventoryItem,
  getFormTemplate,
  getFormTemplateItems,
  getFormTemplateItem,
  currentFormTemplateItem,
  currentFormTemplateItemErrors,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage,
  unarchiveFormTemplateItem,
  archiveFormTemplateItem
}) => {
  const [showAddInventoryItemsModal, setShowAddInventoryItemsModal] =
    useState(false);
  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);

  useEffect(() => {
    getFormTemplate(formTemplateId).then(() => {
      getFormTemplateItems(
        formTemplateId,
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        showArchived
      );
    });
  }, []);

  const handlePageChange = (page) => {
    getFormTemplateItems(
      formTemplateId,
      term,
      page,
      perPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handlePerPageChange = (newPerPage) => {
    getFormTemplateItems(
      formTemplateId,
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleSort = (key, dir) => {
    getFormTemplateItems(
      formTemplateId,
      term,
      currentPage,
      perPage,
      key,
      dir,
      showArchived
    );
  };

  const handleRowEdit = (row) => {
    if (!row) return;
    getFormTemplateItem(formTemplateId, row.id).then(() =>
      setShowInventoryItemModal(true)
    );
  };

  const handleNewInventoryItem = () => {
    getInventoryItems().then(() => setShowAddInventoryItemsModal(true));
  };

  const handleAddSelectedItems = (items) => {
    const promises = items.map((item) =>
      cloneFromInventoryItem(formTemplateId, item)
    );
    Promise.allSettled(promises)
      .then((results) => {
        const anySucceeded = results.some((r) => r.status === "fulfilled");
        if (anySucceeded) {
          getFormTemplateItems(
            formTemplateId,
            term,
            currentPage,
            perPage,
            order,
            orderDir,
            showArchived
          );
        }
      })
      .finally(() => {
        setShowAddInventoryItemsModal(false);
      });
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveFormTemplateItem(formTemplateId, item)
      : archiveFormTemplateItem(formTemplateId, item);

  const handleShowArchivedForms = (ev) => {
    getFormTemplateItems(
      formTemplateId,
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleFormTemplateSave = (item) =>
    saveFormTemplateItem(formTemplateId, item).then(() =>
      getFormTemplateItems(
        formTemplateId,
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        showArchived
      )
    );

  const columns = [
    {
      columnKey: "code",
      header: T.translate("form_template_item_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("form_template_item_list.name_column_label"),
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
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3>{`${currentFormTemplate.code} - ${currentFormTemplate.name}`}</h3>
      <Alert
        severity="info"
        sx={{
          justifyContent: "start",
          alignItems: "center",
          mb: 2
        }}
      >
        {T.translate("form_template_item_list.alert_info")}
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
          <Box component="span">{totalFormTemplateItems} items</Box>
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
          <Grid2 size={4} offset={4}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showArchived}
                    onChange={handleShowArchivedForms}
                    inputProps={{
                      "aria-label": T.translate(
                        "form_template_item_list.show_archived"
                      )
                    }}
                  />
                }
                label={T.translate("form_template_item_list.show_archived")}
              />
            </FormGroup>
          </Grid2>
          <Grid2 size={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleNewInventoryItem()}
              startIcon={<AddIcon />}
            >
              {T.translate("form_template_item_list.add_item")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

      {formTemplateItems.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={formTemplateItems}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalFormTemplateItems}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
          />
        </div>
      )}
      {showAddInventoryItemsModal && (
        <AddFormTemplateItemDialog
          onClose={() => setShowAddInventoryItemsModal(false)}
          onAddItems={handleAddSelectedItems}
        />
      )}
      {showInventoryItemModal && (
        <SponsorInventoryDialog
          entity={currentFormTemplateItem}
          errors={currentFormTemplateItemErrors}
          onSave={handleFormTemplateSave}
          onClose={() => setShowInventoryItemModal(false)}
          onMetaFieldTypeDeleted={deleteItemMetaFieldType}
          onMetaFieldTypeValueDeleted={deleteItemMetaFieldTypeValue}
          onImageDeleted={deleteItemImage}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentFormTemplateItemListState,
  currentFormTemplateState,
  currentFormTemplateItemState
}) => ({
  ...currentFormTemplateItemListState,
  currentFormTemplate: currentFormTemplateState.entity,
  currentFormTemplateItem: currentFormTemplateItemState.entity,
  currentFormTemplateItemErrors: currentFormTemplateItemState.errors
});

export default connect(mapStateToProps, {
  cloneFromInventoryItem,
  getFormTemplateItems,
  getFormTemplate,
  getInventoryItems,
  getFormTemplateItem,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage,
  unarchiveFormTemplateItem,
  archiveFormTemplateItem
})(FormTemplateItemListPage);
