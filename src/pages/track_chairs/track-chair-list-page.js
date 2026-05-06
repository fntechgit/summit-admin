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
import {
  Box,
  Button,
  FormControl,
  Grid2,
  IconButton,
  InputAdornment,
  MenuItem,
  Select
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  getTrackChairs,
  deleteTrackChair,
  saveTrackChair,
  addTrackChair,
  exportTrackChairs
} from "../../actions/track-chair-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import TrackChairDialog from "./components/track-chair-dialog";

const TrackChairListPage = ({
  currentSummit,
  trackChairs,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalTrackChairs,
  trackId,
  getTrackChairs,
  deleteTrackChair,
  saveTrackChair,
  addTrackChair,
  exportTrackChairs
}) => {
  const [dialogEntity, setDialogEntity] = useState(null);

  useEffect(() => {
    if (currentSummit) getTrackChairs();
  }, []);

  const chairTracks = currentSummit.tracks.filter((t) => t.chair_visible);

  const handleSearch = (searchTerm) => {
    getTrackChairs(
      trackId,
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
  };

  const handleFilterByTrack = (ev) => {
    getTrackChairs(
      ev.target.value,
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
  };

  const handleSort = (key, dir) => {
    getTrackChairs(trackId, term, currentPage, perPage, key, dir);
  };

  const handlePageChange = (page) => {
    getTrackChairs(trackId, term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getTrackChairs(
      trackId,
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleNewTrackChair = () => {
    setDialogEntity({});
  };

  const handleEdit = (trackChair) => {
    setDialogEntity({
      id: trackChair.id,
      member: trackChair.member,
      originalMemberId: trackChair.member.id,
      trackIds: trackChair.categories.map((c) => c.id)
    });
  };

  const handleDelete = (trackChairId) => {
    deleteTrackChair(trackChairId);
  };

  const handleSave = ({ id, member, trackIds }) => {
    const newMember = dialogEntity?.originalMemberId !== member?.value;
    const action =
      !id || newMember
        ? addTrackChair({ id: member.value }, trackIds)
        : saveTrackChair(id, trackIds);
    action.then(() => setDialogEntity(null));
  };

  const handleClose = () => {
    setDialogEntity(null);
  };

  const columns = [
    {
      columnKey: "name",
      header: T.translate("track_chairs.name"),
      sortable: true
    },
    { columnKey: "trackNames", header: T.translate("track_chairs.track") }
  ];

  const table_options = { sortCol: order, sortDir: orderDir };

  const tracks_ddl = chairTracks.map((t) => ({ label: t.name, value: t.id }));

  const buttonSx = {
    height: "36px",
    padding: "6px 16px",
    fontSize: "1.4rem",
    lineHeight: "2.4rem",
    letterSpacing: "0.4px"
  };

  if (!currentSummit?.id) return <div />;

  return (
    <div className="container">
      <h3>{T.translate("track_chairs.list")}</h3>
      <Grid2
        container
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalTrackChairs} {T.translate("track_chairs.track_chairs")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          <Grid2 size={3}>
            <SearchInput
              term={term}
              placeholder={T.translate("track_chairs.placeholders.search")}
              onSearch={handleSearch}
            />
          </Grid2>
          <Grid2 size={3}>
            <FormControl
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { height: "36px" } }}
            >
              <Select
                size="small"
                value={trackId ?? ""}
                onChange={handleFilterByTrack}
                displayEmpty
                renderValue={(selected) =>
                  selected ? (
                    tracks_ddl.find((t) => t.value === selected)?.label
                  ) : (
                    <span style={{ color: "#aaa" }}>
                      {T.translate("track_chairs.placeholders.select_track")}
                    </span>
                  )
                }
                endAdornment={
                  trackId ? (
                    <InputAdornment position="end" sx={{ mr: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          getTrackChairs(
                            null,
                            term,
                            DEFAULT_CURRENT_PAGE,
                            perPage,
                            order,
                            orderDir
                          )
                        }
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              >
                {tracks_ddl.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>
          <Grid2
            size="auto"
            gap={1}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center"
            }}
          >
            <Button
              variant="outlined"
              onClick={() => exportTrackChairs(trackChairs)}
              sx={buttonSx}
            >
              {T.translate("general.export")}
            </Button>
            <Button
              variant="contained"
              onClick={handleNewTrackChair}
              startIcon={<AddIcon />}
              sx={buttonSx}
            >
              {T.translate("track_chairs.add")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

      {trackChairs.length === 0 ? (
        <div>{T.translate("track_chairs.no_items")}</div>
      ) : (
        <MuiTable
          columns={columns}
          data={trackChairs}
          options={table_options}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalTrackChairs}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteDialogBody={(name) =>
            `${T.translate("track_chairs.delete_warning")} ${name}`
          }
        />
      )}

      {dialogEntity !== null && (
        <TrackChairDialog
          entity={dialogEntity}
          tracks={chairTracks}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, trackChairListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...trackChairListState
});

export default connect(mapStateToProps, {
  getTrackChairs,
  addTrackChair,
  saveTrackChair,
  deleteTrackChair,
  exportTrackChairs
})(TrackChairListPage);
