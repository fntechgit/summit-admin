/**
 * Copyright 2020 OpenStack Foundation
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
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../../components/mui/grid-toolbar";
import {
  getPaymentProfiles,
  getPaymentProfile,
  savePaymentProfile,
  deletePaymentProfile,
  getPaymentFeeTypes,
  deletePaymentFeeType,
  savePaymentFeeType,
  resetPaymentProfileForm
} from "../../../actions/ticket-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";
import PaymentProfileDialog from "./components/payment-profile-dialog";

const PaymentProfileListPage = ({
  currentSummit,
  paymentProfiles,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalPaymentProfiles,
  getPaymentProfiles,
  getPaymentProfile,
  savePaymentProfile,
  deletePaymentProfile,
  resetPaymentProfileForm,
  currentPaymentProfile,
  paymentFeeTypes,
  getPaymentFeeTypes,
  savePaymentFeeType,
  deletePaymentFeeType
}) => {
  useEffect(() => {
    if (currentSummit?.id)
      getPaymentProfiles("", DEFAULT_CURRENT_PAGE, perPage);
  }, [currentSummit?.id]);

  const [paymentProfilePopup, setPaymentProfilePopup] = useState(false);

  const handleEdit = (paymentProfile) => {
    getPaymentProfile(paymentProfile.id).then(() => {
      getPaymentFeeTypes(paymentProfile.id);
      setPaymentProfilePopup(true);
    });
  };

  const handleSave = (entity) =>
    savePaymentProfile(entity).then(() =>
      getPaymentProfiles(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );

  const handleDelete = (paymentProfileId) =>
    deletePaymentProfile(paymentProfileId).then(() =>
      getPaymentProfiles(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );

  const handleSearch = (searchTerm) => {
    getPaymentProfiles(searchTerm, DEFAULT_CURRENT_PAGE, perPage);
  };

  const handlePageChange = (page) => {
    getPaymentProfiles(term, page, perPage, order, orderDir);
  };
  const handlePerPageChange = (newPerPage) => {
    getPaymentProfiles(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getPaymentProfiles(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);
  };

  const handleClose = () => {
    resetPaymentProfileForm();
    setPaymentProfilePopup(false);
  };

  const handleSaveFeeType = (entity) =>
    savePaymentFeeType(entity).then(() => {
      getPaymentFeeTypes(currentPaymentProfile.id);
    });

  const handleDeleteFeeType = (feeTypeId) =>
    deletePaymentFeeType(feeTypeId)
      .then(() => getPaymentFeeTypes(currentPaymentProfile.id))
      .catch(() => {});

  const handleNewPaymentProfile = () => {
    resetPaymentProfileForm();
    setPaymentProfilePopup(true);
  };

  const columns = [
    {
      columnKey: "id",
      header: T.translate("payment_profiles.id"),
      sortable: true
    },
    {
      columnKey: "application_type",
      header: T.translate("payment_profiles.application_type")
    },
    {
      columnKey: "provider",
      header: T.translate("payment_profiles.provider")
    },
    {
      columnKey: "is_active",
      header: T.translate("payment_profiles.active"),
      render: (row) => (row.is_active ? "Yes" : "No")
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>{T.translate("payment_profiles.payment_profiles_list")}</h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate(
            "payment_profiles.placeholders.search_profiles"
          )
        }}
      >
        <Button
          variant="contained"
          onClick={handleNewPaymentProfile}
          startIcon={<AddIcon />}
        >
          {T.translate("payment_profiles.add_payment_profile")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>
        {totalPaymentProfiles}{" "}
        {T.translate("payment_profiles.payment_profiles")}
      </Box>

      {paymentProfiles.length === 0 && (
        <div>{T.translate("payment_profiles.no_payment_profiles")}</div>
      )}

      {paymentProfiles.length > 0 && (
        <MuiTable
          columns={columns}
          data={paymentProfiles}
          options={table_options}
          totalRows={totalPaymentProfiles}
          perPage={perPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onDelete={handleDelete}
          onEdit={handleEdit}
          getName={(row) => row.id}
          deleteDialogBody={(id) =>
            T.translate("payment_profiles.remove_warning", { name: id })
          }
        />
      )}

      {paymentProfilePopup && (
        <PaymentProfileDialog
          entity={currentPaymentProfile}
          paymentFeeTypes={paymentFeeTypes}
          onClose={handleClose}
          onSave={handleSave}
          onSaveFeeType={handleSaveFeeType}
          onDeleteFeeType={handleDeleteFeeType}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentPaymentProfileListState,
  currentPaymentProfileState,
  currentPaymentFeeListTypeState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  paymentFeeTypes: currentPaymentFeeListTypeState,
  currentPaymentProfile: currentPaymentProfileState.entity,
  ...currentPaymentProfileListState
});

export default connect(mapStateToProps, {
  getPaymentProfiles,
  getPaymentProfile,
  savePaymentProfile,
  deletePaymentProfile,
  resetPaymentProfileForm,
  getPaymentFeeTypes,
  savePaymentFeeType,
  deletePaymentFeeType
})(PaymentProfileListPage);
