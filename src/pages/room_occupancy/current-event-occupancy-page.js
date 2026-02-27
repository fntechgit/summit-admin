/* *
 * Copyright 2026 OpenStack Foundation
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
import { Breadcrumb } from "react-breadcrumbs";
import {
  getCurrentEventForOccupancy,
  subscribeToOccupancyChannel,
  saveOccupancy
} from "../../actions/room-occupancy-actions";
import FragmentParser from "../../utils/fragmen-parser";

import "../../styles/room-occupancy-page.less";
import { ROOM_OCCUPANCY_OPTIONS } from "../../utils/constants";

const CurrentEventOccupancyPage = ({
  match,
  currentEvent,
  getCurrentEventForOccupancy,
  saveOccupancy,
  subscribeToOccupancyChannel
}) => {
  const fragmentParser = new FragmentParser();
  const eventIdHash = fragmentParser.getParam("event");
  const roomId = match.params.room_id;
  const occupancyOptions = ROOM_OCCUPANCY_OPTIONS;

  useEffect(() => {
    subscribeToOccupancyChannel();
  }, []);

  useEffect(() => {
    if (roomId) {
      getCurrentEventForOccupancy(roomId, eventIdHash);
    }
  }, [roomId]);

  const changeOccupancy = (event, add, ev) => {
    const key = occupancyOptions.indexOf(event.occupancy);

    ev.preventDefault();

    if (add) {
      if (event.occupancy === "FULL") return;
      event.occupancy = occupancyOptions[key + 1];
    } else {
      if (event.occupancy === "EMPTY") return;
      event.occupancy = occupancyOptions[key - 1];
    }

    saveOccupancy(event);
  };

  if (!currentEvent.id) {
    return (
      <div className="currentEventView text-center">
        <Breadcrumb data={{ title: roomId, pathname: match.url }} />
        <div>{T.translate("room_occupancy.no_current_event")}</div>
      </div>
    );
  }

  return (
    <div className="currentEventView text-center">
      <Breadcrumb data={{ title: currentEvent.room, pathname: match.url }} />

      <div className="container">
        <h3>{currentEvent.title}</h3>

        <label>Speakers:</label>
        <div>{currentEvent.speakers}</div>

        <label>From:</label>
        <div>{currentEvent.start_date}</div>

        <label>To:</label>
        <div>{currentEvent.end_date}</div>

        <div className="form-inline occupancy">
          <button
            className="btn btn-default"
            onClick={(ev) => changeOccupancy(currentEvent, false, ev)}
          >
            <i className="fa fa-minus" />
          </button>
          <span>{currentEvent.occupancy}</span>
          <button
            className="btn btn-default"
            onClick={(ev) => changeOccupancy(currentEvent, true, ev)}
          >
            <i className="fa fa-plus" />
          </button>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentRoomOccupancyState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  currentEvent: currentRoomOccupancyState.currentEvent
});

export default connect(mapStateToProps, {
  getCurrentEventForOccupancy,
  saveOccupancy,
  subscribeToOccupancyChannel
})(CurrentEventOccupancyPage);
