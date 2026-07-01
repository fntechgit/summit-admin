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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import {
  Box,
  Button,
  Grid2,
  IconButton,
  MenuItem,
  Select
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import history from "../../../history";
import {
  approveSponsorPurchase,
  exportAllSponsorPurchases,
  getAllSponsorPurchases,
  rejectSponsorPurchase
} from "../../../actions/sponsor-purchases-actions";
import {
  DEFAULT_CURRENT_PAGE,
  PURCHASE_METHODS,
  PURCHASE_STATUS
} from "../../../utils/constants";

const ShowPurchaseListPage = ({
  match,
  purchases,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCount,
  getAllSponsorPurchases,
  exportAllSponsorPurchases,
  approveSponsorPurchase,
  rejectSponsorPurchase
}) => {
  useEffect(() => {
    getAllSponsorPurchases();
  }, []);

  const handlePageChange = (page) => {
    getAllSponsorPurchases(term, page, perPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getAllSponsorPurchases(term, currentPage, perPage, key, dir);
  };

  const handlePerPageChange = (newPerPage) => {
    getAllSponsorPurchases(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleExport = () => {
    exportAllSponsorPurchases(term, order, orderDir);
  };

  const handleSearch = (searchTerm) => {
    getAllSponsorPurchases(searchTerm);
  };

  const handleDetails = (item) => {
    history.push(`${item.sponsor_id}/purchases/${item.id}`);
  };

  const handleMenu = (item) => {
    console.log("MENU : ", item);
  };

  const handleStatusChange = (sponsorId, purchaseId, newStatus) => {
    if (newStatus === PURCHASE_STATUS.PAID)
      approveSponsorPurchase(sponsorId, purchaseId);
    if (newStatus === PURCHASE_STATUS.CANCELLED)
      rejectSponsorPurchase(sponsorId, purchaseId);
  };

  const tableColumns = [
    {
      columnKey: "number",
      header: T.translate("sponsor_show_purchases.order"),
      sortable: true
    },
    {
      columnKey: "purchased",
      header: T.translate("sponsor_show_purchases.purchased"),
      width: 200,
      sortable: true
    },
    {
      columnKey: "sponsor_name",
      header: T.translate("sponsor_show_purchases.sponsor"),
      sortable: true
    },
    {
      columnKey: "payment_method",
      header: T.translate("sponsor_show_purchases.payment_method"),
      sortable: true
    },
    {
      columnKey: "status",
      header: T.translate("sponsor_show_purchases.status"),
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
                handleStatusChange(
                  row.sponsor_id,
                  row.payment_id,
                  ev.target.value
                )
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
      header: T.translate("sponsor_show_purchases.amount"),
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
          {T.translate("sponsor_show_purchases.details")}
        </Button>
      )
    },
    {
      columnKey: "menu",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <IconButton
          size="large"
          sx={{ color: "primary.main" }}
          onClick={() => handleMenu(row)}
        >
          <DownloadIcon fontSize="large" />
        </IconButton>
      )
    }
  ];

  return (
    <div className="container">
      <div>
        <Breadcrumb
          data={{
            title: T.translate("sponsor_show_purchases.purchases"),
            pathname: match.url
          }}
        />
      </div>
      <h3>{T.translate("sponsor_show_purchases.purchases")}</h3>
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
            {totalCount}{" "}
            {T.translate("sponsor_show_purchases.purchases").toLowerCase()}
          </Box>
        </Grid2>
        <Grid2 size={2} offset={6}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("general.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={2}>
          <Button variant="contained" onClick={handleExport}>
            {T.translate("general.export")}
          </Button>
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
    </div>
  );
};

const mapStateToProps = ({ showPurchaseListState }) => ({
  ...showPurchaseListState
});

export default connect(mapStateToProps, {
  getAllSponsorPurchases,
  exportAllSponsorPurchases,
  approveSponsorPurchase,
  rejectSponsorPurchase
})(ShowPurchaseListPage);
