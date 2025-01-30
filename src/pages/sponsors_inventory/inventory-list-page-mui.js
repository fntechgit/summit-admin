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

import React, { useEffect } from "react";
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
  FreeTextSearch,
  Table
} from "openstack-uicore-foundation/lib/components";
import { Pagination } from "react-bootstrap";
import {
  getInventoryItems,
  deleteInventoryItem
} from "../../actions/inventory-item-actions";

const InventoryListPageMUI = ({
  inventoryItems,
  lastPage,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalInventoryItems,
  history,
  deleteInventoryItem,
  getInventoryItems
}) => {
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

  const handleSearch = (term) => {
    getInventoryItems(term, currentPage, perPage, order, orderDir);
  };

  const handleNewInventoryItem = () => {
    history.push("/app/inventory/new");
  };

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
          alignItems: "center"
        }}
      >
        {T.translate("inventory_item_list.alert_info")}
      </Alert>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center"
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
              placeholder={T.translate(
                "inventory_item_list.placeholders.search_inventory_items"
              )}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon />
                }
              }}
            />
          </Grid2>
          <Grid2 size={4}>
            <Button variant="contained" startIcon={<AddIcon />}>
              {T.translate("inventory_item_list.add_inventory_item")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate(
              "inventory_item_list.placeholders.search_inventory_items"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6 text-right">
          <button className="btn btn-primary" onClick={handleNewInventoryItem}>
            {T.translate("inventory_item_list.add_inventory_item")}
          </button>
        </div>
      </div>

      {inventoryItems.length > 0 && (
        <div>
          <Table
            options={table_options}
            data={inventoryItems}
            columns={columns}
            onSort={handleSort}
          />
          <Pagination
            bsSize="medium"
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={10}
            items={lastPage}
            activePage={currentPage}
            onSelect={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({ currentInventoryItemListState }) => ({
  ...currentInventoryItemListState
});

export default connect(mapStateToProps, {
  getInventoryItems,
  deleteInventoryItem
})(InventoryListPageMUI);
