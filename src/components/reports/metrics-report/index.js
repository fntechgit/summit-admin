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
 **/

import React, {useState} from "react";
import moment from "moment-timezone";
import {
  CompanyInput,
  DateTimePicker,
  Dropdown,
  EventInput,
  Panel,
  Table
} from "openstack-uicore-foundation/lib/components";
const Query = require("graphql-query-builder");
import wrapReport from "./report-wrapper";
import { groupByDate } from "../../utils/methods";
import { flattenData } from "../../actions/report-actions";
import ReactDOMServer from "react-dom/server";
import { buildQuery, buildDrillDownQuery } from "./queries";
import FilterComponent from "./filters";
import RawMetricsTable from "./raw-metrics-table";


const MetricsReport = ({data, currentSummit, sortKey, sortDir, getMetricRaw }) => {
  const [filters, setFilters] = useState({});
  const isMemberReport = !!filters.search;

  const buildReportQuery = (wrapperFilters, listFilters, sortKey, sortDir) => {
    return buildQuery(wrapperFilters, listFilters, sortKey, sortDir);
  }

  const translateSortKey = (key) => {
    let sortKey = key;
    switch (key) {
      case "ingress":
        sortKey = "Ingress";
        break;
      case "outgress":
        sortKey = "Outgress";
        break;
      case "subtype":
        sortKey = "SubType";
        break;
      case "company":
        sortKey = "Company";
        break;
      case "email":
        sortKey = "Email";
        break;
      case "metric":
        sortKey = "FirstName";
        break;
    }
    return sortKey;
  }

  const getName = () => {
    return isMemberReport ? "Member Metrics" : "Metrics Report";
  }

  const getSearchPlaceholder = () => {
    return "Search by Member Email, Attendee Email or Room Name";
  }

  const toggleDrillDownData = async (target, id, metric) => {
    if (target.nextSibling.innerHTML) {
      target.nextSibling.innerHTML = "";
      return;
    }

    const query = buildDrillDownQuery(
      id,
      metric.memberId,
      metric.attendeeId,
      currentSummit.id,

    );
    const data = await getMetricRaw(query);
    target.nextSibling.innerHTML = ReactDOMServer.renderToString(
      <RawMetricsTable data={data} timezone={currentSummit.time_zone_id} />
    );
  }

  const preProcessData = (extraData, forExport = false) => {
    const { eventType, showAnswers } = filters;
    let processedData = [];
    let columns = [];

    if (!data || (isMemberReport && !data?.length))
      return { reportData: processedData, tableColumns: columns };

    if (this.memberReport) {
      const newData = data.map((d) => {
        const origin = d.eventName || d.sponsorName || d.locationName;
        return {
          type: d.type,
          date: moment
            .utc(d.ingressDate)
            .tz(currentSummit.time_zone_id)
            .format("dddd, MMMM Do YYYY, h:mm a (z)"),
          origin: origin,
          member: d.memberName,
          subtype: d.eventmetric?.subType,
          ip: d.ip
        };
      });

      processedData = groupByDate(newData, "member", "member");

      columns = [
        { columnKey: "type", value: "Type" },
        { columnKey: "origin", value: "Origin" },
        { columnKey: "subtype", value: "SubType" },
        { columnKey: "date", value: "Date" },
        { columnKey: "ip", value: "Ip" }
      ];

      if (forExport) {
        columns = [
          { columnKey: "member", value: "Member" },
          { columnKey: "type", value: "Type" },
          { columnKey: "origin", value: "Origin" },
          { columnKey: "subtype", value: "SubType" },
          { columnKey: "date", value: "Date" },
          { columnKey: "ip", value: "Ip" }
        ];

        processedData = Object.entries(processedData).reduce((result, item) => {
          const [key, value] = item;
          result = [...result, ...value];
          return result;
        }, []);

        processedData = flattenData(processedData);
      }
    } else {
      columns = [
        { columnKey: "metric", value: "Metric", sortable: true },
        { columnKey: "email", value: "Email", sortable: true },
        { columnKey: "company", value: "Company", sortable: true },
        { columnKey: "ip", value: "Ip" }
      ];

      if (showAnswers && data.extraQuestions) {
        columns = [
          ...columns,
          ...data.extraQuestions.map((q) => ({
            columnKey: q.id,
            value: q.name
          }))
        ];
      }

      if (eventType === "EVENT") {
        columns.push({
          columnKey: "subtype",
          value: "SubType",
          sortable: true
        });
        columns.push({
          columnKey: "ingress",
          value: "Ingress",
          sortable: true
        });
        columns.push({
          columnKey: "outgress",
          value: "Outgress",
          sortable: true
        });

        if (!data.rooms?.some((r) => r.events))
          return { reportData: processedData, tableColumns: columns };

        processedData = data.rooms
          .map((rm) => {
            return {
              ...rm,
              events: rm.events
                .filter((ev) => ev?.metrics?.length)
                .map((ev) => {
                  const metrics = ev.metrics.map((m) => {
                    const metric = this.parseMetricData(m);
                    return {
                      ...metric,
                      metric: forExport ? (
                        metric.metric
                      ) : (
                        <div>
                          <span
                            className="metricDrilldown"
                            onClick={(evt) =>
                              this.toggleDrillDownData(
                                evt.target,
                                ev.id,
                                metric
                              )
                            }
                          >
                            {metric.metric}
                          </span>
                          <div className="raw-metrics-table" />
                        </div>
                      ),
                      ingress: moment
                        .utc(metric.ingress)
                        .tz(currentSummit.time_zone_id)
                        .format("dddd, MMMM Do YYYY, h:mm a (z)"),
                      outgress: metric.outgress
                        ? moment
                          .utc(metric.outgress)
                          .tz(currentSummit.time_zone_id)
                          .format("dddd, MMMM Do YYYY, h:mm a (z)")
                        : "-"
                    };
                  });
                  return { ...ev, metrics };
                })
            };
          })
          .filter((rm) => rm.events.length);

        if (forExport) {
          processedData = processedData.reduce((result, item) => {
            result = [...result, ...item.events];
            return result;
          }, []);

          processedData = flattenData(processedData);

          columns = [
            { columnKey: "id", value: "Event Id" },
            { columnKey: "title", value: "Event" },
            { columnKey: "metrics_subType", value: "Subtype" },
            { columnKey: "metrics_metric", value: "Metric" },
            { columnKey: "metrics_email", value: "Email" },
            { columnKey: "metrics_company", value: "Company" },
            { columnKey: "metrics_ingress", value: "Ingress" },
            { columnKey: "metrics_outgress", value: "Outgress" },
            { columnKey: "metrics_ip", value: "Ip" }
          ];

          if (showAnswers && data.extraQuestions) {
            columns = [
              ...columns,
              ...data.extraQuestions.map((q) => ({
                columnKey: `metrics_${q.id}`,
                value: q.name
              }))
            ];
          }
        }
      } else if (eventType === "ROOM") {
        columns.push({
          columnKey: "subtype",
          value: "SubType",
          sortable: true
        });
        columns.push({
          columnKey: "ingress",
          value: "Ingress",
          sortable: true
        });
        columns.push({
          columnKey: "outgress",
          value: "Outgress",
          sortable: true
        });

        if (!data.rooms)
          return { reportData: processedData, tableColumns: columns };

        processedData = data.rooms
          .filter((r) => r?.venueroom?.metrics?.length)
          .map((rm) => {
            const metrics = rm.venueroom.metrics.map((m) => {
              const metric = this.parseMetricData(m);
              return {
                ...metric,
                metric: (
                  <div>
                    <span
                      className="metricDrilldown"
                      onClick={(ev) =>
                        this.toggleDrillDownData(ev.target, rm.id, metric)
                      }
                    >
                      {metric.metric}
                    </span>
                    <div className="raw-metrics-table" />
                  </div>
                ),
                ingress: moment
                  .utc(metric.ingress)
                  .tz(currentSummit.time_zone_id)
                  .format("dddd, MMMM Do YYYY, h:mm a (z)"),
                outgress: metric.outgress
                  ? moment
                    .utc(metric.outgress)
                    .tz(currentSummit.time_zone_id)
                    .format("dddd, MMMM Do YYYY, h:mm a (z)")
                  : "-"
              };
            });
            return { ...rm, metrics };
          });

        if (forExport) {
          processedData = flattenData(processedData);

          columns = [
            { columnKey: "id", value: "Room Id" },
            { columnKey: "name", value: "Room Name" },
            { columnKey: "metrics_subType", value: "Subtype" },
            { columnKey: "metrics_metric", value: "Metric" },
            { columnKey: "metrics_email", value: "Email" },
            { columnKey: "metrics_company", value: "Company" },
            { columnKey: "metrics_ingress", value: "Ingress" },
            { columnKey: "metrics_outgress", value: "Outgress" },
            { columnKey: "metrics_ip", value: "Ip" }
          ];

          if (showAnswers && data.extraQuestions) {
            columns = [
              ...columns,
              ...data.extraQuestions.map((q) => ({
                columnKey: `metrics_${q.id}`,
                value: q.name
              }))
            ];
          }
        }
      } else if (eventType === "SPONSOR") {
        if (!data.sponsors)
          return { reportData: processedData, tableColumns: columns };

        processedData = data.sponsors
          .filter((s) => s.metrics.length)
          .map((sp) => {
            const metrics = sp.metrics.map(this.parseMetricData);
            return { ...sp, metrics };
          });

        if (forExport) {
          processedData = flattenData(processedData);
          columns = [
            { columnKey: "id", value: "Id" },
            { columnKey: "companyName", value: "Sponsor" },
            { columnKey: "metrics_metric", value: "Metric" },
            { columnKey: "metrics_email", value: "Email" },
            { columnKey: "metrics_company", value: "Company" },
            { columnKey: "metrics_ip", value: "Ip" }
          ];

          if (showAnswers && data.extraQuestions) {
            columns = [
              ...columns,
              ...data.extraQuestions.map((q) => ({
                columnKey: `metrics_${q.id}`,
                value: q.name
              }))
            ];
          }
        }
      } else if (eventType === "POSTER") {
        if (!data.posters)
          return { reportData: processedData, tableColumns: columns };

        processedData = data.posters
          .filter((p) => p.metrics.length)
          .map((pos) => {
            const metrics = pos.metrics.map(this.parseMetricData);
            return { ...pos, metrics };
          });

        if (forExport) {
          processedData = flattenData(processedData);
          columns = [
            { columnKey: "id", value: "Id" },
            { columnKey: "title", value: "Poster" },
            { columnKey: "metrics_metric", value: "Metric" },
            { columnKey: "metrics_email", value: "Email" },
            { columnKey: "metrics_company", value: "Company" },
            { columnKey: "metrics_ip", value: "Ip" }
          ];

          if (showAnswers && data.extraQuestions) {
            columns = [
              ...columns,
              ...data.extraQuestions.map((q) => ({
                columnKey: `metrics_${q.id}`,
                value: q.name
              }))
            ];
          }
        }
      } else if (data.metrics) {
        processedData = data.metrics.map(this.parseMetricData);
      }
    }

    return { reportData: processedData, tableColumns: columns };
  }

  return (
    <div id="metric-report-wrapper">
      <FilterComponent summit={currentSummit} values={filters} onFilterChange={setFilters} />

      {this.getTable(reportData, report_options, tableColumns)}
    </div>
  );
}

export default wrapReport(MetricsReport, {
  pagination: false,
  preventInitialLoad: true
});