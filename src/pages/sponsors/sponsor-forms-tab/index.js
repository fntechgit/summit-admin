/**
 * Copyright 2026 OpenStack Foundation
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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import {
  archiveSponsorCustomizedForm,
  deleteSponsorCustomizedForm,
  getSponsorCustomizedForms,
  getSponsorManagedForms,
  saveSponsorManagedForm,
  unarchiveSponsorCustomizedForm
} from "../../../actions/sponsor-forms-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import SearchInput from "../../../components/mui/search-input";
import MuiTable from "../../../components/mui/table/mui-table";
import AddSponsorFormTemplatePopup from "./components/add-sponsor-form-template-popup";
import CustomizedFormPopup from "./components/customized-form/customized-form-popup";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

const SponsorFormsTab = ({
  term,
  history,
  hideArchived,
  managedForms,
  customizedForms,
  sponsor,
  summitId,
  getSponsorManagedForms,
  getSponsorCustomizedForms,
  saveSponsorManagedForm,
  archiveSponsorCustomizedForm,
  unarchiveSponsorCustomizedForm,
  deleteSponsorCustomizedForm
}) => {
  const [openPopup, setOpenPopup] = useState(null);
  const [customFormEdit, setCustomFormEdit] = useState(null);

  useEffect(() => {
    getSponsorManagedForms();
    getSponsorCustomizedForms();
  }, []);

  const handleManagedPageChange = (page) => {
    const { perPage, order, orderDir } = managedForms;
    getSponsorManagedForms(term, page, perPage, order, orderDir, hideArchived);
  };

  const handleManagedSort = (key, dir) => {
    const { currentPage, perPage } = managedForms;
    getSponsorManagedForms(term, currentPage, perPage, key, dir, hideArchived);
  };

  const handleCustomizedPageChange = (page) => {
    const { perPage, order, orderDir } = customizedForms;
    getSponsorCustomizedForms(
      term,
      page,
      perPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleCustomizedSort = (key, dir) => {
    const { currentPage, perPage } = customizedForms;
    getSponsorCustomizedForms(
      term,
      currentPage,
      perPage,
      key,
      dir,
      hideArchived
    );
  };

  const handleSearch = (searchTerm) => {
    getSponsorManagedForms(searchTerm);
    getSponsorCustomizedForms(searchTerm);
  };

  const handleCustomizeForm = (item) => {
    console.log("CUSTOMIZE : ", item);
  };

  const handleArchiveForm = (item) =>
    item.is_archived
      ? unarchiveSponsorCustomizedForm(item.id)
      : archiveSponsorCustomizedForm(item.id);

  const handleCustomizedFormManageItems = (item) => {
    history.push(
      `/app/summits/${summitId}/sponsors/${sponsor.id}/sponsor-forms/${item.id}/items#forms`
    );
  };

  const handleManagedFormManageItems = (item) => {
    console.log("Managed Form Item Edit : ", item);
  };

  const handleCustomizedEdit = (item) => {
    setCustomFormEdit(item);
  };

  const handleCustomizedDelete = (itemId) => {
    deleteSponsorCustomizedForm(itemId).then(() => {
      const { perPage, order, orderDir } = customizedForms;
      getSponsorCustomizedForms(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      );
    });
  };

  const handleHideArchivedForms = (ev) => {
    getSponsorManagedForms(
      term,
      DEFAULT_CURRENT_PAGE,
      managedForms.perPage,
      managedForms.order,
      managedForms.orderDir,
      ev.target.checked
    );
    getSponsorCustomizedForms(
      term,
      DEFAULT_CURRENT_PAGE,
      customizedForms.perPage,
      customizedForms.order,
      customizedForms.orderDir,
      ev.target.checked
    );
  };

  const handleSaveFormFromTemplate = (entity) => {
    saveSponsorManagedForm(entity).then(() => {
      const { perPage, order, orderDir } = managedForms;
      getSponsorManagedForms(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        hideArchived
      );
      setOpenPopup(null);
    });
  };

  const baseColumns = (name, manageItemsFn) => [
    {
      columnKey: "name",
      header: name,
      sortable: true
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.forms_tab.code"),
      sortable: true
    },
    {
      columnKey: "allowed_add_ons",
      header: T.translate("edit_sponsor.forms_tab.add_ons"),
      sortable: true,
      render: (row) =>
        row.allowed_add_ons?.length > 0
          ? row.allowed_add_ons.map((a) => `${a.type} ${a.name}`).join(", ")
          : "None"
    },
    {
      columnKey: "opens_at",
      header: T.translate("edit_sponsor.forms_tab.opens_at"),
      sortable: true
    },
    {
      columnKey: "expires_at",
      header: T.translate("edit_sponsor.forms_tab.expires_at"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      header: T.translate("edit_sponsor.forms_tab.items"),
      sortable: true,
      render: (row) =>
        `${row.items_count} ${row.items_count === 1 ? "Item" : "Items"}`
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
          onClick={() => manageItemsFn(row)}
        >
          Manage&nbsp;Items
        </Button>
      ),
      dottedBorder: true
    }
  ];

  const managedFormsColumns = [
    ...baseColumns(
      T.translate("edit_sponsor.forms_tab.managed_forms"),
      handleManagedFormManageItems
    ),
    {
      columnKey: "archive",
      header: "",
      width: 150,
      render: () => null
    },
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
          onClick={() => handleCustomizeForm(row)}
        >
          {T.translate("edit_sponsor.forms_tab.customize")}
          <ArrowForwardIcon fontSize="large" sx={{ marginLeft: 1 }} />
        </Button>
      ),
      dottedBorder: true
    }
  ];

  const customizedFormsColumns = [
    ...baseColumns(
      T.translate("edit_sponsor.forms_tab.sponsor_customized_forms"),
      handleCustomizedFormManageItems
    )
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <CustomAlert
        message={T.translate("edit_sponsor.forms_tab.alert_info")}
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
            {managedForms.totalCount + customizedForms.totalCount} forms
          </Box>
        </Grid2>
        <Grid2 size={2} offset={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  value={hideArchived}
                  onChange={handleHideArchivedForms}
                  inputProps={{
                    "aria-label": T.translate(
                      "edit_sponsor.forms_tab.hide_archived"
                    )
                  }}
                />
              }
              label={T.translate("edit_sponsor.forms_tab.hide_archived")}
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
            onClick={() => setOpenPopup("template")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.forms_tab.using_template")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setCustomFormEdit("new")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.forms_tab.new_form")}
          </Button>
        </Grid2>
      </Grid2>
      <div>
        <MuiTable
          columns={customizedFormsColumns}
          data={customizedForms.forms}
          options={{
            sortCol: customizedForms.order,
            sortDir: customizedForms.orderDir,
            disableProp: "is_archived"
          }}
          perPage={customizedForms.perPage}
          totalRows={customizedForms.totalCount}
          currentPage={customizedForms.currentPage}
          onPageChange={handleCustomizedPageChange}
          onSort={handleCustomizedSort}
          onEdit={handleCustomizedEdit}
          onDelete={handleCustomizedDelete}
          onArchive={handleArchiveForm}
        />
      </div>

      <div>
        <MuiTable
          columns={managedFormsColumns}
          data={managedForms.forms}
          options={{
            sortCol: managedForms.order,
            sortDir: managedForms.orderDir
          }}
          perPage={managedForms.perPage}
          totalRows={managedForms.totalCount}
          currentPage={managedForms.currentPage}
          onPageChange={handleManagedPageChange}
          onSort={handleManagedSort}
        />
      </div>

      {openPopup === "template" && (
        <AddSponsorFormTemplatePopup
          onClose={() => setOpenPopup(null)}
          onSubmit={handleSaveFormFromTemplate}
          sponsor={sponsor}
          summitId={summitId}
        />
      )}

      <CustomizedFormPopup
        formId={customFormEdit?.id || null}
        open={!!customFormEdit}
        onClose={() => setCustomFormEdit(null)}
        sponsor={sponsor}
        summitId={summitId}
      />
    </Box>
  );
};

const mapStateToProps = ({ sponsorPageFormsListState }) => ({
  ...sponsorPageFormsListState
});

export default connect(mapStateToProps, {
  getSponsorManagedForms,
  saveSponsorManagedForm,
  getSponsorCustomizedForms,
  archiveSponsorCustomizedForm,
  unarchiveSponsorCustomizedForm,
  deleteSponsorCustomizedForm
})(SponsorFormsTab);
