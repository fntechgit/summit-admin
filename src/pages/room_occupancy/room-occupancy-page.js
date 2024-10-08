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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Dropdown
} from "openstack-uicore-foundation/lib/components";
import { getSummitById } from "../../actions/summit-actions";
import {
  getEventsForOccupancy,
  getEventsForOccupancyCSV,
  saveOccupancy,
  deleteOverflowOccupancy,
  saveOverflowOccupancy
} from "../../actions/event-actions";
import OccupancyTable from "../../components/tables/room-occupancy-table/OccupancyTable";
import FragmentParser from "../../utils/fragmen-parser";

import "../../styles/room-occupancy-page.less";

class RoomOccupancyPage extends React.Component {
  constructor(props) {
    super(props);

    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleRoomFilter = this.handleRoomFilter.bind(this);
    this.handleChangeCurrentEvents = this.handleChangeCurrentEvents.bind(this);
    this.handleEventViewClick = this.handleEventViewClick.bind(this);
    this.fragmentParser = new FragmentParser();
    this.handleExport = this.handleExport.bind(this);
  }

  componentDidMount() {
    const { currentSummit } = this.props;
    const roomIdHash = this.fragmentParser.getParam("room");
    const currentHash = this.fragmentParser.getParam("current") === "true";

    if (currentSummit) {
      this.props.getEventsForOccupancy(null, roomIdHash, currentHash);
    }
  }

  handleExport() {
    const { term, order, orderDir, roomId, currentEvents } = this.props;
    this.props.getEventsForOccupancyCSV(
      term,
      roomId,
      currentEvents,
      order,
      orderDir
    );
  }

  handlePageChange(page) {
    const { term, order, orderDir, perPage, roomId, currentEvents } =
      this.props;
    this.props.getEventsForOccupancy(
      term,
      roomId,
      currentEvents,
      page,
      perPage,
      order,
      orderDir
    );
  }

  handleSort(index, key, dir) {
    const { term, page, perPage, roomId, currentEvents } = this.props;
    key = key === "name" ? "last_name" : key;
    this.props.getEventsForOccupancy(
      term,
      roomId,
      currentEvents,
      page,
      perPage,
      key,
      dir
    );
  }

  handleSearch(term) {
    const { order, orderDir, page, perPage, roomId, currentEvents } =
      this.props;
    this.props.getEventsForOccupancy(
      term,
      roomId,
      currentEvents,
      page,
      perPage,
      order,
      orderDir
    );
  }

  handleRoomFilter(ev) {
    const { term, order, orderDir, page, perPage, currentEvents } = this.props;
    const roomId = ev.target.value;

    this.fragmentParser.setParam("room", roomId);
    window.location.hash = this.fragmentParser.serialize();

    this.props.getEventsForOccupancy(
      term,
      roomId,
      currentEvents,
      page,
      perPage,
      order,
      orderDir
    );
  }

  handleChangeCurrentEvents(ev) {
    const { term, roomId, order, orderDir, page, perPage } = this.props;
    const value = ev.target.checked;

    this.fragmentParser.setParam("current", value);
    window.location.hash = this.fragmentParser.serialize();

    this.props.getEventsForOccupancy(
      term,
      roomId,
      value,
      page,
      perPage,
      order,
      orderDir
    );
  }

  changeOccupancy(eventId, add) {
    const values = ["EMPTY", "25%", "50%", "75%", "FULL", "OVERFLOW"];
    const { events } = this.props;
    const event = events.find((e) => e.id === eventId);

    const key = values.indexOf(event.occupancy);

    if (add) {
      if (event.occupancy === "OVERFLOW") return;
      event.occupancy = values[key + 1];
    } else {
      if (event.occupancy === "EMPTY") return;
      if (event.occupancy === "OVERFLOW") {
        // if it was in overflow we delete overflow and set new occupancy
        this.deleteOverflow(event.id, values[key - 1]);
      }
      event.occupancy = values[key - 1];
    }

    this.props.saveOccupancy(event);
  }

  saveOverflow = (eventId, streamUrl, isSecure) => {
    this.props.saveOverflowOccupancy(eventId, streamUrl, isSecure);
  };

  deleteOverflow = (eventId, newOccupancy) => {
    this.props.deleteOverflowOccupancy(eventId, newOccupancy);
  };

  handleEventViewClick(ev) {
    const { roomId, history, currentSummit } = this.props;

    ev.preventDefault();

    history.push(`/app/summits/${currentSummit.id}/room-occupancy/${roomId}`);
  }

  render() {
    const {
      currentSummit,
      events,
      lastPage,
      currentPage,
      term,
      order,
      orderDir,
      roomId,
      currentEvents
    } = this.props;
    const that = this;

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

    const table_options = {
      sortCol: order === "last_name" ? "name" : order,
      sortDir: orderDir,
      actions: {
        valueRow: "occupancy",
        onMore(eventId) {
          that.changeOccupancy(eventId, true);
        },
        onLess(eventId) {
          that.changeOccupancy(eventId, false);
        }
      }
    };

    if (!currentSummit.id) return <div />;

    const room_ddl = currentSummit.locations
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
                onSearch={this.handleSearch}
              />
            </div>
            <div className="col-md-3">
              <Dropdown
                id="roomId"
                value={roomId}
                placeholder={T.translate(
                  "room_occupancy.placeholders.select_room"
                )}
                options={room_ddl}
                onChange={this.handleRoomFilter}
                clearable
              />
            </div>
            <div className="col-md-3 checkboxes-div currentEvents">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="currentEvents"
                  checked={currentEvents}
                  onChange={this.handleChangeCurrentEvents}
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
                onClick={this.handleExport}
              >
                {T.translate("general.export")}
              </button>
            </div>

            {roomId && (
              <div className="col-md-3 visible-xs-block">
                <button
                  onClick={this.handleEventViewClick}
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
                options={table_options}
                data={events}
                columns={columns}
                onSort={this.handleSort}
                onSaveOverflow={this.saveOverflow}
                onDeleteOverflow={this.deleteOverflow}
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
                onSelect={this.handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentRoomOccupancyState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentRoomOccupancyState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEventsForOccupancy,
  saveOccupancy,
  deleteOverflowOccupancy,
  saveOverflowOccupancy,
  getEventsForOccupancyCSV
})(RoomOccupancyPage);
