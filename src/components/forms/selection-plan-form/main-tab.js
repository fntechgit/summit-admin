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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid2 from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import MuiFormikDatetimepicker from "../../mui/formik-inputs/mui-formik-datetimepicker";

const MainTab = ({ hidden, currentSummit }) => {
  const { values, errors, setFieldValue } = useFormikContext();

  const hasErrors = (field) => errors[field] ?? "";

  const handleChange = (ev) => {
    const value =
      ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
    setFieldValue(ev.target.id, value);
  };

  return (
    <div role="tabpanel" id="tabpanel-main" hidden={hidden}>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label> {T.translate("edit_selection_plan.name")} *</label>
          <TextField
            id="name"
            fullWidth
            size="small"
            error={!!hasErrors("name")}
            helperText={hasErrors("name") || undefined}
            onChange={handleChange}
            value={values.name}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
          <FormControlLabel
            control={
              <Checkbox
                id="is_enabled"
                checked={values.is_enabled}
                onChange={handleChange}
              />
            }
            label={T.translate("edit_selection_plan.enabled")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
          <FormControlLabel
            control={
              <Checkbox
                id="is_hidden"
                checked={values.is_hidden}
                onChange={handleChange}
              />
            }
            label={T.translate("edit_selection_plan.hidden")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
          <FormControlLabel
            control={
              <Checkbox
                id="allow_proposed_schedules"
                checked={values.allow_proposed_schedules}
                onChange={handleChange}
              />
            }
            label={T.translate("edit_selection_plan.allow_proposed_schedules")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
          <FormControlLabel
            control={
              <Checkbox
                id="allow_new_presentations"
                checked={values.allow_new_presentations}
                onChange={handleChange}
              />
            }
            label={T.translate("edit_selection_plan.allow_new_presentations")}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>
            {T.translate("edit_selection_plan.submission_begin_date")}
          </label>
          <MuiFormikDatetimepicker
            name="submission_begin_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>
            {T.translate("edit_selection_plan.submission_end_date")}
          </label>
          <MuiFormikDatetimepicker
            name="submission_end_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>{T.translate("edit_selection_plan.max_submissions")}</label>
          <TextField
            id="max_submission_allowed_per_user"
            type="number"
            fullWidth
            size="small"
            error={!!hasErrors("max_submission_allowed_per_user")}
            helperText={
              hasErrors("max_submission_allowed_per_user") || undefined
            }
            value={values.max_submission_allowed_per_user}
            onChange={handleChange}
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>
            {T.translate(
              "edit_selection_plan.submission_lock_down_presentation_status_date"
            )}{" "}
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate(
                "edit_selection_plan.submission_lock_down_presentation_status_date_info"
              )}
            />
          </label>
          <MuiFormikDatetimepicker
            name="submission_lock_down_presentation_status_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>{T.translate("edit_selection_plan.voting_begin_date")}</label>
          <MuiFormikDatetimepicker
            name="voting_begin_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>{T.translate("edit_selection_plan.voting_end_date")}</label>
          <MuiFormikDatetimepicker
            name="voting_end_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>
            {T.translate("edit_selection_plan.selection_begin_date")}
          </label>
          <MuiFormikDatetimepicker
            name="selection_begin_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <label>{T.translate("edit_selection_plan.selection_end_date")}</label>
          <MuiFormikDatetimepicker
            name="selection_end_date"
            timezone={currentSummit.time_zone_id}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <label>
            {T.translate("edit_selection_plan.submission_period_disclaimer")} *
          </label>
          <TextEditorV3
            id="submission_period_disclaimer"
            value={values.submission_period_disclaimer}
            onChange={handleChange}
            error={hasErrors("submission_period_disclaimer")}
            license={process.env.JODIT_LICENSE_KEY}
          />
        </Grid2>
      </Grid2>
    </div>
  );
};

MainTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  currentSummit: PropTypes.shape({
    time_zone_id: PropTypes.string.isRequired
  }).isRequired
};

export default MainTab;
