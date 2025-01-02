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
  getFormTemplates,
  deleteFormTemplate
} from "../../actions/form-template-actions";

const FormTemplateListPage = ({
  formTemplates,
  lastPage,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalFormTemplates,
  history,
  getFormTemplates,
  deleteFormTemplate
}) => {
  useEffect(() => {
    getFormTemplates(term, currentPage, perPage, order, orderDir);
  }, []);

  const handleEdit = (templateId) => {
    history.push(`/app/sponsors-inventory/form-templates/${templateId}`);
  };

  const handleDelete = (templateId) => {
    const formTemplate = formTemplates.find((s) => s.id === templateId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "form_template_list.delete_form_template_warning"
      )} ${formTemplate.name}?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteFormTemplate(templateId);
      }
    });
  };

  const handlePageChange = (page) => {
    getFormTemplates(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getFormTemplates(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (term) => {
    getFormTemplates(term, currentPage, perPage, order, orderDir);
  };

  const handleNewFormTemplate = () => {
    history.push("/app/sponsors-inventory/form-templates/new");
  };

  const handleManageTemplateItems = (ev, templateId) => {
    ev.stopPropagation();
    history.push(`/app/sponsors-inventory/form-templates/${templateId}/items`);
  };

  const columns = [
    { columnKey: "id", value: "Id", sortable: true },
    {
      columnKey: "code",
      value: T.translate("form_template_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      value: T.translate("form_template_list.name_column_label"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      value: T.translate("form_template_list.items_column_label"),
      sortable: false
    },
    {
      columnKey: "manage_items",
      render: (filter) => (
          <button
            className="btn btn-default"
            onClick={(ev) => handleManageTemplateItems(ev, filter.id)}
          >
            {T.translate("form_template_list.manage_items")}
          </button>
        )
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
        {T.translate("form_template_list.form_templates")} ({totalFormTemplates}
        ){" "}
      </h3>
      <div className="alert alert-info" role="alert">
        {T.translate("form_template_list.alert_info")}
      </div>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate(
              "form_template_list.placeholders.search_inventory_items"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6 text-right">
          <button className="btn btn-primary" onClick={handleNewFormTemplate}>
            {T.translate("form_template_list.add_form_template")}
          </button>
        </div>
      </div>

      {formTemplates.length > 0 && (
        <div>
          <Table
            options={table_options}
            data={formTemplates}
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

const mapStateToProps = ({ currentFormTemplateListState }) => ({
  ...currentFormTemplateListState
});

export default connect(mapStateToProps, {
  getFormTemplates,
  deleteFormTemplate
})(FormTemplateListPage);
