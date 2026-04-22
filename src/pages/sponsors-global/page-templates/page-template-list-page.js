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
  Grid2
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  archivePageTemplate,
  deletePageTemplate,
  getPageTemplates,
  getPageTemplate,
  savePageTemplate,
  unarchivePageTemplate,
  resetPageTemplateForm
} from "../../../actions/page-template-actions";
import SearchInput from "../../../components/mui/search-input";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";
import PageTemplatePopup from "./page-template-popup";
import PageTemplateClonePopup from "./page-template-clone-popup";

const PageTemplateListPage = ({
  pageTemplates,
  pageTemplate,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  showArchived,
  totalPageTemplates,
  getPageTemplates,
  getPageTemplate,
  archivePageTemplate,
  unarchivePageTemplate,
  savePageTemplate,
  deletePageTemplate,
  resetPageTemplateForm
}) => {
  const [openPageDialog, setOpenPageDialog] = useState(false);
  const [openCloneDialog, setOpenCloneDialog] = useState(false);

  useEffect(() => {
    getPageTemplates();
  }, []);

  const handlePageChange = (page) => {
    getPageTemplates(term, page, perPage, order, orderDir, showArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getPageTemplates(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleSort = (key, dir) => {
    getPageTemplates(term, currentPage, perPage, key, dir, showArchived);
  };

  const handleSearch = (searchTerm) => {
    getPageTemplates(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleShowArchived = (ev) => {
    getPageTemplates(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleNewPageTemplate = () => {
    resetPageTemplateForm();
    setOpenPageDialog(true);
  };

  const handleClonePageTemplate = () => {
    setOpenCloneDialog(true);
  };

  const handleSavePageTemplate = (entity) => {
    savePageTemplate(entity).then(() => setOpenPageDialog(false));
  };

  const handleArchive = (item) =>
    item.is_archived
      ? unarchivePageTemplate(item.id)
      : archivePageTemplate(item.id);

  const handleEdit = (row) => {
    getPageTemplate(row.id).then(() => setOpenPageDialog(true));
  };

  const handleDelete = (row) => {
    deletePageTemplate(row).then(() =>
      getPageTemplates(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        showArchived
      )
    );
  };

  const handleClosePageDialog = () => {
    resetPageTemplateForm();
    setOpenPageDialog(false);
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("page_template_list.code"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("page_template_list.name"),
      sortable: true
    },
    {
      columnKey: "info_mod",
      header: T.translate("page_template_list.info_mod"),
      sortable: false
    },
    {
      columnKey: "upload_mod",
      header: T.translate("page_template_list.upload_mod"),
      sortable: false
    },
    {
      columnKey: "download_mod",
      header: T.translate("page_template_list.download_mod"),
      sortable: false
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3>
        {T.translate("page_template_list.page_templates")} ({totalPageTemplates}
        )
      </h3>
      <Alert
        severity="info"
        sx={{
          justifyContent: "start",
          alignItems: "center",
          mb: 2
        }}
      >
        {T.translate("page_template_list.alert_info")}
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
        <Grid2 size={2}>
          <Box component="span">{totalPageTemplates} pages</Box>
        </Grid2>
        <Grid2
          container
          size={10}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showArchived}
                  onChange={handleShowArchived}
                />
              }
              label={T.translate("page_template_list.show_archived")}
            />
          </FormGroup>
          <Grid2 size={4}>
            <SearchInput
              onSearch={handleSearch}
              term={term}
              placeholder={T.translate(
                "page_template_list.placeholders.search"
              )}
            />
          </Grid2>
          <Button
            variant="contained"
            size="medium"
            onClick={handleClonePageTemplate}
            startIcon={<AddIcon />}
          >
            {T.translate("page_template_list.add_template")}
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={handleNewPageTemplate}
            startIcon={<AddIcon />}
          >
            {T.translate("page_template_list.add_new")}
          </Button>
        </Grid2>
      </Grid2>

      <Box sx={{ mt: 4, mb: 2 }}>
        {pageTemplates.length === 0 && (
          <Box sx={{ textAlign: "center", fontStyle: "italic" }}>
            {T.translate("page_template_list.no_pages")}
          </Box>
        )}

        {pageTemplates.length > 0 && (
          <div>
            <MuiTable
              columns={columns}
              data={pageTemplates}
              options={tableOptions}
              perPage={perPage}
              currentPage={currentPage}
              totalRows={totalPageTemplates}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              onSort={handleSort}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </div>
        )}
      </Box>
      {openPageDialog && (
        <PageTemplatePopup
          pageTemplate={pageTemplate}
          onClose={handleClosePageDialog}
          onSave={handleSavePageTemplate}
        />
      )}
      {openCloneDialog && (
        <PageTemplateClonePopup onClose={() => setOpenCloneDialog(false)} />
      )}
    </div>
  );
};

const mapStateToProps = ({ pageTemplateListState, pageTemplateState }) => ({
  ...pageTemplateListState,
  pageTemplate: pageTemplateState.entity
});

export default connect(mapStateToProps, {
  getPageTemplates,
  getPageTemplate,
  archivePageTemplate,
  unarchivePageTemplate,
  savePageTemplate,
  deletePageTemplate,
  resetPageTemplateForm
})(PageTemplateListPage);
