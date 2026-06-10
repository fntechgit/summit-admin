/**
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
import PropTypes from "prop-types";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import DashboardStatSection from "./components/dashboard-stat-section";
import { getSummitById } from "../../actions/summit-actions";
import { getRegistrationData } from "../../actions/summit-stats-actions";
import Member from "../../models/member";
import SummitDashboardDateRange from "./components/summit-dashboard-date-range";
import DashboardSection from "./components/dashboard-section";

const TAB_KEYS = [
  "dashboard.dashboard",
  "dashboard.ordering",
  "dashboard.important_documents",
  "dashboard.sponsor_levels",
  "dashboard.pages",
  "dashboard.tab_badge_types",
  "dashboard.media_uploads",
  "dashboard.booth_layout_types"
];

function SummitDashboardPage({
  currentSummit,
  member,
  match,
  totalOrders,
  totalActiveTickets,
  getRegistrationData: fetchRegistrationData
}) {
  useEffect(() => {
    fetchRegistrationData();
  }, [currentSummit.id]);

  const canEditSummit = new Member(member).canEditSummit();
  const tz = currentSummit.time_zone?.name;
  const venueCount = currentSummit.locations.filter(
    (l) => l.class_name === "SummitVenue"
  ).length;

  return (
    <Container>
      <Breadcrumb
        data={{
          title: T.translate("dashboard.dashboard"),
          pathname: match.url
        }}
      />

      <Typography variant="h4" gutterBottom>
        {currentSummit.name}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={0} onChange={() => {}}>
          {TAB_KEYS.map((key, i) => (
            <Tab key={key} label={T.translate(key)} disabled={i !== 0} />
          ))}
        </Tabs>
      </Box>

      <Grid2 container spacing={3}>
        <Grid2 size={6}>
          <DashboardSection
            title={T.translate("dashboard.dates")}
            variant="card"
          >
            <DashboardSection title={T.translate("dashboard.general_dates")}>
              <SummitDashboardDateRange
                label={T.translate("general.summit")}
                startTs={currentSummit.start_date}
                endTs={currentSummit.end_date}
                tzName={tz}
              />
              <SummitDashboardDateRange
                label={T.translate("dashboard.registration")}
                startTs={currentSummit.registration_begin_date}
                endTs={currentSummit.registration_end_date}
                tzName={tz}
              />
            </DashboardSection>
            {currentSummit.selection_plans.map((sp) => (
              <DashboardSection key={`sp_${sp.id}`} title={sp.name}>
                <SummitDashboardDateRange
                  label={T.translate("dashboard.submission")}
                  startTs={sp.submission_begin_date}
                  endTs={sp.submission_end_date}
                  tzName={tz}
                />
                <SummitDashboardDateRange
                  label={T.translate("dashboard.voting")}
                  startTs={sp.voting_begin_date}
                  endTs={sp.voting_end_date}
                  tzName={tz}
                />
                <SummitDashboardDateRange
                  label={T.translate("dashboard.selection")}
                  startTs={sp.selection_begin_date}
                  endTs={sp.selection_end_date}
                  tzName={tz}
                />
              </DashboardSection>
            ))}
          </DashboardSection>
        </Grid2>

        {canEditSummit && (
          <Grid2 size={6}>
            <Stack spacing={3}>
              <DashboardStatSection
                title={T.translate("dashboard.events")}
                rows={[
                  [
                    {
                      title: T.translate("general.speakers"),
                      stat: currentSummit.speakers_count
                    },
                    {
                      title: T.translate("dashboard.submitted_events"),
                      stat: currentSummit.presentations_submitted_count
                    }
                  ],
                  [
                    {
                      title: T.translate("dashboard.published_events"),
                      stat: currentSummit.published_events_count
                    },
                    { title: T.translate("dashboard.venues"), stat: venueCount }
                  ]
                ]}
              />

              <DashboardStatSection
                title={T.translate("dashboard.registration_stats")}
                rows={[
                  [
                    {
                      title: T.translate("dashboard.orders"),
                      stat: totalOrders
                    },
                    {
                      title: T.translate("dashboard.total_tickets"),
                      stat: totalActiveTickets
                    }
                  ]
                ]}
              />

              <DashboardStatSection
                title={T.translate("dashboard.emails")}
                rows={[
                  [
                    {
                      title: T.translate("dashboard.accepted"),
                      stat: currentSummit.speaker_announcement_email_accepted_count
                    },
                    {
                      title: T.translate("dashboard.rejected"),
                      stat: currentSummit.speaker_announcement_email_rejected_count
                    },
                    {
                      title: T.translate("dashboard.alternate"),
                      stat: currentSummit.speaker_announcement_email_alternate_count
                    }
                  ],
                  [
                    {
                      title: T.translate("dashboard.accepted_alternate"),
                      stat: currentSummit.speaker_announcement_email_accepted_alternate_count
                    },
                    {
                      title: T.translate("dashboard.accepted_rejected"),
                      stat: currentSummit.speaker_announcement_email_accepted_rejected_count
                    },
                    {
                      title: T.translate("dashboard.alternate_rejected"),
                      stat: currentSummit.speaker_announcement_email_alternate_rejected_count
                    }
                  ]
                ]}
              />
            </Stack>
          </Grid2>
        )}
      </Grid2>
    </Container>
  );
}

SummitDashboardPage.propTypes = {
  currentSummit: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    time_zone: PropTypes.shape({
      name: PropTypes.string
    }),
    start_date: PropTypes.number,
    end_date: PropTypes.number,
    registration_begin_date: PropTypes.number,
    registration_end_date: PropTypes.number,
    selection_plans: PropTypes.arrayOf(PropTypes.shape({})),
    locations: PropTypes.arrayOf(PropTypes.shape({})),
    speakers_count: PropTypes.number,
    presentations_submitted_count: PropTypes.number,
    published_events_count: PropTypes.number,
    speaker_announcement_email_accepted_count: PropTypes.number,
    speaker_announcement_email_rejected_count: PropTypes.number,
    speaker_announcement_email_alternate_count: PropTypes.number,
    speaker_announcement_email_accepted_alternate_count: PropTypes.number,
    speaker_announcement_email_accepted_rejected_count: PropTypes.number,
    speaker_announcement_email_alternate_rejected_count: PropTypes.number
  }).isRequired,
  member: PropTypes.shape({}),
  match: PropTypes.shape({
    url: PropTypes.string
  }).isRequired,
  totalOrders: PropTypes.number,
  totalActiveTickets: PropTypes.number,
  getRegistrationData: PropTypes.func.isRequired
};

SummitDashboardPage.defaultProps = {
  member: null,
  totalOrders: 0,
  totalActiveTickets: 0
};

const mapStateToProps = ({
  currentSummitState,
  loggedUserState,
  summitStatsState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member,
  totalOrders: summitStatsState.total_orders,
  totalActiveTickets: summitStatsState.total_active_tickets
});

export default connect(mapStateToProps, {
  getSummitById,
  getRegistrationData
})(SummitDashboardPage);
