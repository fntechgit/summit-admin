/**
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
import Table from "openstack-uicore-foundation/lib/components/table";
import moment from "moment-timezone";
import wrapReport from "./report-wrapper";
import { flattenData } from "../../actions/report-actions";

const Query = require("graphql-query-builder");

class PresentationVideoReport extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.buildReportQuery = this.buildReportQuery.bind(this);
  }

  buildReportQuery(filters, listFilters, sortKey, sortDir) {
    const { currentSummit } = this.props;

    listFilters.summitId = currentSummit.id;
    listFilters.hasVideo = true;

    if (sortKey) {
      const querySortKey = this.translateSortKey(sortKey);
      const order = sortDir == 1 ? "" : "-";
      filters.ordering = `${order}${querySortKey}`;
    }

    const query = new Query("presentations", listFilters);
    const venue = new Query("venue");
    venue.find(["id", "name"]);
    const venueroom = new Query("venueroom");
    venueroom.find(["id", "name", { venue }]);
    const location = new Query("location");
    location.find(["id", { venueroom }]);
    const results = new Query("results", filters);
    results.find([
      "id",
      "title",
      "startDate",
      "endDate",
      "tagNames",
      "youtubeId",
      "externalUrl",
      { location }
    ]);

    query.find([{ results }, "totalCount"]);

    return query;
  }

  preProcessData(data) {
    const { currentSummit } = this.props;
    const flatData = flattenData(data);

    const processedData = flatData.map((it) => {
      const momentStartDate = moment
        .tz(it.startDate, "UTC")
        .tz(currentSummit.time_zone_id);
      const momentEndDate = moment
        .tz(it.endDate, "UTC")
        .tz(currentSummit.time_zone_id);
      const time = `${momentStartDate.format(
        "ddd, MMM D YYYY h:mm a"
      )} - ${momentEndDate.format("h:mm a")}`;

      return {
        id: it.id,
        event: it.title,
        time,
        tags: it.tagNames,
        room: it.location_venueroom_name,
        venue: it.location_venueroom_venue_name,
        youtubeId: it.youtubeId,
        externalUrl: it.externalUrl
      };
    });

    const columns = [
      { columnKey: "id", value: "ID", sortable: true },
      { columnKey: "time", value: "Date / Time", sortable: true },
      { columnKey: "tags", value: "Tags" },
      { columnKey: "event", value: "Event" },
      { columnKey: "room", value: "Room" },
      { columnKey: "venue", value: "Venue" },
      { columnKey: "youtubeId", value: "Youtube Id" },
      { columnKey: "externalUrl", value: "External Url" }
    ];

    return { reportData: processedData, tableColumns: columns };
  }

  translateSortKey(key) {
    let sortKey = key;
    switch (key) {
      case "time":
        sortKey = "start_date";
        break;
      default:
        break;
    }
    return sortKey;
  }

  getName() {
    return "Video Output Report";
  }

  render() {
    const { data, extraData, totalCount, sortKey, sortDir } = this.props;
    const storedDataName = this.props.name;

    if (!data || storedDataName !== this.getName()) return <div />;

    const report_options = {
      sortCol: sortKey,
      sortDir,
      actions: {}
    };

    const { reportData, tableColumns } = this.preProcessData(data, extraData);

    return (
      <div className="tag-report">
        <div className="panel panel-default">
          <div className="panel-heading"> Events ({totalCount}) </div>

          <div className="table">
            <Table
              options={report_options}
              data={reportData}
              columns={tableColumns}
              onSort={this.props.onSort}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default wrapReport(PresentationVideoReport, {
  pagination: true,
  filters: ["track", "room"]
});
