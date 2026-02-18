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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  getShowPages,
  archiveShowPage,
  unarchiveShowPage,
  getShowPage,
  saveShowPage,
  deleteShowPage,
  resetShowPageForm
} from "../../../actions/show-pages-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import MuiTable from "../../../components/mui/table/mui-table";
import GlobalPagePopup from "./components/global-page/global-page-popup";
import PageTemplatePopup from "../../sponsors-global/page-templates/page-template-popup";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

const ShowPagesListPage = ({
  showPages,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  hideArchived,
  totalCount,
  summitTZ,
  currentShowPage,
  getShowPages,
  archiveShowPage,
  unarchiveShowPage,
  getShowPage,
  saveShowPage,
  deleteShowPage,
  resetShowPageForm
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getShowPages();
  }, []);

  const handlePageChange = (page) => {
    getShowPages(term, page, perPage, order, orderDir, hideArchived);
  };

  const handleSort = (key, dir) => {
    getShowPages(term, currentPage, perPage, key, dir, hideArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getShowPages(term, currentPage, newPerPage, order, orderDir, hideArchived);
  };

  const handleRowEdit = (row) => {
    getShowPage(row.id).then(() => {
      setOpenPopup("pageTemplate");
    });
  };

  const handleRowDelete = (itemId) => {
    deleteShowPage(itemId).then(() =>
      getShowPages(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      )
    );
  };

  const handleArchiveItem = (item) =>
    item.is_archived ? unarchiveShowPage(item.id) : archiveShowPage(item.id);

  const handleHideArchivedForms = (ev) => {
    getShowPages(
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleSaveShowPage = (entity) => {
    saveShowPage(entity).then(() => {
      setOpenPopup(null);
      getShowPages();
    });
  };

  const handleTemplatePopupClose = () => {
    resetShowPageForm();
    setOpenPopup(null);
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("show_pages.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("show_pages.name_column_label"),
      sortable: true
    },
    {
      columnKey: "tier",
      header: T.translate("show_pages.tier_column_label")
    },
    {
      columnKey: "info_mod",
      header: T.translate("show_pages.info_mod_column_label")
    },
    {
      columnKey: "upload_mod",
      header: T.translate("show_pages.upload_mod_column_label")
    },
    {
      columnKey: "download_mod",
      header: T.translate("show_pages.download_mod_column_label")
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir,
    disableProp: "is_archived"
  };

  return (
    <div className="container">
      <h3>{T.translate("show_pages.pages")}</h3>
      <CustomAlert message={T.translate("show_pages.alert_info")} hideIcon />
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
          <Box component="span">
            {totalCount} {T.translate("show_pages.pages")}
          </Box>
        </Grid2>
        <Grid2 size={2} offset={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={handleHideArchivedForms}
                  checked={hideArchived}
                  inputProps={{
                    "aria-label": T.translate("show_pages.hide_archived")
                  }}
                />
              }
              label={T.translate("show_pages.hide_archived")}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={2} />
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("cloneTemplate")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("show_pages.using_template")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("pageTemplate")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("show_pages.new_page")}
          </Button>
        </Grid2>
      </Grid2>

      {showPages.length === 0 && (
        <div>{T.translate("show_pages.no_sponsors_pages")}</div>
      )}

      {showPages.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={showPages}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onDelete={handleRowDelete}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
          />
        </div>
      )}

      <GlobalPagePopup
        open={openPopup === "cloneTemplate"}
        onClose={() => setOpenPopup(null)}
      />
      <PageTemplatePopup
        open={openPopup === "pageTemplate"}
        pageTemplate={currentShowPage}
        onClose={handleTemplatePopupClose}
        onSave={handleSaveShowPage}
        summitTZ={summitTZ}
      />
    </div>
  );
};

const mapStateToProps = ({ showPagesListState }) => ({
  ...showPagesListState
});

export default connect(mapStateToProps, {
  getShowPages,
  archiveShowPage,
  unarchiveShowPage,
  getShowPage,
  saveShowPage,
  deleteShowPage,
  resetShowPageForm
})(ShowPagesListPage);
