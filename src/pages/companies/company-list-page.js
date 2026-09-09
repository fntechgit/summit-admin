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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
import { getCompanies, deleteCompany } from "../../actions/company-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const CompanyListPage = ({
  companies,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCompanies,
  history,
  getCompanies,
  deleteCompany
}) => {
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

  useEffect(() => {
    getCompanies();
  }, []);

  const handleEdit = (company) => {
    history.push(`/app/companies/${company.id}`);
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
    history.push("/app/companies/new");
  };

  return (
    <div className="container">
      <h3> {T.translate("company_list.company_list")}</h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate("company_list.placeholders.search_companies")
        }}
      >
        <Button
          variant="contained"
          onClick={handleNewCompany}
          startIcon={<AddIcon />}
        >
          {T.translate("company_list.add_company")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>
        {totalCompanies} {T.translate("company_list.companies")}
      </Box>

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
    </div>
  );
};

const mapStateToProps = ({ currentCompanyListState }) => ({
  ...currentCompanyListState
});

export default connect(mapStateToProps, {
  getCompanies,
  deleteCompany
})(CompanyListPage);
