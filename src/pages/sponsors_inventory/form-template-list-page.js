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
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2,
  TextField
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
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
} from "../../actions/form-template-actions";
import MuiTable from "../../components/mui/table/mui-table";
import FormTemplateDialog from "./popup/form-template-popup";
import history from "../../history";
import FormTemplateFromDuplicateDialog from "./popup/form-template-from-duplicate-popup";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const FormTemplateListPage = ({
  formTemplates,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  hideArchived,
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getFormTemplates(
      "",
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      hideArchived
    );
    resetFormTemplateForm();
  }, []);

  const handlePageChange = (page) => {
    getFormTemplates(term, page, perPage, order, orderDir, hideArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getFormTemplates(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleSort = (key, dir) => {
    getFormTemplates(term, currentPage, perPage, key, dir, hideArchived);
  };

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      getFormTemplates(
        searchTerm,
        currentPage,
        perPage,
        order,
        orderDir,
        hideArchived
      );
    }
    // search on duplicate popup
    if (typeof ev === "string")
      getFormTemplates(ev, currentPage, perPage, order, orderDir, hideArchived);
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

  const handleDuplicatePopupClose = () => {
    getFormTemplates(
      "",
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      hideArchived
    );
    setFormTemplateDuplicate(false);
    setFormTemplateFromDuplicatePopupOpen(false);
  };

  const handleArchiveItem = (item) =>
    item.is_archived ? unarchiveFormTemplate(item) : archiveFormTemplate(item);

  const handleHideArchivedForms = (value) => {
    getFormTemplates(term, currentPage, perPage, order, orderDir, value);
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
    },
    {
      columnKey: "archive",
      header: "",
      width: 70,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleArchiveItem(row)}
          sx={{
            fontSize: "1.3rem",
            fontWeight: 500,
            lineHeight: "2.2rem",
            padding: "4px 5px"
          }}
        >
          {row.is_archived
            ? T.translate("inventory_item_list.unarchive_button")
            : T.translate("inventory_item_list.archive_button")}
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
      <h3>
        {" "}
        {T.translate("form_template_list.form_templates")} ({totalFormTemplates}
        ){" "}
      </h3>
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

      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={1}>
          <Box component="span">{totalFormTemplates} forms</Box>
        </Grid2>
        <Grid2 size={11} justifyContent="flex-end" gap={1} container>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(ev) => handleHideArchivedForms(ev.target.checked)}
                  inputProps={{
                    "aria-label": T.translate(
                      "form_template_list.hide_archived"
                    )
                  }}
                />
              }
              label={T.translate("form_template_list.hide_archived")}
            />
          </FormGroup>

          <TextField
            variant="outlined"
            value={searchTerm}
            placeholder={T.translate(
              "inventory_item_list.placeholders.search_inventory_items"
            )}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1 }} />
              }
            }}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={handleSearch}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px"
              }
            }}
          />
          <Button
            variant="contained"
            size="medium"
            onClick={() => handleNewFromDuplicate()}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("form_template_list.using_duplicate")}
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={() => handleNewFormTemplate()}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
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

      {formTemplates.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={formTemplates}
            options={tableOptions}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalFormTemplates}
            onEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
          />
        </div>
      )}
      <FormTemplateDialog
        entity={currentFormTemplate}
        errors={currentFormTemplateErrors}
        open={formTemplatePopupOpen}
        onSave={saveFormTemplate}
        toDuplicate={formTemplateDuplicate}
        onClose={() => setFormTemplatePopupOpen(false)}
        onMetaFieldTypeDeleted={deleteFormTemplateMetaFieldType}
        onMetaFieldTypeValueDeleted={deleteFormTemplateMetaFieldTypeValue}
        onMaterialDeleted={deleteFormTemplateMaterial}
      />
      <FormTemplateFromDuplicateDialog
        open={formTemplateFromDuplicatePopupOpen}
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
