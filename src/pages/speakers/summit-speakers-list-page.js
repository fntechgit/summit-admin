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
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { getSpeakers, deleteSpeaker } from "../../actions/speaker-actions";
import Member from "../../models/member";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const SummitSpeakerListPage = ({
  member,
  speakers,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalSpeakers,
  getSpeakers,
  deleteSpeaker,
  history
}) => {
  useEffect(() => {
    getSpeakers();
  }, []);

  const memberObj = new Member(member);

  const handleEdit = (speaker) => {
    history.push(`/app/speakers/${speaker.id}`);
  };

  const handleDelete = (speakerId) => {
    deleteSpeaker(speakerId).then(() =>
      getSpeakers(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const handlePageChange = (page) => {
    getSpeakers(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getSpeakers(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    const keySort = key === "name" ? "last_name" : key;
    getSpeakers(term, currentPage, perPage, keySort, dir);
  };

  const handleSearch = (searchTerm) => {
    getSpeakers(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleNewSpeaker = () => {
    history.push("/app/speakers/new");
  };

  const columns = [
    { columnKey: "id", header: T.translate("general.id"), sortable: true },
    { columnKey: "name", header: T.translate("general.name"), sortable: true },
    {
      columnKey: "email",
      header: T.translate("general.email"),
      sortable: true
    },
    { columnKey: "member_id", header: T.translate("speaker_list.member_id") }
  ];

  const table_options = {
    sortCol: order === "last_name" ? "name" : order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3>{T.translate("speaker_list.speaker_list")}</h3>
      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalSpeakers} {T.translate("speaker_list.speakers")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <SearchInput
              term={term}
              onSearch={handleSearch}
              placeholder={T.translate("general.placeholders.search_speakers")}
            />
          </Grid2>
          {memberObj.canAddSpeakers() && (
            <Button
              variant="contained"
              onClick={handleNewSpeaker}
              startIcon={<AddIcon />}
              sx={{
                height: "36px",
                padding: "6px 16px",
                fontSize: "1.4rem",
                lineHeight: "2.4rem",
                letterSpacing: "0.4px"
              }}
            >
              {T.translate("speaker_list.add_speaker")}
            </Button>
          )}
        </Grid2>
      </Grid2>

      {speakers.length > 0 && (
        <MuiTable
          columns={columns}
          data={speakers}
          options={table_options}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalSpeakers}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onDelete={memberObj.canDeleteSpeakers() ? handleDelete : null}
          onEdit={memberObj.canEditSpeakers() ? handleEdit : null}
          deleteDialogBody={(name) =>
            T.translate("speaker_list.delete_speaker_warning", { name })
          }
        />
      )}

      {speakers.length === 0 && (
        <div>{T.translate("speaker_list.no_results")}</div>
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSpeakerListState, loggedUserState }) => ({
  ...currentSpeakerListState,
  member: loggedUserState.member
});

export default connect(mapStateToProps, {
  getSpeakers,
  deleteSpeaker
})(SummitSpeakerListPage);
