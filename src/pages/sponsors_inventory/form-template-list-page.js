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
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  getFormTemplates,
  deleteFormTemplate,
  getFormTemplate,
  saveFormTemplate,
  deleteFormTemplateMaterial,
  deleteFormTemplateMetaFieldTypeValue,
  deleteFormTemplateMetaFieldType,
  resetFormTemplateForm
} from "../../actions/form-template-actions";
import MuiTable from "../../components/mui/table/mui-table";
import FormTemplateDialog from "./popup/form-template-popup";
import history from "../../history";
import FormTemplateFromDuplicateDialog from "./popup/form-template-from-duplicate-popup";

const FormTemplateListPage = ({
  formTemplates,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalFormTemplates,
  currentFormTemplate,
  currentFormTemplateErrors,
  getFormTemplates,
  getFormTemplate,
  saveFormTemplate,
  resetFormTemplateForm,
  deleteFormTemplateMaterial,
  deleteFormTemplateMetaFieldTypeValue,
  deleteFormTemplateMetaFieldType
}) => {
  const [formTemplatePopupOpen, setFormTemplatePopupOpen] = useState(false);
  const [
    formTemplateFromDuplicatePopupOpen,
    setFormTemplateFromDuplicatePopupOpen
  ] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getFormTemplates(term, currentPage, perPage, order, orderDir);
    resetFormTemplateForm();
  }, []);

  const handlePageChange = (page) => {
    getFormTemplates(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getFormTemplates(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      getFormTemplates(searchTerm, currentPage, perPage, order, orderDir);
    }
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
      width: 100,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleManageItems(row)}
        >
          Manage Items
        </Button>
      )
    },
    {
      columnKey: "edit",
      header: "",
      width: 40,
      align: "center",
      render: (row, { onRowEdit }) => (
        <IconButton size="small" onClick={() => onRowEdit(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
      className: "dottedBorderLeft"
    },
    {
      columnKey: "archive",
      header: "",
      width: 70,
      align: "center",
      render: () => (
        <Button variant="text" color="inherit" size="medium">
          Archive
        </Button>
      ),
      className: "dottedBorderLeft"
    }
  ];

  const table_options = {
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
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={1}>
          <Box component="span">{totalFormTemplates} forms</Box>
        </Grid2>
        <Grid2 size={2} offset={3}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(ev) => console.log("CHECK BOX", ev.target.checked)}
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
        </Grid2>
        <Grid2 size={2}>
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
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px"
              }
            }}
          />
        </Grid2>
        <Grid2 size={2}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => handleNewFromDuplicate()}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("form_template_list.using_duplicate")}
          </Button>
        </Grid2>
        <Grid2 size={2}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => handleNewFormTemplate()}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
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
            options={table_options}
            perPage={perPage}
            currentPage={currentPage}
            onRowEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}
      <FormTemplateDialog
        entity={currentFormTemplate}
        errors={currentFormTemplateErrors}
        open={formTemplatePopupOpen}
        onSave={saveFormTemplate}
        onClose={() => setFormTemplatePopupOpen(false)}
        onMetaFieldTypeDeleted={deleteFormTemplateMetaFieldType}
        onMetaFieldTypeValueDeleted={deleteFormTemplateMetaFieldTypeValue}
        onMaterialDeleted={deleteFormTemplateMaterial}
      />
      <FormTemplateFromDuplicateDialog
        open={formTemplateFromDuplicatePopupOpen}
        options={table_options}
        onClose={() => setFormTemplateFromDuplicatePopupOpen(false)}
        onDuplicate={(ids) => console.log("CHECK...", ids)}
        onSearch={() => console.log("CHECK...")}
        onFilter={() => console.log("CHECK...")}
        onSort={() => console.log("CHECK...")}
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
  resetFormTemplateForm
})(FormTemplateListPage);
