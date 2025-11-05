/**
 * Copyright 2025 OpenStack Foundation
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
import IconButton from "@mui/material/IconButton";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Tooltip from "@mui/material/Tooltip";
import ImageIcon from "@mui/icons-material/Image";
import MuiTable from "../../components/mui/table/mui-table";
import {
  cloneFromInventoryItem,
  deleteFormTemplateItem,
  getFormTemplateItem,
  getFormTemplateItems,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage
} from "../../actions/form-template-item-actions";
import { getFormTemplate } from "../../actions/form-template-actions";
import AddFormTemplateItemDialog from "./popup/add-form-template-item-popup";
import SponsorItemDialog from "./popup/sponsor-inventory-popup";
import { getInventoryItems } from "../../actions/inventory-item-actions";

const FormTemplateItemListPage = ({
  formTemplateId,
  formTemplateItems,
  currentFormTemplate,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
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
  deleteItemImage
}) => {
  const [showAddInventoryItemsModal, setShowAddInventoryItemsModal] =
    useState(false);
  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);

  useEffect(() => {
    getFormTemplate(formTemplateId).then(() => {
      getFormTemplateItems(
        formTemplateId,
        term,
        currentPage,
        perPage,
        order,
        orderDir
      );
    });
  }, []);

  const handlePageChange = (page) => {
    getFormTemplateItems(formTemplateId, term, page, perPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getFormTemplateItems(formTemplateId, term, currentPage, perPage, key, dir);
  };

  const handleRowEdit = (row) => {
    if (row) getFormTemplateItem(formTemplateId, row.id);
    setShowInventoryItemModal(true);
  };

  const handleNewInventoryItem = () => {
    getInventoryItems();
    setShowAddInventoryItemsModal(true);
  };

  const handleAddSelectedItems = (items) => {
    const promises = items.map((item) =>
      cloneFromInventoryItem(formTemplateId, item)
    );
    Promise.all(promises)
      .then(() => {
        getFormTemplateItems(
          formTemplateId,
          term,
          currentPage,
          perPage,
          order,
          orderDir
        );
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setShowAddInventoryItemsModal(false);
      });
  };

  const handleFormTemplateSave = (item) => {
    saveFormTemplateItem(formTemplateId, item).then(() =>
      getFormTemplateItems(
        formTemplateId,
        term,
        currentPage,
        perPage,
        order,
        orderDir
      )
    );
    setShowInventoryItemModal(false);
  };

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
    },
    {
      columnKey: "archive",
      header: "",
      width: 70,
      align: "center",
      render: () => (
        <Button variant="text" color="inherit" size="small">
          {T.translate("form_template_item_list.archive_button")}
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
                    onChange={(ev) =>
                      console.log("CHECK BOX", ev.target.checked)
                    }
                    inputProps={{
                      "aria-label": T.translate(
                        "form_template_item_list.hide_archived"
                      )
                    }}
                  />
                }
                label={T.translate("form_template_item_list.hide_archived")}
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
            onEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}
      <AddFormTemplateItemDialog
        open={showAddInventoryItemsModal}
        onClose={() => setShowAddInventoryItemsModal(false)}
        onAddItems={handleAddSelectedItems}
      />
      <SponsorItemDialog
        entity={currentFormTemplateItem}
        errors={currentFormTemplateItemErrors}
        open={showInventoryItemModal}
        onSave={handleFormTemplateSave}
        onClose={() => setShowInventoryItemModal(false)}
        onMetaFieldTypeDeleted={deleteItemMetaFieldType}
        onMetaFieldTypeValueDeleted={deleteItemMetaFieldTypeValue}
        onImageDeleted={deleteItemImage}
      />
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
  deleteFormTemplateItem,
  getFormTemplateItems,
  getFormTemplate,
  getInventoryItems,
  getFormTemplateItem,
  saveFormTemplateItem,
  deleteItemMetaFieldType,
  deleteItemMetaFieldTypeValue,
  deleteItemImage
})(FormTemplateItemListPage);
