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
import { Box, Button, Grid2, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import {
  getSponsorUserRequests,
  getSponsorUsers
} from "../../../actions/sponsor-users-actions";
import SearchInput from "../../../components/mui/search-input";
import UsersTable from "../sponsor-users-list-page/components/users-table";
import CustomAlert from "../../../components/mui/custom-alert";
import ChipNotify from "../../../components/mui/chip-notify";

const SponsorUsersListPerSponsorPage = ({
  sponsor,
  requests,
  users,
  term,
  getSponsorUserRequests,
  getSponsorUsers
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorUserRequests(sponsor.id);
    getSponsorUsers(sponsor.id);
  }, []);

  const handleSearch = (searchTerm) => {
    getSponsorUsers(sponsor.id, searchTerm);
  };

  return (
    <div className="container">
      {requests.totalCount > 0 &&
      <ChipNotify
        label={`${requests.totalCount} ${T.translate("sponsor_users.access_request")}`}
        sx={{position: "absolute", top: "8px", right: "5px"}}
      />
      }
      <CustomAlert message={T.translate("sponsor_users.alert_info")} />
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
            {users.totalCount} {T.translate("sponsor_users.users").toLowerCase()}
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

      <UsersTable users={users} term={term} getUsers={getSponsorUsers} />
    </div>
  );
};

const mapStateToProps = ({ sponsorUsersListState }) => ({
  ...sponsorUsersListState
});

export default connect(mapStateToProps, {
  getSponsorUserRequests,
  getSponsorUsers
})(SponsorUsersListPerSponsorPage);
