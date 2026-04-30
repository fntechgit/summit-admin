/**
 * Copyright 2017 OpenStack Foundation
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
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  getCompanies,
  getCompany,
  deleteCompany,
  saveCompany,
  resetCompanyForm
} from "../../actions/company-actions";
import {
  getSponsoredProjects,
  saveSupportingCompany,
  deleteSupportingCompany
} from "../../actions/sponsored-project-actions";
import { DEFAULT_CURRENT_PAGE, MAX_PER_PAGE } from "../../utils/constants";
import CompanyDialog from "./components/company-dialog";

const CompanyListPage = ({
  companies,
  currentCompany,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCompanies,
  getCompanies,
  getCompany,
  deleteCompany,
  saveCompany,
  resetCompanyForm,
  getSponsoredProjects,
  saveSupportingCompany,
  deleteSupportingCompany,
  sponsoredProjects
}) => {
  const [companyPopup, setCompanyPopup] = useState(false);

  useEffect(() => {
    if (window.APP_CLIENT_NAME === "openstack")
      getSponsoredProjects("", 1, MAX_PER_PAGE);
  }, []);

  const columns = [
    { columnKey: "id", header: "Id", sortable: true },
    { columnKey: "name", header: T.translate("general.name"), sortable: true },
    { columnKey: "contact_email", header: T.translate("general.email") },
    {
      columnKey: "member_level",
      header: T.translate("company_list.member_level")
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  useState(() => {
    getCompanies();
  }, []);

  const handleEdit = (company) => {
    getCompany(company.id).then(() => setCompanyPopup(true));
  };

  const handleDelete = (companyId) => {
    deleteCompany(companyId).then(() =>
      getCompanies(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const handlePageChange = (page) => {
    getCompanies(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getCompanies(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getCompanies(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getCompanies(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleNewCompany = () => {
    resetCompanyForm();
    setCompanyPopup(true);
  };

  const handleSave = (entity) => {
    saveCompany(entity).then(() => {
      setCompanyPopup(false);
      getCompanies(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
    });
  };

  const handleClose = () => {
    setCompanyPopup(false);
  };

  return (
    <div className="container">
      <h3> {T.translate("company_list.company_list")}</h3>
      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalCompanies} {T.translate("company_list.companies")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <SearchInput
              term={term}
              onSearch={handleSearch}
              placeholder={T.translate(
                "company_list.placeholders.search_companies"
              )}
            />
          </Grid2>
          <Button
            variant="contained"
            onClick={handleNewCompany}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("company_list.add_company")}
          </Button>
        </Grid2>
      </Grid2>

      {companies.length > 0 && (
        <MuiTable
          columns={columns}
          data={companies}
          options={table_options}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalCompanies}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onDelete={handleDelete}
          onEdit={handleEdit}
          deleteDialogBody={(name) =>
            T.translate("company_list.delete_company_warning", { name })
          }
        />
      )}

      {companies.length === 0 && (
        <div>{T.translate("company_list.no_results")}</div>
      )}

      {companyPopup && (
        <CompanyDialog
          entity={currentCompany}
          onClose={handleClose}
          onSave={handleSave}
          onAddSponsorship={saveSupportingCompany}
          onDeleteSponsorship={deleteSupportingCompany}
          sponsoredProjects={sponsoredProjects}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentCompanyListState,
  sponsoredProjectListState,
  currentCompanyState
}) => ({
  ...currentCompanyListState,
  currentCompany: currentCompanyState.entity,
  sponsoredProjects: sponsoredProjectListState.sponsoredProjects
});

export default connect(mapStateToProps, {
  getCompanies,
  getCompany,
  deleteCompany,
  saveCompany,
  resetCompanyForm,
  getSponsoredProjects,
  saveSupportingCompany,
  deleteSupportingCompany
})(CompanyListPage);
