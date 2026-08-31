/**
 * Copyright 2017 OpenStack Foundation
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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import EditEmailTemplatePopup from "./edit-email-template-popup";
import {
  getEmailTemplates,
  deleteEmailTemplate,
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients,
  renderEmailTemplate,
  updateTemplateJsonData
} from "../../actions/email-actions";

const EmailTemplateListPage = ({
  templates,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalTemplates,
  entity,
  templateLoading,
  errors,
  clients,
  preview,
  render_errors: renderErrors,
  json_data: templateJsonData,
  getEmailTemplates: fetchEmailTemplates,
  deleteEmailTemplate: removeEmailTemplate,
  getEmailTemplate: fetchEmailTemplate,
  resetTemplateForm: resetForm,
  saveEmailTemplate: saveTemplate,
  getAllClients: fetchAllClients,
  renderEmailTemplate: renderTemplate,
  updateTemplateJsonData: updateJsonData
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    fetchEmailTemplates(term, currentPage, perPage, order, orderDir);
  }, [fetchEmailTemplates]);

  const handleClosePopup = () => {
    resetForm();
    setOpenPopup(null);
  };

  const handleCreate = (values) =>
    saveTemplate(values).then(() => {
      fetchEmailTemplates(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      ).catch(() => {});
    });

  const handleUpdate = (values) =>
    saveTemplate(values).then(() => {
      fetchEmailTemplates(term, currentPage, perPage, order, orderDir).catch(
        () => {}
      );
    });

  const handleEdit = (row) => {
    Promise.all([fetchEmailTemplate(row.id), fetchAllClients()]).then(() => {
      setOpenPopup("edit");
    });
  };

  const handlePageChange = (page) => {
    fetchEmailTemplates(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    fetchEmailTemplates(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleSort = (key, dir) => {
    fetchEmailTemplates(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (newTerm) => {
    fetchEmailTemplates(
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
  };

  const handleNewEmailTemplate = (ev) => {
    ev.preventDefault();
    resetForm();
    fetchAllClients();
    setOpenPopup("create");
  };

  const handleDeleteEmailTemplate = (row) => {
    removeEmailTemplate(row.id)
      .finally(() =>
        fetchEmailTemplates(term, currentPage, perPage, order, orderDir)
      )
      .catch(() => {});
  };

  const columns = [
    {
      columnKey: "id",
      header: T.translate("general.id"),
      sortable: true,
      width: 70
    },
    {
      columnKey: "identifier",
      header: T.translate("emails.name"),
      render: (row) => (
        <div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
          {row.identifier}
        </div>
      ),
      sortable: true
    },
    { columnKey: "subject", header: T.translate("emails.subject") },
    { columnKey: "from_email", header: T.translate("emails.from_email") }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3>{T.translate("emails.template_list")}</h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate("emails.placeholders.search_templates")
        }}
      >
        <Button
          variant="contained"
          onClick={handleNewEmailTemplate}
          startIcon={<AddIcon />}
        >
          {T.translate("emails.add_template")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>
        {totalTemplates} {T.translate("emails.templates")}
      </Box>

      {templates.length === 0 && (
        <div>{T.translate("emails.no_templates")}</div>
      )}

      {templates.length > 0 && (
        <div>
          <MuiTable
            options={tableOptions}
            data={templates}
            columns={columns}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalTemplates}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDeleteEmailTemplate}
            getName={(row) => row.identifier}
            deleteDialogBody={(item) =>
              `${T.translate("emails.delete_template_warning")} ${item}`
            }
            confirmButtonColor="error"
          />
        </div>
      )}

      {openPopup && (
        <EditEmailTemplatePopup
          entity={entity}
          templateLoading={templateLoading}
          errors={errors}
          clients={clients}
          preview={preview}
          renderErrors={renderErrors}
          templateJsonData={templateJsonData}
          renderEmailTemplate={renderTemplate}
          updateTemplateJsonData={updateJsonData}
          onSave={openPopup === "create" ? handleCreate : handleUpdate}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ emailTemplateListState, emailTemplateState }) => ({
  ...emailTemplateListState,
  ...emailTemplateState
});

export default connect(mapStateToProps, {
  getEmailTemplates,
  deleteEmailTemplate,
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients,
  renderEmailTemplate,
  updateTemplateJsonData
})(EmailTemplateListPage);
