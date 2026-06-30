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
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import Restrict from "../../routes/restrict";
import {
  getTaxTypes,
  deleteTaxType,
  getTaxType,
  resetTaxTypeForm,
  saveTaxType,
  addTicketToTaxType,
  removeTicketFromTaxType
} from "../../actions/tax-actions";
import TaxTypePopup from "./popup/tax-type-popup";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const TaxTypeListPage = ({
  currentSummit,
  taxTypes,
  term,
  order,
  orderDir,
  perPage,
  currentPage,
  totalTaxTypes,
  currentTaxType,
  getTaxTypes,
  deleteTaxType,
  getTaxType,
  resetTaxTypeForm,
  saveTaxType,
  addTicketToTaxType,
  removeTicketFromTaxType,
  match
}) => {
  const [showTaxTypeModal, setShowTaxTypeModal] = useState(false);

  useEffect(() => {
    if (currentSummit?.id) {
      getTaxTypes(term, currentPage, perPage, order, orderDir);
    }
  }, [currentSummit]);

  const handleDelete = (taxTypeId) => {
    deleteTaxType(taxTypeId)
      .finally(() => {
        getTaxTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
      })
      .catch(() => {});
  };

  const handleSort = (key, dir) => {
    getTaxTypes(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getTaxTypes(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handlePageChange = (page) => {
    getTaxTypes(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getTaxTypes(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleOpenNewTaxType = () => {
    resetTaxTypeForm();
    setShowTaxTypeModal(true);
  };

  const handleEdit = (row) => {
    getTaxType(row.id).then(() => setShowTaxTypeModal(true));
  };

  const handleSave = (entity) =>
    saveTaxType(entity).then(() => {
      getTaxTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir).catch(
        () => {}
      );
    });

  const handleClosePopup = () => {
    resetTaxTypeForm();
    setShowTaxTypeModal(false);
  };

  const columns = [
    {
      columnKey: "name",
      header: T.translate("tax_type_list.name"),
      sortable: true
    },
    {
      columnKey: "rate",
      header: T.translate("tax_type_list.rate"),
      sortable: true
    },
    {
      columnKey: "tax_id",
      header: T.translate("tax_type_list.tax_id")
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  if (!currentSummit?.id) return <div />;

  return (
    <>
      <Breadcrumb
        data={{
          title: T.translate("tax_type_list.tax_types"),
          pathname: match.url
        }}
      />
      <div className="container">
        <h3>{T.translate("tax_type_list.tax_type_list")}</h3>

        <Grid2
          container
          spacing={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            mb: 2
          }}
        >
          <Grid2 size={6}>
            <Typography>
              {totalTaxTypes} {T.translate("general.items")}
            </Typography>
          </Grid2>
          <Grid2
            container
            size={6}
            spacing={1}
            sx={{
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Grid2 size={2} />
            <Grid2 size={6}>
              <SearchInput
                onSearch={handleSearch}
                term={term}
                placeholder={T.translate("tax_type_list.name")}
                debounced
              />
            </Grid2>
            <Grid2 size={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleOpenNewTaxType}
                startIcon={<AddIcon />}
                sx={{ height: "36px" }}
              >
                {T.translate("tax_type_list.add_tax_type")}
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>

        {taxTypes.length === 0 && (
          <div>{T.translate("tax_type_list.no_tax_types")}</div>
        )}

        {taxTypes.length > 0 && (
          <MuiTable
            options={tableOptions}
            data={taxTypes}
            columns={columns}
            totalRows={totalTaxTypes}
            perPage={perPage}
            currentPage={currentPage}
            getName={(item) => item.name}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleteDialogBody={(name) =>
              T.translate("tax_type_list.remove_warning", { taxType: name })
            }
            confirmButtonColor="error"
          />
        )}

        {showTaxTypeModal && (
          <TaxTypePopup
            onClose={handleClosePopup}
            entity={currentTaxType}
            currentSummit={currentSummit}
            onSave={handleSave}
            onTicketLink={addTicketToTaxType}
            onTicketUnLink={removeTicketFromTaxType}
          />
        )}
      </div>
    </>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentTaxTypeListState,
  currentTaxTypeState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentTaxTypeListState,
  currentTaxType: currentTaxTypeState.entity
});

export default Restrict(
  connect(mapStateToProps, {
    getTaxTypes,
    deleteTaxType,
    getTaxType,
    resetTaxTypeForm,
    saveTaxType,
    addTicketToTaxType,
    removeTicketFromTaxType
  })(TaxTypeListPage),
  "taxes"
);
