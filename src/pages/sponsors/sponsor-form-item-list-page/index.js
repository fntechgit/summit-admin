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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ImageIcon from "@mui/icons-material/Image";
import {
  deleteSponsorFormItem,
  getSponsorFormItem,
  getSponsorFormItems,
  updateSponsorFormItem,
  archiveSponsorFormItem,
  unarchiveSponsorFormItem
} from "../../../actions/sponsor-forms-actions";
import ItemPopup from "./components/item-popup";
import InventoryPopup from "./components/inventory-popup";
import MuiTableEditable from "../../../components/mui/editable-table/mui-table-editable";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";
import { rateCellValidation } from "../../../utils/yup";

const SponsorFormItemListPage = ({
  match,
  items,
  currentPage,
  perPage,
  hideArchived,
  order,
  orderDir,
  totalCount,
  getSponsorFormItems,
  getSponsorFormItem,
  deleteSponsorFormItem,
  updateSponsorFormItem,
  archiveSponsorFormItem,
  unarchiveSponsorFormItem
}) => {
  const [openPopup, setOpenPopup] = useState(null);
  const { form_id: formId } = match.params;

  useEffect(() => {
    getSponsorFormItems(formId);
  }, []);

  const handlePageChange = (page) => {
    getSponsorFormItems(formId, page, perPage, order, orderDir, hideArchived);
  };

  const handleSort = (key, dir) => {
    getSponsorFormItems(formId, currentPage, perPage, key, dir, hideArchived);
  };

  const handleHideArchivedForms = (ev) => {
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

  const handleCellEdit = (rowId, column, value) => {
    const valueWithNoSign = String(value).replace(/^[^\d.-]+/, "");
    const tmpEntity = { id: rowId, [column]: valueWithNoSign };
    updateSponsorFormItem(formId, tmpEntity);
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveSponsorFormItem(formId, item.id)
      : archiveSponsorFormItem(formId, item.id);

  const handleRowDelete = (itemId) => {
    deleteSponsorFormItem(formId, itemId);
  };

  const handleNewItem = () => {
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
      editable: true,
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "standard_rate",
      header: T.translate("sponsor_form_item_list.standard_rate"),
      sortable: true,
      editable: true,
      validation: {
        schema: rateCellValidation()
      }
    },
    {
      columnKey: "onsite_rate",
      header: T.translate("sponsor_form_item_list.onsite_rate"),
      sortable: true,
      editable: true,
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
      render: (row) =>
        row.images?.length > 0 ? (
          <Tooltip title={row.images[0].file_url} placement="top" arrow>
            <IconButton size="large">
              <ImageIcon
                fontSize="large"
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

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
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
                  onChange={handleHideArchivedForms}
                  inputProps={{
                    "aria-label": T.translate(
                      "sponsor_form_item_list.hide_archived"
                    )
                  }}
                />
              }
              label={T.translate("sponsor_form_item_list.hide_archived")}
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
            onSort={handleSort}
            onCellChange={handleCellEdit}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
          />
        </div>
      )}
      <ItemPopup
        formId={formId}
        open={openPopup === "crud"}
        onClose={() => setOpenPopup(null)}
      />
      <InventoryPopup
        formId={formId}
        open={openPopup === "inventory"}
        onClose={() => setOpenPopup(null)}
      />
    </div>
  );
};

const mapStateToProps = ({ sponsorFormItemsListState }) => ({
  ...sponsorFormItemsListState
});

export default connect(mapStateToProps, {
  getSponsorFormItems,
  deleteSponsorFormItem,
  getSponsorFormItem,
  updateSponsorFormItem,
  archiveSponsorFormItem,
  unarchiveSponsorFormItem
})(SponsorFormItemListPage);
