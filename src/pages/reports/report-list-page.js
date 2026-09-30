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

import Member from "../../models/member";

import "../../styles/report-list-page.less";

const ROOM_ADMIN_REPORTS = [
  "presentation_report",
  "speaker_report",
  "room_manifest_report",
  "presentation_video_report"
];

const ReportListPage = ({ currentSummit, member, history }) => {
  const presentationTypeId = currentSummit?.event_types?.find(
    (et) => et.name === "Presentation"
  )?.id;
  const typeFilterQS = presentationTypeId ? `&type=${presentationTypeId}` : "";

  const handleClick = (reportName) => {
    history.push(`/app/summits/${currentSummit.id}/reports/${reportName}`);
  };

  const reports = [
    { key: "presentation_report", path: "presentation_report" },
    { key: "speaker_report", path: "speaker_report#published_in=true" },
    { key: "rsvp_report", path: "rsvp_report" },
    {
      key: "room_metrics_report",
      path: `room_metrics_report#sort=time&sortdir=1${typeFilterQS}`
    },
    {
      key: "room_manifest_report",
      path: "room_manifest_report#sort=time&sortdir=1"
    },
    { key: "presentation_video_report", path: "presentation_video_report" },
    { key: "feedback_report", path: "feedback_report" },
    { key: "tag_report", path: "tag_report" },
    { key: "metrics_report", path: "metrics_report" },
    { key: "attendee_report", path: "attendee_report" }
  ];

  const roomAdminOnly = new Member(member).hasRoomReportsAccessOnly();
  const visibleReports = roomAdminOnly
    ? reports.filter((r) => ROOM_ADMIN_REPORTS.includes(r.key))
    : reports;

  return (
    <div className="container report-list">
      <h3> {T.translate("reports.reports")} </h3>

      <div className="row">
        {visibleReports.map((r) => (
          <div className="col-md-6" key={r.key}>
            <button
              className="btn btn-default"
              onClick={() => handleClick(r.path)}
            >
              {T.translate(`reports.${r.key}`)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, loggedUserState }) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member
});

export default connect(mapStateToProps, {})(ReportListPage);
