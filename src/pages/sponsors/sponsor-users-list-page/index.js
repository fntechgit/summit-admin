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
import { Breadcrumb } from "react-breadcrumbs";
import { Box, Button, Grid2, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import {
  getSponsorUserRequests,
  getSponsorUsers
} from "../../../actions/sponsor-users-actions";
import SearchInput from "../../../components/mui/components/search-input";
import MuiTable from "../../../components/mui/table/mui-table";
import ChipList from "../../../components/mui/components/chip-list";

const SponsorUsersListPage = ({
  match,
  requests,
  users,
  term,
  getSponsorUserRequests,
  getSponsorUsers
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorUserRequests();
    getSponsorUsers();
  }, []);

  const handleRequestsPageChange = (page) => {
    const { perPage, order, orderDir } = requests;
    getSponsorUserRequests(term, page, perPage, order, orderDir);
  };

  const handleUsersPageChange = (page) => {
    const { perPage, order, orderDir } = users;
    getSponsorUsers(term, page, perPage, order, orderDir);
  };

  const handleRequestsSort = (key, dir) => {
    const { currentPage, perPage } = requests;
    getSponsorUserRequests(term, currentPage, perPage, key, dir);
  };

  const handleUsersSort = (key, dir) => {
    const { currentPage, perPage } = users;
    getSponsorUsers(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getSponsorUserRequests(searchTerm);
    getSponsorUsers(searchTerm);
  };

  const handleProcessRequest = (row) => {
    console.log("PROCESS REQUEST", row);
  };

  const handleRequestDelete = (itemId) => {
    console.log("DELETE", itemId);
  };

  const handleUserDelete = (itemId) => {
    console.log("DELETE", itemId);
  };

  const handleUserEdit = (itemId) => {
    console.log("DELETE", itemId);
  };

  const handleSendEmail = (item) => {
    console.log("SEND EMAIL", item);
  };

  const requestsColumns = [
    {
      columnKey: "requester_first_name",
      header: T.translate("sponsor_users.name"),
      sortable: true
    },
    {
      columnKey: "requester_email",
      header: T.translate("sponsor_users.email"),
      sortable: true
    },
    {
      columnKey: "company_name",
      header: T.translate("sponsor_users.sponsor"),
      sortable: true
    },
    {
      columnKey: "created",
      header: T.translate("sponsor_users.request_time"),
      sortable: true
    },
    {
      columnKey: "process",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <IconButton size="large" onClick={() => handleProcessRequest(row)}>
          <ArrowForwardIcon fontSize="large" />
        </IconButton>
      ),
      dottedBorder: true
    }
  ];

  const requestsTableOptions = {
    sortCol: requests.order,
    sortDir: requests.orderDir
  };

  const usersColumns = [
    {
      columnKey: "first_name",
      header: T.translate("sponsor_users.name"),
      sortable: true
    },
    {
      columnKey: "email",
      header: T.translate("sponsor_users.email"),
      sortable: true
    },
    {
      columnKey: "company_name",
      header: T.translate("sponsor_users.sponsor"),
      sortable: true
    },
    {
      columnKey: "access_rights",
      header: T.translate("sponsor_users.access"),
      sortable: false,
      render: (row) => <ChipList chips={row.access_rights} maxLength={2} />
    },
    {
      columnKey: "active",
      header: T.translate("sponsor_users.active"),
      sortable: false
    },
    {
      columnKey: "send_email",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <IconButton size="large" onClick={() => handleSendEmail(row)}>
          <MailOutlineIcon fontSize="large" />
        </IconButton>
      ),
      dottedBorder: true
    }
  ];

  const usersTableOptions = {
    sortCol: users.order,
    sortDir: users.orderDir
  };

  return (
    <div className="container">
      <Breadcrumb
        data={{
          title: T.translate("sponsor_users.users"),
          pathname: match.url
        }}
      />
      <h3>{T.translate("sponsor_users.users")}</h3>
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
            {requests.totalCount} {T.translate("sponsor_users.access_request")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <SearchInput term={term} onSearch={handleSearch} />
          </Grid2>
          <Button
            variant="contained"
            size="medium"
            onClick={() => setOpenPopup("import")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_users.import_user")}
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={() => setOpenPopup("new")}
            startIcon={<SaveAltIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_users.add_user")}
          </Button>
        </Grid2>
      </Grid2>

      {requests.items.length > 0 && (
        <div>
          <MuiTable
            columns={requestsColumns}
            data={requests.items}
            options={requestsTableOptions}
            perPage={requests.perPage}
            totalRows={requests.totalCount}
            currentPage={requests.currentPage}
            onDelete={handleRequestDelete}
            onPageChange={handleRequestsPageChange}
            onSort={handleRequestsSort}
          />
        </div>
      )}

      <Box component="div" sx={{mb: 2}}>
        {users.totalCount} {T.translate("sponsor_users.users").toLowerCase()}
      </Box>

      {users.items.length > 0 && (
        <div>
          <MuiTable
            columns={usersColumns}
            data={users.items}
            options={usersTableOptions}
            perPage={users.perPage}
            totalRows={users.totalCount}
            currentPage={users.currentPage}
            onDelete={handleUserDelete}
            onEdit={handleUserEdit}
            onPageChange={handleUsersPageChange}
            onSort={handleUsersSort}
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
  getSponsorUserRequests,
  getSponsorUsers
})(SponsorUsersListPage);
