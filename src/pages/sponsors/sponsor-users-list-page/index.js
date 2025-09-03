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
  Grid2, IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  getSponsorUserRequests
} from "../../../actions/sponsor-users-actions";
import CustomAlert from "../../../components/mui/components/custom-alert";
import SearchInput from "../../../components/mui/components/search-input";
import MuiTable from "../../../components/mui/table/mui-table";

const SponsorUsersListPage = ({
  requests,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalCount,
  getSponsorUserRequests
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorUserRequests();
  }, []);

  const handlePageChange = (page) => {
    getSponsorUserRequests(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    getSponsorUserRequests(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getSponsorUserRequests(searchTerm, currentPage, perPage, order, orderDir);
  };

  const handleProcessRequest = (row) => {
    console.log("PROCESS REQUEST", row);
  };

  const handleRowDelete = (itemId) => {
    console.log("DELETE", itemId);
  };

  const columns = [
    {
      columnKey: "name",
      header: T.translate("sponsor_users.name"),
      sortable: true
    },
    {
      columnKey: "email",
      header: T.translate("sponsor_users.email"),
      sortable: true
    },
    {
      columnKey: "sponsor",
      header: T.translate("sponsor_users.sponsor"),
      sortable: false
    },
    {
      columnKey: "request_time",
      header: T.translate("sponsor_users.request_time"),
      sortable: false
    },
    {
      columnKey: "process",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <IconButton
          size="large"
          onClick={() => handleProcessRequest(row)}
        >
          <ArrowForwardIcon fontSize="large" />
        </IconButton>
      ),
      dottedBorder: true
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3>
        {T.translate("sponsor_users.forms")} ({totalCount})
      </h3>
      <CustomAlert message={T.translate("sponsor_users.alert_info")} hideIcon />
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
        <Grid2 size={2} offset={3}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("sponsor_users.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("import")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_users.import_user")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("new")}
            startIcon={<SaveAltIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_users.add_user")}
          </Button>
        </Grid2>
      </Grid2>

      {requests.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={requests}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onDelete={handleRowDelete}
            onPageChange={handlePageChange}
            onSort={handleSort}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({ sponsorUsersListState }) => ({
  ...sponsorUsersListState
});

export default connect(mapStateToProps, {
  getSponsorUserRequests
})(SponsorUsersListPage);
