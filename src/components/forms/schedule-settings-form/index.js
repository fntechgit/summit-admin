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

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useFormik, FormikProvider } from "formik";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Grid2,
  InputLabel,
  MenuItem,
  Typography
} from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSwitch from "openstack-uicore-foundation/lib/components/mui/formik-inputs/switch";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiTableSortable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import { FILTER_TYPES } from "../../../actions/schedule-settings-actions";
import useScrollToError from "../../../hooks/useScrollToError";
import EditLabelSlider from "../../inputs/edit-label-slider";
import PreFilterInput, { speakerLabel } from "./pre-filter-input";

const HIDDEN_PRE_FILTERS = [
  FILTER_TYPES.custom_order,
  FILTER_TYPES.abstract,
  FILTER_TYPES.date
];

const TIME_FORMATS = ["12h", "24h"];

const getColorSourceOptions = () => [
  { value: "TRACK", label: T.translate("edit_schedule_settings.track") },
  {
    value: "TRACK_GROUP",
    label: T.translate("edit_schedule_settings.track_groups")
  },
  {
    value: "EVENT_TYPES",
    label: T.translate("edit_schedule_settings.event_types")
  }
];

// tags and speakers are kept as {value, label} options while editing
const toFormPreFilter = (pf) => {
  switch (pf.type) {
    case FILTER_TYPES.tags:
      return {
        ...pf,
        values: pf.values.map((t) => ({ value: t.tag, label: t.tag }))
      };
    case FILTER_TYPES.speakers:
      return {
        ...pf,
        values: pf.values.map((s) => ({
          value: String(s.id),
          label: speakerLabel(s)
        }))
      };
    default:
      return pf;
  }
};

const toEntityPreFilter = (pf) => {
  switch (pf.type) {
    case FILTER_TYPES.tags:
      return { ...pf, values: pf.values.map((t) => ({ tag: t.value })) };
    case FILTER_TYPES.speakers:
      return {
        ...pf,
        values: pf.values.map((s) => ({
          id: parseInt(s.value, 10),
          first_name: s.label,
          last_name: ""
        }))
      };
    default:
      return pf;
  }
};

const ScheduleSettingsForm = ({ entity, summit, errors, onSubmit }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (values) => {
    setIsSaving(true);
    const normalizedValues = {
      ...values,
      pre_filters: values.pre_filters.map(toEntityPreFilter)
    };
    Promise.resolve(onSubmit(normalizedValues)).finally(() =>
      setIsSaving(false)
    );
  };

  const formik = useFormik({
    initialValues: {
      ...entity,
      pre_filters: entity.pre_filters.map(toFormPreFilter)
    },
    enableReinitialize: true,
    onSubmit: handleSubmit
  });

  useScrollToError(formik);

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      formik.setErrors(errors);
      // skip validation, it would wipe the server errors just set
      formik.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        false
      );
    }
  }, [errors]);

  const { values, setFieldValue } = formik;
  const disabled = !values.is_enabled;
  const colorSourceOptions = getColorSourceOptions();

  const filterColumns = [
    {
      columnKey: "type",
      header: T.translate("edit_schedule_settings.filter_title"),
      render: (filter) => (
        <EditLabelSlider
          name={`filters[${values.filters.findIndex(
            (f) => f.type === filter.type
          )}]`}
          disabled={disabled}
        />
      )
    }
  ];

  const handleReorderFilters = (reordered) =>
    setFieldValue("filters", reordered);

  return (
    <FormikProvider value={formik}>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="key">
              {T.translate("edit_schedule_settings.key")}
            </InputLabel>
            <MuiFormikTextField name="key" margin="none" fullWidth disabled />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <MuiFormikSwitch
              name="is_enabled"
              label={T.translate("edit_schedule_settings.enabled")}
            />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="color_source">
              {T.translate("edit_schedule_settings.color_source")} *
            </InputLabel>
            <MuiFormikSelect
              name="color_source"
              disabled={disabled}
              renderValue={(selected) =>
                colorSourceOptions.find((o) => o.value === selected)?.label ??
                selected
              }
            >
              {colorSourceOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="time_format">
              {T.translate("edit_schedule_settings.time_format")} *
            </InputLabel>
            <MuiFormikSelect name="time_format" disabled={disabled}>
              {TIME_FORMATS.map((tf) => (
                <MenuItem key={tf} value={tf}>
                  {tf}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <MuiFormikSwitch
              name="is_my_schedule"
              label={T.translate("edit_schedule_settings.is_my_schedule")}
              disabled={disabled}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <MuiFormikSwitch
              name="only_events_with_attendee_access"
              label={T.translate("edit_schedule_settings.access_levels_only")}
              disabled={disabled}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <MuiFormikSwitch
              name="hide_past_events_with_show_always_on_schedule"
              label={T.translate("edit_schedule_settings.hide_past_permanent")}
              disabled={disabled}
            />
          </Grid2>
        </Grid2>

        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          {T.translate("edit_schedule_settings.filters")}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <MuiTableSortable
            data={values.filters}
            columns={filterColumns}
            onReorder={handleReorderFilters}
          />
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          {T.translate("edit_schedule_settings.pre_filters")}
        </Typography>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          {values.pre_filters.map(
            (pf, idx) =>
              !HIDDEN_PRE_FILTERS.includes(pf.type) && (
                <Grid2 key={pf.type} size={{ xs: 12, md: 6 }}>
                  <PreFilterInput
                    name={`pre_filters[${idx}]`}
                    type={pf.type}
                    summit={summit}
                    disabled={disabled}
                  />
                </Grid2>
              )
          )}
        </Grid2>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {T.translate("general.save")}
          </Button>
        </Box>
      </Box>
    </FormikProvider>
  );
};

ScheduleSettingsForm.propTypes = {
  entity: PropTypes.object.isRequired,
  summit: PropTypes.object.isRequired,
  errors: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
};

export default ScheduleSettingsForm;
