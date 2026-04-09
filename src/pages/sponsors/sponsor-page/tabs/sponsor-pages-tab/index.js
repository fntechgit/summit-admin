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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  getSponsorManagedPages,
  getSponsorManagedPage,
  getSponsorCustomizedPages,
  saveSponsorManagedPage,
  saveSponsorCustomizedPage,
  getSponsorCustomizedPage,
  deleteSponsorManagedPage,
  unarchiveCustomizedPage,
  archiveCustomizedPage,
  resetSponsorPage,
} from "../../../../../actions/sponsor-pages-actions";
import CustomAlert from "../../../../../components/mui/custom-alert";
import SearchInput from "../../../../../components/mui/search-input";
import {
  DEFAULT_CURRENT_PAGE,
  SPONSOR_MANAGED_PAGE_ASSIGNMENT
} from "../../../../../utils/constants";
import AddSponsorPageTemplatePopup from "./components/add-sponsor-page-template-popup";
import PageTemplatePopup from "../../../../sponsors-global/page-templates/page-template-popup";

const SponsorPagesTab = ({
  sponsor,
  currentSummit,
  term,
  hideArchived,
  managedPages,
  customizedPages,
  summitTZ,
  currentEditPage,
  getSponsorManagedPages,
  getSponsorManagedPage,
  saveSponsorManagedPage,
  getSponsorCustomizedPages,
  saveSponsorCustomizedPage,
  getSponsorCustomizedPage,
  deleteSponsorManagedPage,
  unarchiveCustomizedPage,
  archiveCustomizedPage,
  resetSponsorPage
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorManagedPages();
    getSponsorCustomizedPages();
  }, []);

  const handleManagedPageChange = (page) => {
    const { perPage, order, orderDir } = managedPages;
    getSponsorManagedPages(term, page, perPage, order, orderDir, hideArchived);
  };

  const handleManagedPerPageChange = (newPerPage) => {
    const { order, orderDir } = managedPages;
    getSponsorManagedPages(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleManagedSort = (key, dir) => {
    const { perPage } = managedPages;
    getSponsorManagedPages(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      hideArchived
    );
  };

  const handleCustomizedPageChange = (page) => {
    const { perPage, order, orderDir } = customizedPages;
    getSponsorCustomizedPages(
      term,
      page,
      perPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleCustomizedPerPageChange = (newPerPage) => {
    const { order, orderDir } = customizedPages;
    getSponsorCustomizedPages(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleCustomizedSort = (key, dir) => {
    const { perPage } = customizedPages;

    getSponsorCustomizedPages(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      hideArchived
    );
  };

  const handleSearch = (searchTerm) => {
    const {
      perPage: perPageManaged,
      order: orderManaged,
      orderDir: orderDirManaged
    } = managedPages;
    const {
      perPage: perPageCustomized,
      order: orderCustomized,
      orderDir: orderDirCustomized
    } = customizedPages;
    getSponsorManagedPages(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPageManaged,
      orderManaged,
      orderDirManaged,
      hideArchived
    );
    getSponsorCustomizedPages(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPageCustomized,
      orderCustomized,
      orderDirCustomized,
      hideArchived
    );
  };

  const handleUsingTemplate = () => {
    setOpenPopup("usingTemplate");
  };

  const handleAddPage = () => {
    setOpenPopup("customizedPagePopup");
  };

  const handleArchiveCustomizedPage = (item) =>
    (item.is_archived
      ? unarchiveCustomizedPage(item.id)
      : archiveCustomizedPage(item.id)
    ).then(() => {
      const { perPage, order, orderDir, currentPage } = customizedPages;
      return getSponsorCustomizedPages(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        hideArchived
      );
    });

  const handleArchiveManagedPage = (item) =>
    console.log("ARCHIVE MANAGED ", item);

  const handleManagedEdit = (item) => {
    console.log("CHECK!", item);
    getSponsorManagedPage(item.id).then(() => setOpenPopup("managedPagePopup"));
  };

  const handleManagedDelete = (itemId) => {
    deleteSponsorManagedPage(itemId).then(() => {
      const { perPage, order, orderDir } = managedPages;
      getSponsorManagedPages(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      );
    });
  };

  const handleCustomizedEdit = (item) => {
    getSponsorCustomizedPage(item.id).then(() =>
      setOpenPopup("customizedPagePopup")
    );
  };

  const handleCustomizedDelete = (itemId) => {
    console.log("DELETE CUSTOMIZED ", itemId);
  };

  const handleHideArchived = (ev) => {
    getSponsorManagedPages(
      term,
      DEFAULT_CURRENT_PAGE,
      managedPages.perPage,
      managedPages.order,
      managedPages.orderDir,
      ev.target.checked
    );
    getSponsorCustomizedPages(
      term,
      DEFAULT_CURRENT_PAGE,
      customizedPages.perPage,
      customizedPages.order,
      customizedPages.orderDir,
      ev.target.checked
    );
  };

  const handleSaveManagedPageFromTemplate = (entity) => {
    saveSponsorManagedPage(entity)
      .then(() => {
        const { perPage, order, orderDir } = managedPages;
        getSponsorManagedPages(
          term,
          DEFAULT_CURRENT_PAGE,
          perPage,
          order,
          orderDir,
          hideArchived
        );
      })
      .finally(() => setOpenPopup(null));
  };

  const handleSaveCustomizedPage = (entity) => {
    saveSponsorCustomizedPage(entity)
      .then(() => {
        const { perPage, order, orderDir } = customizedPages;
        getSponsorCustomizedPages(
          term,
          DEFAULT_CURRENT_PAGE,
          perPage,
          order,
          orderDir,
          hideArchived
        );
      })
      .finally(() => setOpenPopup(null));
  };

  const handleSaveManagedPage = (entity) => {
    saveSponsorManagedPage(entity)
      .then(() => {
        getSponsorManagedPages(
          term,
          DEFAULT_CURRENT_PAGE,
          managedPages.perPage,
          managedPages.order,
          managedPages.orderDir,
          hideArchived
        );
        getSponsorCustomizedPages(
          term,
          DEFAULT_CURRENT_PAGE,
          customizedPages.perPage,
          customizedPages.order,
          customizedPages.orderDir,
          hideArchived
        );
      })
      .finally(() => setOpenPopup(null));
  };

  const handleClosePagePopup = () => {
    resetSponsorPage();
    setOpenPopup(null);
  };

  const baseColumns = (name) => [
    {
      columnKey: "name",
      header: name,
      sortable: true
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.pages_tab.code"),
      sortable: true
    },
    {
      columnKey: "allowed_add_ons",
      header: T.translate("edit_sponsor.pages_tab.add_ons"),
      sortable: true,
      render: (row) =>
        row.allowed_add_ons?.length > 0
          ? row.allowed_add_ons.map((a) => `${a.type} ${a.name}`).join(", ")
          : ""
    },
    {
      columnKey: "info_mod",
      header: T.translate("edit_sponsor.pages_tab.info_mod")
    },
    {
      columnKey: "upload_mod",
      header: T.translate("edit_sponsor.pages_tab.upload_mod")
    },
    {
      columnKey: "download_mod",
      header: T.translate("edit_sponsor.pages_tab.download_mod")
    }
  ];

  const managedPagesColumns = [
    ...baseColumns(T.translate("edit_sponsor.pages_tab.managed_pages")),
    {
      columnKey: "customize",
      header: "",
      width: 156,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="medium"
          onClick={() => handleManagedEdit(row)}
        >
          {T.translate("edit_sponsor.forms_tab.customize")}
          <ArrowForwardIcon fontSize="large" sx={{ marginLeft: 1 }} />
        </Button>
      ),
      dottedBorder: true
    }
  ];

  const customizedPagesColumns = [
    ...baseColumns(
      T.translate("edit_sponsor.pages_tab.sponsor_customized_pages")
    )
  ];

  const sponsorshipIds = sponsor.sponsorships_collection.sponsorships.map(
    (e) => e.id
  );

  return (
    <Box sx={{ mt: 2 }}>
      <CustomAlert
        message={T.translate("edit_sponsor.pages_tab.alert_info")}
        hideIcon
      />
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
            {managedPages.totalItems + customizedPages.totalItems}{" "}
            {T.translate("edit_sponsor.pages_tab.pages")}
          </Box>
        </Grid2>
        <Grid2 size={2} offset={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideArchived}
                  onChange={handleHideArchived}
                  inputProps={{
                    "aria-label": T.translate(
                      "edit_sponsor.pages_tab.hide_archived"
                    )
                  }}
                />
              }
              label={T.translate("edit_sponsor.pages_tab.hide_archived")}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={2}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("edit_sponsor.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={handleUsingTemplate}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.pages_tab.using_template")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={handleAddPage}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.pages_tab.new_page")}
          </Button>
        </Grid2>
      </Grid2>
      <div>
        <MuiTable
          columns={customizedPagesColumns}
          data={customizedPages.pages}
          options={{
            sortCol: customizedPages.order,
            sortDir: customizedPages.orderDir,
            disableProp: "is_archived"
          }}
          perPage={customizedPages.perPage}
          totalRows={customizedPages.totalItems}
          currentPage={customizedPages.currentPage}
          onPageChange={handleCustomizedPageChange}
          onPerPageChange={handleCustomizedPerPageChange}
          onSort={handleCustomizedSort}
          onEdit={handleCustomizedEdit}
          onDelete={handleCustomizedDelete}
          onArchive={handleArchiveCustomizedPage}
        />
      </div>

      <div>
        <MuiTable
          columns={managedPagesColumns}
          data={managedPages.pages}
          options={{
            sortCol: managedPages.order,
            sortDir: managedPages.orderDir
          }}
          perPage={managedPages.perPage}
          totalRows={managedPages.totalItems}
          currentPage={managedPages.currentPage}
          onPageChange={handleManagedPageChange}
          onPerPageChange={handleManagedPerPageChange}
          onSort={handleManagedSort}
          onDelete={handleManagedDelete}
          canDelete={(row) =>
            row.assigned_type === SPONSOR_MANAGED_PAGE_ASSIGNMENT.EXPLICIT
          }
          onArchive={handleArchiveManagedPage}
        />
      </div>

      {openPopup === "usingTemplate" && (
        <AddSponsorPageTemplatePopup
          sponsor={sponsor}
          summitId={currentSummit.id}
          onSubmit={handleSaveManagedPageFromTemplate}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {(openPopup === "customizedPagePopup" ||
        openPopup === "managedPagePopup") && (
        <PageTemplatePopup
          title={
            openPopup === "managedPagePopup"
              ? T.translate("edit_sponsor.pages_tab.title_customize")
              : undefined
          }
          onSave={
            openPopup === "customizedPagePopup"
              ? handleSaveCustomizedPage
              : handleSaveManagedPage
          }
          onClose={handleClosePagePopup}
          pageTemplate={currentEditPage}
          sponsorshipIds={sponsorshipIds}
          summitId={currentSummit.id}
          sponsorId={sponsor.id}
          summitTZ={summitTZ}
        />
      )}
    </Box>
  );
};

const mapStateToProps = ({
  sponsorPagePagesListState,
  currentSummitState,
  currentSponsorState
}) => ({
  ...sponsorPagePagesListState,
  currentSummit: currentSummitState.currentSummit,
  sponsor: currentSponsorState.entity
});

export default connect(mapStateToProps, {
  getSponsorManagedPages,
  getSponsorManagedPage,
  saveSponsorManagedPage,
  getSponsorCustomizedPage,
  getSponsorCustomizedPages,
  saveSponsorCustomizedPage,
  deleteSponsorManagedPage,
  unarchiveCustomizedPage,
  archiveCustomizedPage,
  resetSponsorPage
})(SponsorPagesTab);
