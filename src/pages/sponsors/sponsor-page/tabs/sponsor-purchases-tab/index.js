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
  IconButton,
  MenuItem,
  Select
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import history from "../../../../../history";
import {
  approveSponsorPurchase,
  downloadSponsorInvoice,
  getSponsorPurchases,
  rejectSponsorPurchase
} from "../../../../../actions/sponsor-purchases-actions";
import {
  DEFAULT_CURRENT_PAGE,
  PURCHASE_METHODS,
  PURCHASE_STATUS
} from "../../../../../utils/constants";

const SponsorPurchasesTab = ({
  sponsor,
  purchases,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCount,
  getSponsorPurchases,
  downloadSponsorInvoice,
  approveSponsorPurchase,
  rejectSponsorPurchase
}) => {
  useEffect(() => {
    getSponsorPurchases();
  }, [sponsor?.id]);

  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handlePageChange = (page) => {
    getSponsorPurchases(term, page, perPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getSponsorPurchases(term, currentPage, perPage, key, dir);
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorPurchases(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleSearch = (searchTerm) => {
    getSponsorPurchases(searchTerm);
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
      render: (row) => {
        if (
          row.payment_method === PURCHASE_METHODS.INVOICE &&
          row.status === PURCHASE_STATUS.PENDING
        ) {
          return (
            <Select
              fullWidth
              variant="outlined"
              value={row.status}
              onChange={(ev) =>
                handleStatusChange(row.payment_id, ev.target.value)
              }
            >
              {Object.values(PURCHASE_STATUS).map((s) => (
                <MenuItem key={`purchase-status-${s}`} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          );
        }

        return row.status;
      }
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
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }} offset={{ md: 9 }}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("edit_sponsor.placeholders.search")}
          />
        </Grid2>
      </Grid2>
      <Box sx={{ mb: 2 }}>
        {totalCount} {T.translate("edit_sponsor.purchase_tab.purchases")}
      </Box>
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
  rejectSponsorPurchase
})(SponsorPurchasesTab);
