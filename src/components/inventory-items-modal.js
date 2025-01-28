import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Modal, Pagination } from "react-bootstrap";
import T from "i18n-react";
import {
  FreeTextSearch,
  SelectableTable
} from "openstack-uicore-foundation/lib/components";
import {
  clearAllSelectedInventoryItems,
  getInventoryItems,
  selectInventoryItem,
  setSelectedAll,
  unSelectInventoryItem
} from "../actions/inventory-item-actions";

const InventoryItemsModal = ({
  clearAllSelectedInventoryItems,
  getInventoryItems,
  selectInventoryItem,
  unSelectInventoryItem,
  inventoryItems,
  currentPage,
  perPage,
  lastPage,
  show,
  onHide,
  onAddSelected,
  order,
  orderDir,
  selectedCount,
  selectedIds,
  term = ""
}) => {
  useEffect(() => {
    getInventoryItems(term, currentPage, perPage, order, orderDir);
  }, []);

  const handlePageChange = (page) => {
    getInventoryItems(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (term) => {
    getInventoryItems(term, currentPage, perPage, order, orderDir);
  };

  const handleSelected = (id, isSelected) => {
    if (isSelected) {
      selectInventoryItem(id);
      return;
    }
    unSelectInventoryItem(id);
  };

  const handleAddSelected = () => {
    if (onAddSelected) {
      onAddSelected(selectedIds);
      clearAllSelectedInventoryItems();
    }
  };

  const columns = [
    { columnKey: "id", value: "Id", sortable: true },
    {
      columnKey: "code",
      value: T.translate("form_template_item_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      value: T.translate("form_template_item_list.name_column_label"),
      sortable: true
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: {
        onClick: () => {},
        onSelected: handleSelected,
        onSelectedAll: () => {}
      }
    },
    selectedAll: false,
    disableSelectAll: true
  };

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          {T.translate("inventory_items_list_modal.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
            <FreeTextSearch
              value={term ?? ""}
              placeholder={T.translate(
                "inventory_items_list_modal.placeholders.search_inventory_items"
              )}
              onSearch={handleSearch}
            />
          </div>
        </div>
        {inventoryItems.length > 0 && (
          <div>
            {selectedCount > 0 && (
              <span>
                <b>
                  {T.translate(
                    "inventory_items_list_modal.selected_items_qty",
                    {
                      qty: selectedCount
                    }
                  )}
                </b>
              </span>
            )}
            <SelectableTable
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
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-primary right-space"
          onClick={handleAddSelected}
        >
          {T.translate("inventory_items_list_modal.add_selected")}
        </button>
        <button className="btn btn-default" onClick={onHide}>
          {T.translate("general.cancel")}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

const mapStateToProps = ({ currentInventoryItemListState }) => ({
  ...currentInventoryItemListState
});

export default connect(mapStateToProps, {
  getInventoryItems,
  clearAllSelectedInventoryItems,
  setSelectedAll,
  selectInventoryItem,
  unSelectInventoryItem
})(InventoryItemsModal);
