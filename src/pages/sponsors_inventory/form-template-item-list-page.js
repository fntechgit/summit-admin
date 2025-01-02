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
  getFormTemplateItems,
  deleteFormTemplateItem
} from "../../actions/form-template-item-actions";

const FormTemplateItemListPage = ({
  formTemplateId,
  formTemplateItems,
  lastPage,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalFormTemplateItems,
  history,
  deleteFormTemplateItem,
  getFormTemplateItems
}) => {
  useEffect(() => {
    getFormTemplateItems(
      formTemplateId,
      term,
      currentPage,
      perPage,
      order,
      orderDir
    );
  }, []);

  const handleEdit = (itemId) => {
    history.push(
      `/app/sponsors-inventory/form-templates/${formTemplateId}/items/${itemId}`
    );
  };

  const handleDelete = (itemId) => {
    const inventoryItem = inventoryItems.find((s) => s.id === itemId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "form_template_item_list.delete_form_template_item_warning"
      )} ${inventoryItem.name}?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteFormTemplateItem(itemId);
      }
    });
  };

  const handlePageChange = (page) => {
    getFormTemplateItems(formTemplateId, term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getFormTemplateItems(formTemplateId, term, currentPage, perPage, key, dir);
  };

  const handleSearch = (term) => {
    getFormTemplateItems(
      formTemplateId,
      term,
      currentPage,
      perPage,
      order,
      orderDir
    );
  };

  const handleNewFormTemplateItem = () => {
    history.push(
      `/app/sponsors-inventory/form-templates/${formTemplateId}/items/new`
    );
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
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("form_template_item_list.form_template_items")} (
        {totalFormTemplateItems}){" "}
      </h3>
      <div className="alert alert-info" role="alert">
        {T.translate("form_template_item_list.alert_info")}
      </div>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate(
              "form_template_item_list.placeholders.search_form_template_items"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6 text-right">
          <button
            className="btn btn-primary"
            onClick={handleNewFormTemplateItem}
          >
            {T.translate("form_template_item_list.add_form_template_item")}
          </button>
        </div>
      </div>

      {formTemplateItems.length > 0 && (
        <div>
          <Table
            options={table_options}
            data={formTemplateItems}
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

const mapStateToProps = ({ currentFormTemplateItemListState }) => ({
  ...currentFormTemplateItemListState
});

export default connect(mapStateToProps, {
  getFormTemplateItems,
  deleteFormTemplateItem
})(FormTemplateItemListPage);
