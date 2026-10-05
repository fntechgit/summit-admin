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
  CircularProgress,
  Grid2,
  IconButton
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import history from "../../../../../history";
import { getSponsorCart } from "../../../../../actions/sponsor-cart-actions";
import PurchaseStatusCell from "../../../components/purchase-status-cell";
import PurchaseFilters from "../../../components/purchase-filters";
import {
  approveSponsorPurchase,
  changePurchasePaymentMethod,
  downloadSponsorInvoice,
  getSponsorPurchases,
  rejectSponsorPurchase
} from "../../../../../actions/sponsor-purchases-actions";
import {
  DEFAULT_CURRENT_PAGE,
  PURCHASE_STATUS
} from "../../../../../utils/constants";

const SponsorPurchasesTab = ({
  sponsor,
  purchases,
  term,
  filters,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCount,
  getSponsorPurchases,
  downloadSponsorInvoice,
  approveSponsorPurchase,
  rejectSponsorPurchase,
  changePurchasePaymentMethod,
  getSponsorCart
}) => {
  useEffect(() => {
    getSponsorPurchases(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters
    );
  }, [sponsor?.id]);

  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handlePageChange = (page) => {
    getSponsorPurchases(term, page, perPage, order, orderDir, filters);
  };

  const handleSort = (key, dir) => {
    getSponsorPurchases(term, currentPage, perPage, key, dir, filters);
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorPurchases(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      filters
    );
  };

  const handleSearch = (searchTerm) => {
    getSponsorPurchases(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters
    );
  };

  const handleFilterChange = (newFilters) => {
    getSponsorPurchases(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      newFilters
    );
  };

  const handleDetails = (item) => {
    history.push(`purchases/${item.id}`);
  };

  const handleInvoiceDownload = (item) => {
    if (downloadingOrderId !== null) return;
    setDownloadingOrderId(item.id);
    downloadSponsorInvoice(item.id, sponsor.id).finally(() =>
      setDownloadingOrderId(null)
    );
  };

  const handleStatusChange = (purchaseId, newStatus) => {
    if (newStatus === PURCHASE_STATUS.PAID)
      approveSponsorPurchase(sponsor.id, purchaseId);
    if (newStatus === PURCHASE_STATUS.CANCELLED)
      rejectSponsorPurchase(sponsor.id, purchaseId);
  };

  const handlePayByCard = (purchase) => {
    changePurchasePaymentMethod(sponsor.id, purchase.id)
      // PaymentView uses the cart in state, which can be missing, another sponsor's or outdated
      .then(() => getSponsorCart("", sponsor.id))
      // getSponsorCart swallows errors and resolves without a response on failure
      .then((res) => {
        if (res?.response) history.push("cart/payment");
      })
      .catch(() => {}); // error already shown by snackbarErrorHandler
  };

  const tableColumns = [
    {
      columnKey: "number",
      header: T.translate("edit_sponsor.purchase_tab.order"),
      sortable: true
    },
    {
      columnKey: "purchased",
      header: T.translate("edit_sponsor.purchase_tab.purchased"),
      sortable: true
    },
    {
      columnKey: "payment_method",
      header: T.translate("edit_sponsor.purchase_tab.payment_method"),
      sortable: true
    },
    {
      columnKey: "status",
      header: T.translate("edit_sponsor.purchase_tab.status"),
      sortable: true,
      render: (row) => (
        <PurchaseStatusCell
          purchase={row}
          onStatusChange={(newStatus) =>
            handleStatusChange(row.payment_id, newStatus)
          }
          onPayByCard={() => handlePayByCard(row)}
        />
      )
    },
    {
      columnKey: "amount",
      header: T.translate("edit_sponsor.purchase_tab.amount"),
      sortable: true
    },
    {
      columnKey: "details",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          sx={{ color: "primary.main" }}
          size="small"
          onClick={() => handleDetails(row)}
        >
          {T.translate("edit_sponsor.purchase_tab.details")}
        </Button>
      )
    },
    {
      columnKey: "menu",
      header: "",
      width: 100,
      align: "center",
      render: (row) =>
        downloadingOrderId === row.id ? (
          <CircularProgress size={24} />
        ) : (
          <IconButton
            size="large"
            sx={{ color: "primary.main" }}
            onClick={() => handleInvoiceDownload(row)}
            aria-label={T.translate("general.download_invoice")}
            disabled={downloadingOrderId !== null}
          >
            <DownloadIcon fontSize="large" />
          </IconButton>
        )
    }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalCount} {T.translate("edit_sponsor.purchase_tab.purchases")}
          </Box>
        </Grid2>
        <Grid2 size={6} offset={2}>
          <PurchaseFilters filters={filters} onChange={handleFilterChange} />
        </Grid2>
        <Grid2 size={2}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("edit_sponsor.placeholders.search")}
          />
        </Grid2>
      </Grid2>
      <div>
        <MuiTable
          columns={tableColumns}
          data={purchases}
          options={{ sortCol: order, sortDir: orderDir }}
          perPage={perPage}
          totalRows={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
        />
      </div>
    </Box>
  );
};

const mapStateToProps = ({
  sponsorPagePurchaseListState,
  currentSponsorState
}) => ({
  ...sponsorPagePurchaseListState,
  sponsor: currentSponsorState.entity
});

export default connect(mapStateToProps, {
  getSponsorPurchases,
  downloadSponsorInvoice,
  approveSponsorPurchase,
  rejectSponsorPurchase,
  changePurchasePaymentMethod,
  getSponsorCart
})(SponsorPurchasesTab);
