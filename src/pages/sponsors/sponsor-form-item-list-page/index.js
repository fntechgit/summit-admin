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
import MuiTable from "../../../components/mui/table/mui-table";
import { getSponsorFormItems } from "../../../actions/sponsor-forms-actions";
import ItemPopup from "./components/item-popup";

const SponsorFormItemListPage = ({
  match,
  items,
  currentPage,
  perPage,
  hideArchived,
  order,
  orderDir,
  totalCount,
  getSponsorFormItems
}) => {
  const [openPopup, setOpenPopup] = useState(null);
  const { form_id: formId } = match.params;

  useEffect(() => {
    getSponsorFormItems(formId);
  }, []);

  const handlePageChange = (page) => {
    getSponsorFormItems(formId, page, perPage, order, orderDir, hideArchived);
  };

  const handleSort = (index, key, dir) => {
    getSponsorFormItems(formId, currentPage, perPage, key, dir, hideArchived);
  };

  const handleHideArchivedForms = (ev) => {
    getSponsorFormItems(
      formId,
      currentPage,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleRowEdit = () => {
    console.log("EDIT ITEM");
  };

  const handleNewItem = () => {
    setOpenPopup("crud");
  };

  const handleNewInventoryItem = () => {
    console.log("new item from inventory");
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
      sortable: true
    },
    {
      columnKey: "standard_rate",
      header: T.translate("sponsor_form_item_list.standard_rate"),
      sortable: true
    },
    {
      columnKey: "onsite_rate",
      header: T.translate("sponsor_form_item_list.onsite_rate"),
      sortable: true
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
          {T.translate("sponsor_form_item_list.archive_button")}
        </Button>
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
          <MuiTable
            columns={columns}
            data={items}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}
      <ItemPopup
        formId={formId}
        open={openPopup === "crud"}
        onClose={() => setOpenPopup(null)}
      />
    </div>
  );
};

const mapStateToProps = ({ sponsorFormItemsListState }) => ({
  ...sponsorFormItemsListState
});

export default connect(mapStateToProps, {
  getSponsorFormItems
})(SponsorFormItemListPage);
