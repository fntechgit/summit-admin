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
import history from "../../../history";
import {
  archiveSponsorForm,
  getSponsorForm,
  getSponsorForms,
  unarchiveSponsorForm,
  deleteSponsorForm
} from "../../../actions/sponsor-forms-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import SearchInput from "../../../components/mui/search-input";
import GlobalTemplatePopup from "./components/global-template/global-template-popup";
import FormTemplatePopup from "./components/form-template/form-template-popup";
import MuiTable from "../../../components/mui/table/mui-table";

const SponsorFormsListPage = ({
  sponsorForms,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalCount,
  getSponsorForms,
  getSponsorForm,
  archiveSponsorForm,
  unarchiveSponsorForm,
  deleteSponsorForm
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorForms();
  }, []);

  const handlePageChange = (page) => {
    getSponsorForms(term, page, perPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getSponsorForms(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getSponsorForms(searchTerm, currentPage, perPage, order, orderDir);
  };

  const handleRowEdit = (row) => {
    getSponsorForm(row.id).then(() => {
      setOpenPopup("new");
    });
  };

  const handleRowDelete = (itemId) => {
    deleteSponsorForm(itemId);
  };

  const handleManageItems = (form) => {
    history.push(`forms/${form.id}/items`);
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveSponsorForm(item.id)
      : archiveSponsorForm(item.id);

  const handleHideArchivedForms = (ev) => {
    getSponsorForms(
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("sponsor_forms.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_forms.name_column_label"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      header: T.translate("sponsor_forms.items_column_label"),
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
          Manage&nbsp;Items
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
          size="medium"
          onClick={() => handleArchiveItem(row)}
        >
          {row.is_archived
            ? T.translate("sponsor_forms.unarchive_button")
            : T.translate("sponsor_forms.archive_button")}
        </Button>
      ),
      dottedBorder: true
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  const tableData = sponsorForms.map((sf) => ({
    ...sf,
    cellStyle: sf.is_archived
      ? {
          backgroundColor: "background.light",
          color: "text.disabled"
        }
      : {}
  }));

  return (
    <div className="container">
      <h3>
        {T.translate("sponsor_forms.forms")} ({totalCount})
      </h3>
      <CustomAlert message={T.translate("sponsor_forms.alert_info")} hideIcon />
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
                    "aria-label": T.translate("sponsor_forms.hide_archived")
                  }}
                />
              }
              label={T.translate("sponsor_forms.hide_archived")}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={2}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("sponsor_forms.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("clone")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_forms.using_global")}
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
            {T.translate("sponsor_forms.add_form")}
          </Button>
        </Grid2>
      </Grid2>

      {sponsorForms.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={tableData}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onEdit={handleRowEdit}
            onDelete={handleRowDelete}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}
      <GlobalTemplatePopup
        open={openPopup === "clone"}
        onClose={() => setOpenPopup(null)}
      />
      <FormTemplatePopup
        open={openPopup === "new"}
        onClose={() => setOpenPopup(null)}
      />
    </div>
  );
};

const mapStateToProps = ({ sponsorFormsListState }) => ({
  ...sponsorFormsListState
});

export default connect(mapStateToProps, {
  getSponsorForms,
  getSponsorForm,
  archiveSponsorForm,
  unarchiveSponsorForm,
  deleteSponsorForm
})(SponsorFormsListPage);
