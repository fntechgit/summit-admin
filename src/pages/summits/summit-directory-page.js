/**
 * Copyright 2017 OpenStack Foundation
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
import { formatEpoch } from "openstack-uicore-foundation/lib/utils/methods";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { Button, Box, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  loadSummits,
  clearCurrentSummit,
  deleteSummit
} from "../../actions/summit-actions";
import Member from "../../models/member";

const SummitDirectoryPage = ({
  summits,
  member,
  currentPage,
  perPage,
  totalSummits,
  loadSummits,
  clearCurrentSummit,
  deleteSummit,
  history
}) => {
  const safeSummits = Array.isArray(summits) ? summits : [];
  const safeMember =
    member && typeof member === "object"
      ? { ...member, groups: Array.isArray(member.groups) ? member.groups : [] }
      : { groups: [] };
  useEffect(() => {
    clearCurrentSummit();
    loadSummits();
  }, []);

  let memberObj;
  try {
    memberObj = new Member(safeMember);
  } catch (e) {
    memberObj = {
      canEditSummit: () => false,
      canAddSummits: () => false,
      canDeleteSummits: () => false
    };
  }
  const canEditSummit =
    typeof memberObj.canEditSummit === "function"
      ? memberObj.canEditSummit()
      : false;
  const canAddSummits =
    typeof memberObj.canAddSummits === "function"
      ? memberObj.canAddSummits()
      : false;
  const canDeleteSummits =
    typeof memberObj.canDeleteSummits === "function"
      ? memberObj.canDeleteSummits()
      : false;

  try {
    const handlePageChange = (page) => {
      loadSummits(page, perPage);
    };

    const handleNewSummit = () => {
      history.push("/app/summits/new");
    };

    const handleEditSummit = (summit) => {
      history.push(`/app/summits/${summit.id}`);
    };

    const handleSelectSummit = (summit) => {
      history.push(`/app/summits/${summit.id}/dashboard`);
    };

    const columns = [
      {
        columnKey: "id",
        header: T.translate("directory.id"),
        width: 80
      },
      {
        columnKey: "name",
        header: T.translate("directory.summit_name")
      },
      {
        columnKey: "start_date",
        header: T.translate("directory.start_date"),
        render: (row) => formatEpoch(row.start_date, "MMMM Do YYYY")
      },
      {
        columnKey: "end_date",
        header: T.translate("directory.end_date"),
        render: (row) => formatEpoch(row.end_date, "MMMM Do YYYY")
      },
      {
        columnKey: "invite_only_registration",
        header: T.translate("directory.invitation_only"),
        width: 120,
        render: (row) =>
          row.invite_only_registration ? (
            <span style={{ color: "#b26a00", fontWeight: 500 }}>
              {T.translate("directory.invitation_only")}
            </span>
          ) : null
      }
    ];

    return (
      <Box className="container">
        <h3>{T.translate("directory.summits")}</h3>
        <Grid2
          container
          sx={{
            mb: 2,
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap"
          }}
        >
          <Box component="span" sx={{ minWidth: 120 }}>
            {totalSummits} {T.translate("general.items")}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {canAddSummits && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleNewSummit}
                sx={{
                  height: "36px",
                  padding: "6px 16px",
                  fontSize: "1.4rem",
                  lineHeight: "2.4rem",
                  letterSpacing: "0.4px"
                }}
              >
                {T.translate("directory.add_summit")}
              </Button>
            )}
          </Box>
        </Grid2>
        <MuiTable
          columns={columns}
          data={safeSummits}
          totalRows={totalSummits}
          perPage={perPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onEdit={canEditSummit ? handleEditSummit : undefined}
          onDelete={canDeleteSummits ? (id) => deleteSummit(id) : undefined}
          onSelect={handleSelectSummit}
          getName={(row) => row.name}
          deleteDialogTitle={T.translate("general.are_you_sure")}
          deleteDialogBody={(name) =>
            `${T.translate("directory.remove_warning")} ${name}`
          }
          deleteDialogConfirmText={T.translate("general.yes_delete")}
          confirmButtonColor="error"
        />
      </Box>
    );
  } catch (err) {
    return (
      <div
        className="container"
        style={{
          background: "#fff",
          borderRadius: 4,
          padding: 32,
          color: "red"
        }}
      >
        <h3>{T.translate("directory.error_loading")}</h3>
        <pre>{err.message}</pre>
      </div>
    );
  }
};

const mapStateToProps = ({ directoryState, loggedUserState }) => ({
  ...directoryState,
  member: loggedUserState.member
});

export default connect(mapStateToProps, {
  loadSummits,
  clearCurrentSummit,
  deleteSummit
})(SummitDirectoryPage);
