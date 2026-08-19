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

import React, { useEffect, useState } from "react";
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
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  archiveFormTemplate,
  deleteFormTemplate,
  deleteFormTemplateMaterial,
  deleteFormTemplateMetaFieldType,
  deleteFormTemplateMetaFieldTypeValue,
  getFormTemplate,
  getFormTemplates,
  resetFormTemplateForm,
  saveFormTemplate,
  unarchiveFormTemplate
} from "../../../actions/form-template-actions";
import FormTemplateDialog from "./form-template-popup";
import history from "../../../history";
import FormTemplateFromDuplicateDialog from "./form-template-from-duplicate-popup";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

const FormTemplateListPage = ({
  formTemplates,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  showArchived,
  totalFormTemplates,
  currentFormTemplate,
  currentFormTemplateErrors,
  getFormTemplates,
  getFormTemplate,
  saveFormTemplate,
  resetFormTemplateForm,
  deleteFormTemplateMaterial,
  deleteFormTemplateMetaFieldTypeValue,
  deleteFormTemplateMetaFieldType,
  archiveFormTemplate,
  unarchiveFormTemplate
}) => {
  const [formTemplatePopupOpen, setFormTemplatePopupOpen] = useState(false);
  const [formTemplateDuplicate, setFormTemplateDuplicate] = useState(false);
  const [
    formTemplateFromDuplicatePopupOpen,
    setFormTemplateFromDuplicatePopupOpen
  ] = useState(false);

  useEffect(() => {
    getFormTemplates(
      "",
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      showArchived
    );
    resetFormTemplateForm();
  }, []);

  const handlePageChange = (page) => {
    getFormTemplates(term, page, perPage, order, orderDir, showArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getFormTemplates(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleSort = (key, dir) => {
    getFormTemplates(term, currentPage, perPage, key, dir, showArchived);
  };

  const handleSearch = (searchTerm) => {
    getFormTemplates(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleRowEdit = (row) => {
    if (row) getFormTemplate(row.id);
    setFormTemplatePopupOpen(true);
  };

  const handleNewFromDuplicate = () => {
    setFormTemplateFromDuplicatePopupOpen(true);
  };

  const handleNewFormTemplate = () => {
    resetFormTemplateForm();
    setFormTemplatePopupOpen(true);
  };

  const handleManageItems = (formTemplate) => {
    history.push(`/app/form-templates/${formTemplate.id}/items`);
  };

  const handleDuplicateForm = (formTemplateId) => {
    getFormTemplate(formTemplateId).then(() => {
      setFormTemplatePopupOpen(true);
      setFormTemplateDuplicate(true);
    });
    setFormTemplateFromDuplicatePopupOpen(false);
  };

  const handleCloseFormTemplateDialog = () => {
    resetFormTemplateForm();
    setFormTemplatePopupOpen(false);
  };

  const handleDuplicatePopupClose = () => {
    getFormTemplates(
      "",
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      showArchived
    );
    setFormTemplateDuplicate(false);
    setFormTemplateFromDuplicatePopupOpen(false);
  };

  const handleArchiveItem = (item) =>
    item.is_archived ? unarchiveFormTemplate(item) : archiveFormTemplate(item);

  const handleShowArchivedForms = (value) => {
    getFormTemplates(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      value
    );
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("form_template_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("form_template_list.name_column_label"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      header: T.translate("form_template_list.items_column_label"),
      sortable: false
    },
    {
      columnKey: "manage_items",
      header: "",
      width: 150,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleManageItems(row)}
          sx={{
            fontSize: "1.3rem",
            fontWeight: 500,
            lineHeight: "2.2rem",
            padding: "4px 5px"
          }}
        >
          Manage Items
        </Button>
      ),
      dottedBorder: true
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  const handleOnSave = (values) =>
    saveFormTemplate(values).then(() =>
      getFormTemplates(
        "",
        values.id ? currentPage : DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        showArchived
      ).catch(() => {})
    );

  return (
    <div className="container">
      <h3>{T.translate("form_template_list.form_templates")}</h3>
      <Alert
        severity="info"
        sx={{
          justifyContent: "start",
          alignItems: "center",
          mb: 2
        }}
      >
        {T.translate("form_template_list.alert_info")}
      </Alert>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, sm: 6, lg: 2 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(ev) => handleShowArchivedForms(ev.target.checked)}
                  checked={showArchived}
                  inputProps={{
                    "aria-label": T.translate(
                      "form_template_list.show_archived"
                    )
                  }}
                />
              }
              label={T.translate("form_template_list.show_archived")}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, lg: 4 }}>
          <SearchInput
            onSearch={handleSearch}
            placeholder={T.translate(
              "inventory_item_list.placeholders.search_inventory_items"
            )}
          />
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 6, lg: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => handleNewFromDuplicate()}
            startIcon={<AddIcon />}
            sx={{
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("form_template_list.using_duplicate")}
          </Button>
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 6, lg: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => handleNewFormTemplate()}
            startIcon={<AddIcon />}
            sx={{
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("form_template_list.add_form_template")}
          </Button>
        </Grid2>
      </Grid2>
      <Box sx={{ mb: 2 }}>{totalFormTemplates} forms</Box>

      {formTemplates.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={formTemplates}
            options={tableOptions}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalFormTemplates}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
          />
        </div>
      )}
      {formTemplatePopupOpen && (
        <FormTemplateDialog
          entity={currentFormTemplate}
          errors={currentFormTemplateErrors}
          onSave={handleOnSave}
          toDuplicate={formTemplateDuplicate}
          onClose={handleCloseFormTemplateDialog}
          onMetaFieldTypeDeleted={deleteFormTemplateMetaFieldType}
          onMetaFieldTypeValueDeleted={deleteFormTemplateMetaFieldTypeValue}
          onMaterialDeleted={deleteFormTemplateMaterial}
        />
      )}
      {formTemplateFromDuplicatePopupOpen && (
        <FormTemplateFromDuplicateDialog
          options={tableOptions}
          onClose={handleDuplicatePopupClose}
          onDuplicate={handleDuplicateForm}
          onSearch={handleSearch}
          onSort={handleSort}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalFormTemplates}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          formTemplates={formTemplates}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentFormTemplateListState,
  currentFormTemplateState
}) => ({
  ...currentFormTemplateListState,
  currentFormTemplate: currentFormTemplateState.entity,
  currentFormTemplateErrors: currentFormTemplateState.errors
});

export default connect(mapStateToProps, {
  getFormTemplates,
  getFormTemplate,
  deleteFormTemplate,
  saveFormTemplate,
  deleteFormTemplateMetaFieldType,
  deleteFormTemplateMetaFieldTypeValue,
  deleteFormTemplateMaterial,
  resetFormTemplateForm,
  archiveFormTemplate,
  unarchiveFormTemplate
})(FormTemplateListPage);
