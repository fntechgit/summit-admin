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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { formatEpoch } from "openstack-uicore-foundation/lib/utils/methods";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import GridToolbar from "../../components/mui/grid-toolbar";
import {
  clearCurrentSummit,
  deleteSummit,
  loadSummits
} from "../../actions/summit-actions";
import Member from "../../models/member";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import { countLabel } from "../../utils/methods";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [hidePastEvents, setHidePastEvents] = useState(false);
  const safeSummits = Array.isArray(summits) ? summits : [];
  const safeMember =
    member && typeof member === "object"
      ? { ...member, groups: Array.isArray(member.groups) ? member.groups : [] }
      : { groups: [] };
  useEffect(() => {
    clearCurrentSummit();
    loadSummits(DEFAULT_CURRENT_PAGE, perPage, searchTerm, hidePastEvents);
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

  const handlePageChange = (page) => {
    loadSummits(page, perPage, searchTerm, hidePastEvents);
  };

  const handlePerPageChange = (newPerPage) => {
    loadSummits(DEFAULT_CURRENT_PAGE, newPerPage, searchTerm, hidePastEvents);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadSummits(DEFAULT_CURRENT_PAGE, perPage, value, hidePastEvents);
  };

  const handleHidePastEventsChange = (ev) => {
    const { checked } = ev.target;
    setHidePastEvents(checked);
    loadSummits(DEFAULT_CURRENT_PAGE, perPage, searchTerm, checked);
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
      header: T.translate("directory.id")
    },
    {
      columnKey: "name",
      header: T.translate("directory.summit_name"),
      render: (row) => (
        <>
          <div>{row.name}</div>
          {!!row.invite_only_registration && (
            <Chip
              size="small"
              sx={{ mt: "4px" }}
              label={T.translate("directory.invitation_only")}
            />
          )}
        </>
      )
    },
    {
      columnKey: "sponsor_qty",
      header: T.translate("directory.sponsors"),
      render: (row) => row.sponsor_qty ?? 0
    },
    {
      columnKey: "sponsor_forms_qty",
      header: T.translate("directory.forms"),
      render: (row) => row.sponsor_forms_qty ?? 0
    },
    {
      columnKey: "sponsor_attachments_qty",
      header: T.translate("directory.attachments"),
      render: (row) => row.sponsor_attachments_qty ?? 0
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
    }
  ];

  return (
    <Box className="container">
      <h3>{T.translate("directory.summits")}</h3>
      <GridToolbar
        searchProps={{
          term: searchTerm,
          onSearch: handleSearch,
          placeholder: T.translate("directory.placeholders.search")
        }}
        checkboxProps={{
          checked: hidePastEvents,
          onChange: handleHidePastEventsChange,
          label: T.translate("directory.hide_past_events")
        }}
      >
        {canAddSummits && (
          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<AddIcon />}
            onClick={handleNewSummit}
          >
            {T.translate("directory.add_summit")}
          </Button>
        )}
      </GridToolbar>
      <Box sx={{ mb: 2 }}>{countLabel("directory.summit", totalSummits)}</Box>
      <MuiTable
        columns={columns}
        data={safeSummits}
        totalRows={totalSummits}
        perPage={perPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        onEdit={canEditSummit ? handleEditSummit : undefined}
        onDelete={canDeleteSummits ? (id) => deleteSummit(id) : undefined}
        onSelect={handleSelectSummit}
        deleteDialogBody={(name) =>
          `${T.translate("directory.remove_warning")} ${name}`
        }
      />
    </Box>
  );
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
