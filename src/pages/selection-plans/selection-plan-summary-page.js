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
import { Box, Button, Grid2 } from "@mui/material";
import { ListCard } from "openstack-uicore-foundation/lib/components/mui/cards";
import { formatDate } from "../../utils/methods";
import { DATETIME_FORMAT } from "../../utils/constants";
import { DATE_FIELDS } from "../../components/forms/selection-plan-form";

const SelectionPlanSummaryPage = ({ currentSummit, entity, history }) => {
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

  const dateRows = DATE_FIELDS.map((field) => ({
    label: T.translate(`edit_selection_plan.${field}`),
    value: entity[field]
      ? formatDate(entity[field], currentSummit.time_zone_id, DATETIME_FORMAT)
      : T.translate("general.n_a")
  }));

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

  const handleEdit = () => {
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${entity.id}/edit`
    );
  };

  return (
    <div className="container">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>{entity.name}</h3>
        <Button variant="contained" onClick={handleEdit}>
          {T.translate("general.edit")}
        </Button>
      </Box>
      <hr />
      <Grid2 container spacing={2} size={12} sx={{ mb: 4 }}>
        <Grid2 size={6}>
          <ListCard
            title={T.translate("edit_selection_plan.selection_plan")}
            rows={settingsRows}
          />
        </Grid2>
        <Grid2 size={6}>
          <ListCard
            title={T.translate("edit_selection_plan.dates")}
            rows={dateRows}
          />
        </Grid2>
        <Grid2 size={12}>
          <ListCard
            title={T.translate("edit_selection_plan.linked_items")}
            rows={linkedRows}
          />
        </Grid2>
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
