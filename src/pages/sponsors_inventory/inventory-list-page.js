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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Table
} from "openstack-uicore-foundation/lib/components";
import {
  getInventoryItems,
  deleteInventoryItem
} from "../../actions/inventory-item-actions";

const InventoryListPage = ({
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
    history.push(`/app/sponsors-inventory/inventory/${itemId}`);
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
    getInventoryItems(term, page, perPage, key, dir);
  };

  const handleSearch = (term) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handleNewInventoryItem = () => {
    history.push("/app/sponsors-inventory/inventory/new");
  };

  const columns = [
    { columnKey: "id", value: "Id", sortable: true },
    { columnKey: "code", value: T.translate("general.code"), sortable: true },
    { columnKey: "name", value: T.translate("general.name"), sortable: true }
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
})(InventoryListPage);
