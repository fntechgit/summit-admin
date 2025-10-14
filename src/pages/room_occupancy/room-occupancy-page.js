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
import { Pagination } from "react-bootstrap";
import {
  Dropdown,
  FreeTextSearch
} from "openstack-uicore-foundation/lib/components";
import {
  deleteOverflowOccupancy,
  getEventsForOccupancy,
  getEventsForOccupancyCSV,
  saveOccupancy,
  saveOverflowOccupancy,
  subscribeToOccupancyChannel
} from "../../actions/room-occupancy-actions";
import OccupancyTable from "../../components/tables/room-occupancy-table/OccupancyTable";
import FragmentParser from "../../utils/fragmen-parser";

import "../../styles/room-occupancy-page.less";
import { ROOM_OCCUPANCY_OPTIONS } from "../../utils/constants";

const RoomOccupancyPage = ({
  currentSummit,
  history,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  lastPage,
  roomId,
  events,
  currentEvents,
  getEventsForOccupancy,
  saveOccupancy,
  deleteOverflowOccupancy,
  saveOverflowOccupancy,
  getEventsForOccupancyCSV,
  subscribeToOccupancyChannel
}) => {
  const fragmentParser = new FragmentParser();
  const roomIdHash = fragmentParser.getParam("room");
  const currentHash = fragmentParser.getParam("current") === "true";
  const occupancyOptions = ROOM_OCCUPANCY_OPTIONS;

  useEffect(() => {
    subscribeToOccupancyChannel();
  }, []);

  useEffect(() => {
    if (currentSummit) {
      getEventsForOccupancy(null, roomIdHash, currentHash);
    }
  }, [currentSummit]);

  const handleExport = () => {
    getEventsForOccupancyCSV(term, roomId, currentEvents, order, orderDir);
  };

  const handlePageChange = (newPage) => {
    getEventsForOccupancy(
      term,
      roomId,
      currentEvents,
      newPage,
      perPage,
      order,
      orderDir
    );
  };

  const handleSort = (index, key, dir) => {
    const keyTranslated = key === "name" ? "last_name" : key;
    getEventsForOccupancy(
      term,
      roomId,
      currentEvents,
      currentPage,
      perPage,
      keyTranslated,
      dir
    );
  };

  const handleSearch = (newTerm) => {
    getEventsForOccupancy(
      newTerm,
      roomId,
      currentEvents,
      1,
      perPage,
      order,
      orderDir
    );
  };

  const handleRoomFilter = (ev) => {
    const newRoomId = ev.target.value;

    fragmentParser.setParam("room", newRoomId);
    window.location.hash = fragmentParser.serialize();

    getEventsForOccupancy(
      term,
      newRoomId,
      currentEvents,
      1,
      perPage,
      order,
      orderDir
    );
  };

  const handleChangeCurrentEvents = (ev) => {
    const value = ev.target.checked;

    fragmentParser.setParam("current", value);
    window.location.hash = fragmentParser.serialize();

    getEventsForOccupancy(
      term,
      roomId,
      value,
      currentPage,
      perPage,
      order,
      orderDir
    );
  };

  const changeOccupancy = (eventId, add) => {
    const event = events.find((e) => e.id === eventId);
    const key = occupancyOptions.indexOf(event.occupancy);

    if (add) {
      if (event.occupancy === "OVERFLOW") return;
      event.occupancy = occupancyOptions[key + 1];
    } else {
      if (event.occupancy === "EMPTY") return;
      if (event.occupancy === "OVERFLOW") {
        // if it was in overflow we delete overflow and set new occupancy
        deleteOverflow(event.id, occupancyOptions[key - 1]);
      }
      event.occupancy = occupancyOptions[key - 1];
    }

    saveOccupancy(event);
  };

  const saveOverflow = (eventId, streamUrl, isSecure) => {
    saveOverflowOccupancy(eventId, streamUrl, isSecure);
  };

  const deleteOverflow = (eventId, newOccupancy) => {
    deleteOverflowOccupancy(eventId, newOccupancy);
  };

  const handleEventViewClick = (ev) => {
    ev.preventDefault();

    history.push(`/app/summits/${currentSummit.id}/room-occupancy/${roomId}`);
  };

  const columns = [
    { columnKey: "room", value: T.translate("room_occupancy.room") },
    {
      columnKey: "start_date",
      value: T.translate("room_occupancy.start"),
      sortable: true,
      width: "100px"
    },
    {
      columnKey: "title",
      value: T.translate("room_occupancy.title"),
      sortable: true
    },
    {
      columnKey: "track",
      value: T.translate("room_occupancy.track"),
      sortable: true
    },
    {
      columnKey: "speakers",
      value: T.translate("room_occupancy.speakers"),
      className: "hidden-xs"
    }
  ];

  const tableOptions = {
    sortCol: order === "last_name" ? "name" : order,
    sortDir: orderDir,
    actions: {
      valueRow: "occupancy",
      onMore(eventId) {
        changeOccupancy(eventId, true);
      },
      onLess(eventId) {
        changeOccupancy(eventId, false);
      }
    }
  };

  if (!currentSummit.id) return <div />;

  const roomDdl = currentSummit.locations
    .filter((v) => v.class_name === "SummitVenueRoom")
    .map((r) => ({ label: r.name, value: r.id }));

  return (
    <div className="occupancyWrapper">
      <div className="container">
        <h3> {T.translate("room_occupancy.room_occupancy")}</h3>
        <div className="row filters">
          <div className="col-md-5">
            <FreeTextSearch
              value={term}
              placeholder={T.translate(
                "room_occupancy.placeholders.search_events"
              )}
              onSearch={handleSearch}
            />
          </div>
          <div className="col-md-3">
            <Dropdown
              id="roomId"
              value={roomId}
              placeholder={T.translate(
                "room_occupancy.placeholders.select_room"
              )}
              options={roomDdl}
              onChange={handleRoomFilter}
              clearable
            />
          </div>
          <div className="col-md-3 checkboxes-div currentEvents">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="currentEvents"
                checked={currentEvents}
                onChange={handleChangeCurrentEvents}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="currentEvents">
                {T.translate("room_occupancy.currentEvents")}
              </label>
            </div>
          </div>
          <div className="col-md-1">
            <button
              className="btn btn-default exportButton"
              onClick={handleExport}
            >
              {T.translate("general.export")}
            </button>
          </div>

          {roomId && (
            <div className="col-md-3 visible-xs-block">
              <button
                onClick={handleEventViewClick}
                className="btn btn-primary currentEventButton"
              >
                {T.translate("room_occupancy.current_event_view")}
              </button>
            </div>
          )}
        </div>

        {events.length === 0 && (
          <div>{T.translate("room_occupancy.no_events")}</div>
        )}

        {events.length > 0 && (
          <div style={{ overflow: "hidden" }}>
            <OccupancyTable
              options={tableOptions}
              data={events}
              columns={columns}
              onSort={handleSort}
              onSaveOverflow={saveOverflow}
              onDeleteOverflow={deleteOverflow}
            />
            <Pagination
              bsSize="medium"
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={10}
              items={lastPage}
              activePage={currentPage}
              onSelect={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentRoomOccupancyState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentRoomOccupancyState
});

export default connect(mapStateToProps, {
  getEventsForOccupancy,
  saveOccupancy,
  deleteOverflowOccupancy,
  saveOverflowOccupancy,
  getEventsForOccupancyCSV,
  subscribeToOccupancyChannel
})(RoomOccupancyPage);
