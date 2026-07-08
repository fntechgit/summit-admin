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

import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  deleteSponsorUser,
  deleteSponsorUserRequest,
  getSponsorUserRequests,
  getSponsorUsers,
  trackImportSponsorUsers
} from "../../../actions/sponsor-users-actions";
import { TEN_SECONDS_IN_MILLISECONDS } from "../../../utils/constants";
import RequestTable from "./components/request-table";
import UsersTable from "./components/users-table";
import EditUserPopup from "./components/edit-user-popup";
import SponsorGlobalNewUserPopup from "./components/sponsor-global-new-user-popup";
import SponsorGlobalImportUsersPopup from "./components/sponsor-global-import-users-popup";

const SponsorUsersListPage = ({
  summitId,
  match,
  requests,
  users,
  term,
  importTasks,
  getSponsorUserRequests,
  getSponsorUsers,
  deleteSponsorUserRequest,
  deleteSponsorUser,
  trackImportSponsorUsers
}) => {
  const [openPopup, setOpenPopup] = useState(null);
  const [userEdit, setUserEdit] = useState(null);
  const importIntervalRef = useRef(null);
  const hasImportTasks = !!importTasks?.length;

  useEffect(() => {
    getSponsorUserRequests();
    getSponsorUsers();
  }, []);

  useEffect(() => {
    if (hasImportTasks && !importIntervalRef.current) {
      importIntervalRef.current = setInterval(
        () => trackImportSponsorUsers(),
        TEN_SECONDS_IN_MILLISECONDS
      );
    } else if (!hasImportTasks && importIntervalRef.current) {
      clearInterval(importIntervalRef.current);
      importIntervalRef.current = null;
    }
    return () => {
      clearInterval(importIntervalRef.current);
      importIntervalRef.current = null;
    };
  }, [hasImportTasks]);

  const handleSearch = (searchTerm) => {
    getSponsorUserRequests(null, searchTerm);
    getSponsorUsers(null, searchTerm);
  };

  const handleUserEdit = (user) => {
    setUserEdit(user);
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
          <Grid2 size={3}>
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

      <UsersTable
        users={users}
        term={term}
        getUsers={getSponsorUsers}
        deleteSponsorUser={deleteSponsorUser}
        onEdit={handleUserEdit}
      />

      {openPopup === "new" && (
        <SponsorGlobalNewUserPopup
          summitId={summitId}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {openPopup === "import" && (
        <SponsorGlobalImportUsersPopup
          summitId={summitId}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {userEdit && (
        <EditUserPopup user={userEdit} onClose={() => setUserEdit(null)} />
      )}
    </div>
  );
};

const mapStateToProps = ({ sponsorUsersListState, currentSummitState }) => ({
  ...sponsorUsersListState,
  summitId: currentSummitState.currentSummit.id
});

export default connect(mapStateToProps, {
  getSponsorUserRequests,
  getSponsorUsers,
  deleteSponsorUserRequest,
  deleteSponsorUser,
  trackImportSponsorUsers
})(SponsorUsersListPage);
