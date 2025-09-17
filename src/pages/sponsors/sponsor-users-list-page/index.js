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
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import {
  getSponsorUserRequests,
  getSponsorUsers,
  deleteSponsorUserRequest
} from "../../../actions/sponsor-users-actions";
import SearchInput from "../../../components/mui/search-input";
import RequestTable from "./components/request-table";
import UsersTable from "./components/users-table";

const SponsorUsersListPage = ({
  match,
  requests,
  users,
  term,
  getSponsorUserRequests,
  getSponsorUsers,
                                deleteSponsorUserRequest
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorUserRequests();
    getSponsorUsers();
  }, []);

  const handleSearch = (searchTerm) => {
    getSponsorUserRequests(searchTerm);
    getSponsorUsers(searchTerm);
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

      <RequestTable
        requests={requests}
        term={term}
        getRequests={getSponsorUserRequests}
        onRequestDelete={deleteSponsorUserRequest}
      />

      <Box component="div" sx={{ mb: 2 }}>
        {users.totalCount} {T.translate("sponsor_users.users").toLowerCase()}
      </Box>

      <UsersTable users={users} term={term} getUsers={getSponsorUsers} />
    </div>
  );
};

const mapStateToProps = ({ sponsorUsersListState }) => ({
  ...sponsorUsersListState
});

export default connect(mapStateToProps, {
  getSponsorUserRequests,
  getSponsorUsers,
  deleteSponsorUserRequest
})(SponsorUsersListPage);
