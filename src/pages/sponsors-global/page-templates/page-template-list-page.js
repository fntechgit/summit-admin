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
import {
  archivePageTemplate,
  getPageTemplates,
  savePageTemplate,
  deletePageTemplate,
  unarchivePageTemplate
} from "../../../actions/page-template-actions";
import MuiTable from "../../../components/mui/table/mui-table";
import SearchInput from "../../../components/mui/search-input";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";
import PageTemplatePopup from "./page-template-popup";
import PageTemplateClonePopup from "./page-template-clone-popup";

const PageTemplateListPage = ({
  pageTemplates,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  showArchived,
  totalPageTemplates,
  getPageTemplates,
  archivePageTemplate,
  unarchivePageTemplate,
  savePageTemplate,
  deletePageTemplate
}) => {
  const [pageTemplateId, setPageTemplateId] = useState(null);
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
      currentPage,
      perPage,
      order,
      orderDir,
      showArchived
    );
  };

  const handleShowArchived = (ev) => {
    getPageTemplates(
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleNewPageTemplate = () => {
    setPageTemplateId("new");
  };

  const handleClonePageTemplate = () => {
    setOpenCloneDialog(true);
  };

  const handleSavePageTemplate = (entity) => {
    savePageTemplate(entity).then(() => setPageTemplateId(null));
  };

  const handleArchive = (item) =>
    item.is_archived
      ? unarchivePageTemplate(item.id)
      : archivePageTemplate(item.id);

  const handleEdit = (row) => {
    console.log("EDIT", row);
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
      <PageTemplatePopup
        open={!!pageTemplateId}
        onClose={() => setPageTemplateId(null)}
        onSave={handleSavePageTemplate}
      />
      <PageTemplateClonePopup
        open={openCloneDialog}
        onClose={() => setOpenCloneDialog(false)}
      />
    </div>
  );
};

const mapStateToProps = ({ pageTemplateListState }) => ({
  ...pageTemplateListState
});

export default connect(mapStateToProps, {
  getPageTemplates,
  archivePageTemplate,
  unarchivePageTemplate,
  savePageTemplate,
  deletePageTemplate
})(PageTemplateListPage);
