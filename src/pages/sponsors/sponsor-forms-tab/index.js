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
  getSponsorManagedForms,
  saveSponsorManagedForm
} from "../../../actions/sponsor-forms-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import SearchInput from "../../../components/mui/search-input";
import MuiTable from "../../../components/mui/table/mui-table";
import AddSponsorFormTemplatePopup from "./components/add-sponor-form-template-popup";

const SponsorFormsTab = ({
  sponsorManagedForms,
  sponsorCustomizedForms = [],
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalCount,
  sponsor,
  summitId,
  // TODO: WIP FUNCTION
  getSponsorManagedForms,
  saveSponsorManagedForm
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorManagedForms();
  }, []);

  const handlePageChange = (page) => {
    getSponsorManagedForms(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getSponsorManagedForms(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getSponsorManagedForms(searchTerm, currentPage, perPage, order, orderDir);
  };

  const handleCustomizeForm = (item) => {
    console.log("CUSTOMIZe : ", item);
  };

  const handleHideArchivedForms = (ev) => {
    getSponsorManagedForms(
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const buildColumns = (firstColumn) => [
    {
      columnKey: "name",
      header: firstColumn,
      sortable: true
    },
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.forms_tab.code"),
      sortable: true
    },
    {
      columnKey: "add_ons",
      header: T.translate("edit_sponsor.forms_tab.add_ons"),
      sortable: true,
      render: (row) =>
        row.add_ons.length > 0
          ? row.add_ons.map((a) => `${a.type} ${a.name}`).join(", ")
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
          onClick={() => handleManageItems(row)}
        >
          Manage&nbsp;Items
        </Button>
      ),
      dottedBorder: true
    },
    {
      columnKey: "customize",
      header: "",
      width: 70,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="medium"
          onClick={() => handleCustomizeForm(row)}
        >
          {T.translate("edit_sponsor.forms_tab.customize")}
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
          <Box component="span">{totalCount} forms</Box>
        </Grid2>
        <Grid2 size={2} offset={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
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
            onClick={() => setOpenPopup("new")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.forms_tab.new_form")}
          </Button>
        </Grid2>
      </Grid2>
      {sponsorCustomizedForms.length > 0 && (
        <div>
          <MuiTable
            columns={buildColumns(
              T.translate("edit_sponsor.forms_tab.sponsor_managed_forms")
            )}
            data={sponsorCustomizedForms}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}

      <div>
        <MuiTable
          columns={buildColumns(
            T.translate("edit_sponsor.forms_tab.managed_forms")
          )}
          data={sponsorManagedForms}
          options={tableOptions}
          perPage={perPage}
          totalRows={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSort={handleSort}
        />
      </div>

      <AddSponsorFormTemplatePopup
        open={openPopup === "template"}
        onClose={() => setOpenPopup(null)}
        onSubmit={saveSponsorManagedForm}
        sponsor={sponsor}
        summitId={summitId}
      />
      {/* <AddFormTemplate
        open={openPopup === "new"}
        onClose={() => setOpenPopup(null)}
      /> */}
    </Box>
  );
};

const mapStateToProps = ({ sponsorManagedFormsListState }) => ({
  ...sponsorManagedFormsListState
});

export default connect(mapStateToProps, {
  getSponsorManagedForms,
  saveSponsorManagedForm
})(SponsorFormsTab);
