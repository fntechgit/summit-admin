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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Grid2,
  IconButton,
  MenuItem,
  Select
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { getSponsorPurchases } from "../../../actions/sponsor-purchases-actions";
import SearchInput from "../../../components/mui/search-input";
import MuiTable from "../../../components/mui/table/mui-table";
import {
  DEFAULT_CURRENT_PAGE,
  PURCHASE_STATUS
} from "../../../utils/constants";

const SponsorPurchasesTab = ({
  purchases,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCount,
  getSponsorPurchases
}) => {
  useEffect(() => {
    getSponsorPurchases();
  }, []);

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
    console.log("DETAILS : ", item);
  };

  const handleMenu = (item) => {
    console.log("MENU : ", item);
  };

  const handleStatusChange = (stat) => {
    console.log("STATUS : ", stat);
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
        if (row.status === PURCHASE_STATUS.PENDING) {
          return (
            <Select
              fullWidth
              variant="outlined"
              value={row.status}
              onChange={(ev) => handleStatusChange(ev.target.value)}
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
          color="inherit"
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
      render: (row) => (
        <IconButton size="large" onClick={() => handleMenu(row)}>
          <MenuIcon fontSize="large" />
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
        <Grid2 size={2} offset={8}>
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

const mapStateToProps = ({ sponsorPagePurchaseListState }) => ({
  ...sponsorPagePurchaseListState
});

export default connect(mapStateToProps, {
  getSponsorPurchases
})(SponsorPurchasesTab);
