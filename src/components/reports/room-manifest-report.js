/* *
 * Copyright 2019 OpenStack Foundation
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
import moment from "moment-timezone";
import { Table } from "openstack-uicore-foundation/lib/components";
import wrapReport from "./report-wrapper";
import { groupByDate } from "../../utils/methods";

const Query = require("graphql-query-builder");

const formatSpeaker = (s) => {
  if (!s) return "";
  return `${s.title} ${s.fullName} (${s.emails}) - ${s.phoneNumber} - ${s.currentCompany}`;
};

class RoomManifestReport extends React.Component {
  constructor(props) {
    super(props);

    this.buildReportQuery = this.buildReportQuery.bind(this);
    this.preProcessData = this.preProcessData.bind(this);
    this.handleAttendeeList = this.handleAttendeeList.bind(this);
  }

  getMaterialLink(eventId, filename) {
    const { currentSummit } = this.props;
    return `${process.env.S3_MEDIA_UPLOADS_ENDPOINT_URL}/${process.env.S3_MEDIA_UPLOADS_BUCKET_NAME}/${currentSummit.id}/${eventId}/${filename}`;
  }

  buildReportQuery(filters, listFilters, sortKey, sortDir) {
    const { currentSummit } = this.props;

    listFilters.published = true;
    listFilters.summitId = currentSummit.id;

    if (sortKey) {
      const querySortKey = this.translateSortKey(sortKey);
      const order = sortDir == 1 ? "" : "-";
      filters.ordering = `${order}${querySortKey},start_date`;
    }

    const query = new Query("presentations", listFilters);
    const type = new Query("type");
    type.find(["id", "type"]);
    const mediaupload = new Query("mediaupload");
    mediaupload.find(["filename"]);
    const materials = new Query("materials");
    materials.find([{ mediaupload }]);
    const venue = new Query("venue");
    venue.find(["name"]);
    const venueroom = new Query("venueroom");
    venueroom.find(["name", "capacity", { venue }]);
    const location = new Query("location");
    location.find([{ venueroom }]);
    const speakers = new Query("speakers");
    speakers.find([
      "id",
      "title",
      "fullName",
      "emails",
      "phoneNumber",
      "currentCompany"
    ]);
    const moderator = new Query("moderator");
    moderator.find([
      "id",
      "title",
      "fullName",
      "emails",
      "phoneNumber",
      "currentCompany"
    ]);
    const results = new Query("results", filters);
    results.find([
      "id",
      "title",
      "startDate",
      "endDate",
      "speakerCount",
      "allMediaUploads",
      { type },
      { location },
      { speakers },
      { moderator },
      { materials }
    ]);

    query.find([{ results }, "totalCount"]);

    return query;
  }

  translateSortKey(key) {
    let sortKey = key;
    switch (key) {
      case "event":
        sortKey = "title";
        break;
      case "room":
        sortKey = "location__venueroom__name";
        break;
      case "time":
        sortKey = "start_date";
        break;
    }

    return sortKey;
  }

  getName() {
    return "Room Manifest Report";
  }

  handleAttendeeList(eventId) {
    const { data } = this.props;
    const event = data.find((ev) => ev.id === eventId);

    if (event) {
      this.props.getMembersForEventCSV(event);
    }
  }

  preProcessData(data, extraData, forExport = false) {
    const { currentSummit } = this.props;

    const columns = [
      { columnKey: "id", value: "Id" },
      { columnKey: "time", value: "Time", sortable: true },
      { columnKey: "event", value: "Activity", sortable: true },
      { columnKey: "room", value: "Room", sortable: true },
      { columnKey: "venue", value: "Venue" },
      { columnKey: "capacity", value: "Capacity" },
      { columnKey: "speakerCount", value: "# Speakers" },
      { columnKey: "type", value: "Session Type" },
      { columnKey: "speaker_1", value: "Speaker 1" },
      { columnKey: "speaker_2", value: "Speaker 2" },
      { columnKey: "speaker_3", value: "Speaker 3" },
      { columnKey: "moderator", value: "Moderator" },
      { columnKey: "materials", value: "Presentation Materials" }
    ];

    const processedData = data.map((it) => {
      // 2020-10-19T12:30:00+00:00

      const format = "YYYY-MM-DDTHH:mm:ss+00:00";
      const momentStartDate = moment
        .tz(it.startDate, format, "UTC")
        .tz(currentSummit.time_zone_id);
      const momentEndDate = moment
        .tz(it.endDate, format, "UTC")
        .tz(currentSummit.time_zone_id);

      const date = momentStartDate.format("dddd Do");
      const date_simple = momentStartDate.valueOf();
      const time = `${momentStartDate.format(
        "h:mm a"
      )} - ${momentEndDate.format("h:mm a")}`;
      const capacity = forExport ? (
        it.location?.venueroom?.capacity
      ) : (
        <div className="text-center">{`${it.location?.venueroom?.capacity}`}</div>
      );
      const speakerCount = forExport ? (
        it.speakerCount
      ) : (
        <div className="text-center">{`${it.speakerCount}`}</div>
      );

      const speakers = it.speakers?.map(formatSpeaker);

      const materials = it.materials
        ?.filter((m) => m.mediaupload)
        .map((m) => {
          if (forExport) {
            return this.getMaterialLink(it.id, m.mediaupload.filename);
          }

          return (
            <a
              key={`mu-${m.mediaupload.filename}`}
              rel="noreferrer"
              target="_blank"
              href={this.getMaterialLink(it.id, m.mediaupload.filename)}
            >
              {m.mediaupload.filename}
            </a>
          );
        });

      return {
        id: it.id,
        date,
        date_simple,
        time,
        event: it.title,
        room: it.location?.venueroom?.name,
        venue: it.location?.venueroom?.venue?.name,
        capacity,
        speakerCount,
        type: it.type.type,
        materials: forExport ? materials.join(", ") : <div>{materials}</div>,
        speaker_1: speakers[0] || "",
        speaker_2: speakers[1] || "",
        speaker_3: speakers[2] || "",
        moderator: formatSpeaker(it.moderator)
      };
    });

    const groupedData = groupByDate(processedData, "date", "date_simple");

    return { reportData: groupedData, tableColumns: columns };
  }

  render() {
    const { data, sortKey, sortDir, name: storedDataName, onSort } = this.props;

    if (!data || storedDataName !== this.getName()) return <div />;

    const reportOptions = {
      sortCol: sortKey,
      sortDir
    };

    const { reportData, tableColumns } = this.preProcessData(data, null);

    const tables = [];

    for (const key in reportData) {
      tables.push(
        <div className="panel panel-default" key={`section_${key}`}>
          <div className="panel-heading">{key}</div>
          <div className="table-responsive">
            <Table
              options={reportOptions}
              data={reportData[key]}
              columns={tableColumns}
              onSort={onSort}
            />
          </div>
        </div>
      );
    }

    return <div>{tables}</div>;
  }
}

export default wrapReport(RoomManifestReport, {
  pagination: false,
  filters: ["track", "room"],
  grouped: true
});
