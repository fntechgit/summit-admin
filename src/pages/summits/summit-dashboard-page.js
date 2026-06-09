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
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { getSummitById } from "../../actions/summit-actions";
import { getRegistrationData } from "../../actions/summit-stats-actions";
import Member from "../../models/member";
import SummitDashboardDateRange from "./components/summit-dashboard-date-range";
import SummitDashboardSectionHeader from "./components/summit-dashboard-section-header";
import SummitDashboardStat from "./components/summit-dashboard-stat";

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
  }, []);

  if (!currentSummit.id || !currentSummit.time_zone?.name) return null;

  const canEditSummit = new Member(member).canEditSummit();
  const tz = currentSummit.time_zone.name;
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
          <Card elevation={0}>
            <CardHeader title={T.translate("dashboard.dates")} />
            <Divider />
            <SummitDashboardSectionHeader>
              {T.translate("dashboard.general_dates")}
            </SummitDashboardSectionHeader>
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
            {currentSummit.selection_plans.map((sp) => (
              <Box key={`sp_${sp.id}`}>
                <SummitDashboardSectionHeader>
                  {sp.name}
                </SummitDashboardSectionHeader>
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
              </Box>
            ))}
          </Card>
        </Grid2>

        {canEditSummit && (
          <Grid2 size={6}>
            <Stack spacing={3}>
              <Card elevation={0}>
                <CardHeader title={T.translate("dashboard.events")} />
                <Divider />
                <Grid2 container>
                  <Grid2 size={6}>
                    <SummitDashboardStat
                      label={T.translate("general.speakers")}
                      value={currentSummit.speakers_count}
                    />
                  </Grid2>
                  <Grid2 size={6}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.submitted_events")}
                      value={currentSummit.presentations_submitted_count}
                    />
                  </Grid2>
                </Grid2>
                <Divider />
                <Grid2 container>
                  <Grid2 size={6}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.published_events")}
                      value={currentSummit.published_events_count}
                    />
                  </Grid2>
                  <Grid2 size={6}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.venues")}
                      value={venueCount}
                    />
                  </Grid2>
                </Grid2>
              </Card>

              <Card elevation={0}>
                <CardHeader
                  title={T.translate("dashboard.registration_stats")}
                />
                <Divider />
                <Grid2 container>
                  <Grid2 size={6}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.orders")}
                      value={totalOrders}
                    />
                  </Grid2>
                  <Grid2 size={6}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.total_tickets")}
                      value={totalActiveTickets}
                    />
                  </Grid2>
                </Grid2>
              </Card>

              <Card elevation={0}>
                <CardHeader title={T.translate("dashboard.emails")} />
                <Divider />
                <Grid2 container>
                  <Grid2 size={4}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.accepted")}
                      value={
                        currentSummit.speaker_announcement_email_accepted_count
                      }
                    />
                  </Grid2>
                  <Grid2 size={4}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.rejected")}
                      value={
                        currentSummit.speaker_announcement_email_rejected_count
                      }
                    />
                  </Grid2>
                  <Grid2 size={4}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.alternate")}
                      value={
                        currentSummit.speaker_announcement_email_alternate_count
                      }
                    />
                  </Grid2>
                </Grid2>
                <Divider />
                <Grid2 container>
                  <Grid2 size={4}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.accepted_alternate")}
                      value={
                        currentSummit.speaker_announcement_email_accepted_alternate_count
                      }
                    />
                  </Grid2>
                  <Grid2 size={4}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.accepted_rejected")}
                      value={
                        currentSummit.speaker_announcement_email_accepted_rejected_count
                      }
                    />
                  </Grid2>
                  <Grid2 size={4}>
                    <SummitDashboardStat
                      label={T.translate("dashboard.alternate_rejected")}
                      value={
                        currentSummit.speaker_announcement_email_alternate_rejected_count
                      }
                    />
                  </Grid2>
                </Grid2>
              </Card>
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
