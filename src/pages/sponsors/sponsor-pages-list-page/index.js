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
  getSponsorPages,
  archiveSponsorPage,
  unarchiveSponsorPage,
  getSponsorPage,
  saveSponsorPage,
  resetSponsorPageForm
} from "../../../actions/sponsor-pages-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import MuiTable from "../../../components/mui/table/mui-table";
import GlobalPagePopup from "./components/global-page/global-page-popup";
import PageTemplatePopup from "../../sponsors-global/page-templates/page-template-popup";

const SponsorPagesListPage = ({
  sponsorPages,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  hideArchived,
  totalCount,
  currentSponsorPage,
  getSponsorPages,
  archiveSponsorPage,
  unarchiveSponsorPage,
  getSponsorPage,
  saveSponsorPage,
  resetSponsorPageForm
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorPages();
  }, []);

  const handlePageChange = (page) => {
    getSponsorPages(term, page, perPage, order, orderDir, hideArchived);
  };

  const handleSort = (key, dir) => {
    getSponsorPages(term, currentPage, perPage, key, dir, hideArchived);
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorPages(
      term,
      currentPage,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleRowEdit = (row) => {
    getSponsorPage(row.id).then(() => {
      setOpenPopup("new");
    });
  };

  const handleRowDelete = (itemId) => {
    console.log("DELETE ITEM ID...", itemId);
    // deleteSponsorForm(itemId);
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveSponsorPage(item.id)
      : archiveSponsorPage(item.id);

  const handleHideArchivedForms = (ev) => {
    getSponsorPages(
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const handleSaveSponsorPage = (entity) => {
    saveSponsorPage(entity).then(() => {
      setOpenPopup(null);
      getSponsorPages();
    });
  };

  const handleTemplatePopupClose = () => {
    resetSponsorPageForm();
    setOpenPopup(null);
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("sponsor_pages.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_pages.name_column_label"),
      sortable: true
    },
    {
      columnKey: "tier",
      header: T.translate("sponsor_pages.tier_column_label")
    },
    {
      columnKey: "info_mod",
      header: T.translate("sponsor_pages.info_mod_column_label")
    },
    {
      columnKey: "upload_mod",
      header: T.translate("sponsor_pages.upload_mod_column_label")
    },
    {
      columnKey: "download_mod",
      header: T.translate("sponsor_pages.download_mod_column_label")
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir,
    disableProp: "is_archived"
  };

  return (
    <div className="container">
      <h3>{T.translate("sponsor_pages.pages")}</h3>
      <CustomAlert message={T.translate("sponsor_pages.alert_info")} hideIcon />
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
            {totalCount} {T.translate("sponsor_pages.pages")}
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
                    "aria-label": T.translate("sponsor_pages.hide_archived")
                  }}
                />
              }
              label={T.translate("sponsor_pages.hide_archived")}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={2} />
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("clone")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_pages.using_template")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("new")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_pages.new_page")}
          </Button>
        </Grid2>
      </Grid2>

      {sponsorPages.length === 0 && (
        <div>{T.translate("sponsor_pages.no_sponsors_pages")}</div>
      )}

      {sponsorPages.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={sponsorPages}
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
        open={openPopup === "clone"}
        onClose={() => setOpenPopup(null)}
      />
      <PageTemplatePopup
        open={openPopup === "new"}
        pageTemplate={currentSponsorPage}
        onClose={handleTemplatePopupClose}
        onSave={handleSaveSponsorPage}
      />
    </div>
  );
};

const mapStateToProps = ({ sponsorPagesListState }) => ({
  ...sponsorPagesListState
});

export default connect(mapStateToProps, {
  getSponsorPages,
  archiveSponsorPage,
  unarchiveSponsorPage,
  getSponsorPage,
  saveSponsorPage,
  resetSponsorPageForm
})(SponsorPagesListPage);
