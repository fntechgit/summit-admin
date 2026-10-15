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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Grid2, Typography } from "@mui/material";
import DashboardSection from "../../components/mui/dashboard-section";
import DashboardRow from "../../components/mui/dashboard-row";
import SummitDashboardDateRange from "../../components/mui/summit-dashboard-date-range";
import { formatDate } from "../../utils/methods";
import { DATETIME_FORMAT } from "../../utils/constants";

const SETTINGS_LABEL_WIDTH = 220;
const DATES_LABEL_WIDTH = 260;
const LINKED_LABEL_WIDTH = 320;

const SelectionPlanSummaryPage = ({ currentSummit, entity }) => {
  const yesNo = (value) =>
    value ? T.translate("general.yes") : T.translate("general.no");

  const names = (items, key = "name") =>
    items?.length
      ? items.map((item) => item[key]).join(", ")
      : T.translate("general.n_a");

  const settingsRows = [
    {
      label: T.translate("edit_selection_plan.enabled"),
      value: yesNo(entity.is_enabled)
    },
    {
      label: T.translate("edit_selection_plan.hidden"),
      value: yesNo(entity.is_hidden)
    },
    {
      label: T.translate("edit_selection_plan.allow_proposed_schedules"),
      value: yesNo(entity.allow_proposed_schedules)
    },
    {
      label: T.translate("edit_selection_plan.allow_new_presentations"),
      value: yesNo(entity.allow_new_presentations)
    },
    {
      label: T.translate("edit_selection_plan.max_submissions"),
      value: entity.max_submission_allowed_per_user
    }
  ];

  const linkedRows = [
    {
      label: T.translate("edit_selection_plan.track_groups"),
      value: names(entity.track_groups)
    },
    {
      label: T.translate("edit_selection_plan.event_types"),
      value: names(entity.event_types)
    },
    {
      label: T.translate("edit_selection_plan.extra_questions"),
      value: names(entity.extra_questions)
    },
    {
      label: T.translate("track_chair_settings.title"),
      value: names(entity.track_chair_rating_types)
    },
    {
      label: T.translate("edit_selection_plan.presentation_action_types"),
      value: names(entity.allowed_presentation_action_types, "label")
    }
  ];

  return (
    <div className="container">
      <h3>{entity.name}</h3>
      <hr />
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
        <Grid2 size={6}>
          <DashboardSection
            title={T.translate("edit_selection_plan.selection_plan")}
            variant="card"
          >
            {settingsRows.map(({ label, value }) => (
              <DashboardRow
                key={label}
                label={label}
                labelWidth={SETTINGS_LABEL_WIDTH}
              >
                <Typography variant="body1">{value}</Typography>
              </DashboardRow>
            ))}
          </DashboardSection>
        </Grid2>
        <Grid2 size={6}>
          <DashboardSection
            title={T.translate("edit_selection_plan.dates")}
            variant="card"
          >
            <SummitDashboardDateRange
              label={T.translate("dashboard.submission")}
              startTs={entity.submission_begin_date}
              endTs={entity.submission_end_date}
              tzName={currentSummit.time_zone_id}
              labelWidth={DATES_LABEL_WIDTH}
            />
            {!!entity.submission_lock_down_presentation_status_date && (
              <DashboardRow
                label={T.translate(
                  "edit_selection_plan.submission_lock_down_presentation_status_date"
                )}
                labelWidth={DATES_LABEL_WIDTH}
              >
                <Typography variant="body1">
                  {formatDate(
                    entity.submission_lock_down_presentation_status_date,
                    currentSummit.time_zone_id,
                    DATETIME_FORMAT
                  )}
                </Typography>
              </DashboardRow>
            )}
            <SummitDashboardDateRange
              label={T.translate("dashboard.voting")}
              startTs={entity.voting_begin_date}
              endTs={entity.voting_end_date}
              tzName={currentSummit.time_zone_id}
              labelWidth={DATES_LABEL_WIDTH}
            />
            <SummitDashboardDateRange
              label={T.translate("dashboard.selection")}
              startTs={entity.selection_begin_date}
              endTs={entity.selection_end_date}
              tzName={currentSummit.time_zone_id}
              labelWidth={DATES_LABEL_WIDTH}
            />
          </DashboardSection>
        </Grid2>
        <Grid2 size={12}>
          <DashboardSection
            title={T.translate("edit_selection_plan.linked_items")}
            variant="card"
          >
            {linkedRows.map(({ label, value }) => (
              <DashboardRow
                key={label}
                label={label}
                labelWidth={LINKED_LABEL_WIDTH}
              >
                <Typography variant="body1">{value}</Typography>
              </DashboardRow>
            ))}
          </DashboardSection>
        </Grid2>
        {entity.submission_period_disclaimer && (
          <Grid2 size={12}>
            <DashboardSection
              title={T.translate(
                "edit_selection_plan.submission_period_disclaimer"
              )}
              variant="card"
            >
              <Box
                sx={{ p: 2 }}
                dangerouslySetInnerHTML={{
                  __html: entity.submission_period_disclaimer
                }}
              />
            </DashboardSection>
          </Grid2>
        )}
      </Grid2>
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSelectionPlanState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  entity: currentSelectionPlanState.entity
});

export default connect(mapStateToProps, {})(SelectionPlanSummaryPage);
