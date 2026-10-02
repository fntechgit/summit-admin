/**
 * Copyright 2019 OpenStack Foundation
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
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import CompanyInput from "openstack-uicore-foundation/lib/components/inputs/company-input";
import GridToolbar from "../../components/mui/grid-toolbar";
import RegistrationCompaniesImportDialog from "./registration-companies-import-dialog";
import { getSummitById } from "../../actions/summit-actions";
import {
  getRegistrationCompanies,
  addRegistrationCompany,
  deleteRegistrationCompany,
  importRegistrationCompaniesCSV
} from "../../actions/registration-companies-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const RegistrationCompaniesListPage = ({
  currentSummit,
  companies,
  term,
  order,
  orderDir,
  perPage,
  currentPage,
  totalCompanies,
  getRegistrationCompanies,
  addRegistrationCompany,
  deleteRegistrationCompany,
  importRegistrationCompaniesCSV,
  history
}) => {
  const [dropdownCompany, setDropdownCompany] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    if (currentSummit) getRegistrationCompanies();
  }, [currentSummit]);

  const handleChange = (ev) => setDropdownCompany(ev.target.value);

  const handleAddCompany = (company) => {
    if (!company) return;
    addRegistrationCompany(company);
    setDropdownCompany(null);
  };

  const handleImportCompanies = (formData) =>
    importRegistrationCompaniesCSV(formData);

  const handleDeleteCompany = (companyId) =>
    deleteRegistrationCompany(companyId);

  const handleEditCompany = (company) =>
    history.push(`/app/companies/${company.id}`);

  const handleSearch = (searchTerm) =>
    getRegistrationCompanies(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );

  const handlePageChange = (page) =>
    getRegistrationCompanies(term, page, perPage, order, orderDir);

  const handlePerPageChange = (newPerPage) =>
    getRegistrationCompanies(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );

  const handleSort = (key, dir) =>
    getRegistrationCompanies(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);

  const columns = [
    {
      columnKey: "name",
      header: T.translate("registration_companies.name"),
      sortable: true
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {T.translate("registration_companies.registration_companies_list")}
      </h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate(
            "registration_companies.placeholders.search_companies"
          )
        }}
      >
        <Box
          sx={{ display: "flex", gap: 1, flexGrow: 1, justifyContent: "end" }}
        >
          <Box sx={{ flexGrow: 1, maxWidth: 350 }}>
            <CompanyInput
              id="registration-company"
              value={dropdownCompany}
              onChange={handleChange}
              summitId={currentSummit.id}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => handleAddCompany(dropdownCompany)}
            startIcon={<AddIcon />}
          >
            {T.translate("general.add")}
          </Button>
        </Box>
        <Button
          variant="contained"
          onClick={() => setShowImportDialog(true)}
          startIcon={<UploadFileIcon />}
        >
          {T.translate("registration_companies.import")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>
        {totalCompanies}{" "}
        {T.translate("registration_companies.registration_companies")}
      </Box>

      {companies.length === 0 && (
        <div>
          {T.translate("registration_companies.no_registration_companies")}
        </div>
      )}

      {companies.length > 0 && (
        <MuiTable
          options={table_options}
          data={companies}
          columns={columns}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalCompanies}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onDelete={handleDeleteCompany}
          deleteDialogBody={(name) =>
            T.translate("registration_companies.remove_warning", { name })
          }
          onEdit={handleEditCompany}
        />
      )}
      {showImportDialog && (
        <RegistrationCompaniesImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportCompanies}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentRegistrationCompanyListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentRegistrationCompanyListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getRegistrationCompanies,
  addRegistrationCompany,
  deleteRegistrationCompany,
  importRegistrationCompaniesCSV
})(RegistrationCompaniesListPage);
