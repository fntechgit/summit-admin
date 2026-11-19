/* *
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

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid2,
  InputLabel,
  MenuItem,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { queryGroups } from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikAsyncAutocomplete from "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select";
import FormikTextEditor from "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor";
import MuiForm from "openstack-uicore-foundation/lib/components/mui/form";
import AuditLogs from "../audit-logs";
import MuiLinkList from "../mui/link-list";
import MuiFormikColorField from "../mui/formik-inputs/mui-formik-color-field";
import MuiFormikDatetimepicker from "../mui/formik-inputs/mui-formik-datetimepicker";
import useScrollToError from "../../hooks/useScrollToError";
import {
  requiredStringValidation,
  hexColorValidation,
  dateValidation
} from "../../utils/yup";

const DATE_FIELDS = [
  "begin_attendee_voting_period_date",
  "end_attendee_voting_period_date",
  "submission_begin_date",
  "submission_end_date"
];

const formatGroupOption = (group) => ({
  value: group.id,
  label: group.title,
  raw: group
});

const getGroupTitle = (group) => group.title;

// groups can share a title, so key options by id
const getGroupOptionKey = (option) => option.value;

const unlinkTrackDialogBody = () =>
  T.translate("edit_event_category_group.unlink_track_warning");

const validationSchema = yup.object().shape({
  class_name: requiredStringValidation(),
  name: requiredStringValidation(),
  color: hexColorValidation().required(T.translate("validation.required")),
  begin_attendee_voting_period_date: dateValidation(),
  end_attendee_voting_period_date: dateValidation(),
  submission_begin_date: dateValidation(),
  submission_end_date: dateValidation()
});

const buildInitialValues = (entity, timezone) => {
  const values = { ...entity, class_name: entity.class_name || "" };
  DATE_FIELDS.forEach((field) => {
    values[field] = entity[field]
      ? epochToMomentTimeZone(entity[field], timezone)
      : null;
  });
  return values;
};

const EventCategoryGroupForm = ({
  currentSummit,
  allClasses,
  entity,
  errors,
  onSubmit,
  onTrackLink,
  onTrackUnLink,
  onAllowedGroupLink,
  onAllowedGroupUnLink
}) => {
  const handleSubmit = (values) => {
    const normalized = { ...values };
    // 0 clears the date, see normalizeGroupEntity
    DATE_FIELDS.forEach((field) => {
      normalized[field] = values[field] ? values[field].unix() : 0;
    });
    onSubmit(normalized);
  };

  const formik = useFormik({
    initialValues: buildInitialValues(entity, currentSummit.time_zone_id),
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit
  });

  useScrollToError(formik);

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      formik.setErrors(errors);
      formik.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        false
      );
    }
  }, [errors]);

  const handleTrackLink = (track) => {
    onTrackLink(entity.id, track);
  };

  const handleTrackUnLink = (trackId) => {
    onTrackUnLink(entity.id, trackId);
  };

  const groupSearchFormik = useFormik({
    initialValues: { group: null },
    onSubmit: () => {}
  });

  const handleAllowedGroupLink = () => {
    onAllowedGroupLink(entity.id, groupSearchFormik.values.group.raw);
    groupSearchFormik.setFieldValue("group", null);
  };

  const handleAllowedGroupUnLink = (valueId) => {
    onAllowedGroupUnLink(entity.id, valueId);
  };

  const shouldShowField = (flag) => {
    if (!formik.values.class_name) return false;
    const class_name = allClasses.find(
      (c) => c.class_name === formik.values.class_name
    );

    return class_name[flag];
  };

  const tracksColumns = [
    { columnKey: "name", header: T.translate("edit_event_category.name") },
    { columnKey: "code", header: T.translate("edit_event_category.code") }
  ];

  const selectedGroupIds = entity?.allowed_groups?.map((g) => g.id) || [];
  // remount key so options reload without the linked groups
  const groupSearchKey = selectedGroupIds.join();

  const allowedGroupsColumns = [
    { columnKey: "title", header: T.translate("edit_event_category.name") },
    {
      columnKey: "description",
      header: T.translate("edit_event_category.description")
    }
  ];

  return (
    <FormikProvider value={formik}>
      <MuiForm onSubmit={formik.handleSubmit}>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="class_name">
              {T.translate("edit_event_category_group.class")} *
            </InputLabel>
            <MuiFormikSelect
              name="class_name"
              disabled={entity.id !== 0}
              placeholder={T.translate(
                "edit_event_category_group.placeholders.select_class"
              )}
            >
              {allClasses.map((c) => (
                <MenuItem key={c.class_name} value={c.class_name}>
                  {c.class_name}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="name">
              {T.translate("edit_event_category_group.name")} *
            </InputLabel>
            <MuiFormikTextField name="name" margin="none" fullWidth />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="color">
              {T.translate("edit_event_category_group.color")} *
            </InputLabel>
            <MuiFormikColorField name="color" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel>
              {T.translate(
                "edit_event_category_group.begin_attendee_voting_period_date"
              )}
            </InputLabel>
            <MuiFormikDatetimepicker
              name="begin_attendee_voting_period_date"
              timezone={currentSummit.time_zone_id}
              format="YYYY-MM-DD HH:mm"
              ampm={false}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel>
              {T.translate(
                "edit_event_category_group.end_attendee_voting_period_date"
              )}
            </InputLabel>
            <MuiFormikDatetimepicker
              name="end_attendee_voting_period_date"
              timezone={currentSummit.time_zone_id}
              format="YYYY-MM-DD HH:mm"
              ampm={false}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="max_attendee_votes">
              {T.translate("edit_event_category_group.max_attendee_votes")}
            </InputLabel>
            <MuiFormikTextField
              name="max_attendee_votes"
              type="number"
              margin="none"
              fullWidth
            />
          </Grid2>
        </Grid2>

        {shouldShowField("submission_begin_date") && (
          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 4 }}>
              <InputLabel>
                {T.translate("edit_event_category_group.submission_begin_date")}
              </InputLabel>
              <MuiFormikDatetimepicker
                name="submission_begin_date"
                timezone={currentSummit.time_zone_id}
                format="YYYY-MM-DD HH:mm"
                ampm={false}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 4 }}>
              <InputLabel>
                {T.translate("edit_event_category_group.submission_end_date")}
              </InputLabel>
              <MuiFormikDatetimepicker
                name="submission_end_date"
                timezone={currentSummit.time_zone_id}
                format="YYYY-MM-DD HH:mm"
                ampm={false}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 4 }}>
              <InputLabel htmlFor="max_submission_allowed_per_user">
                {T.translate(
                  "edit_event_category_group.max_submission_allowed_per_user"
                )}
              </InputLabel>
              <MuiFormikTextField
                name="max_submission_allowed_per_user"
                type="number"
                margin="none"
                fullWidth
              />
            </Grid2>
          </Grid2>
        )}

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="description">
              {T.translate("edit_event_category_group.description")}
            </InputLabel>
            <FormikTextEditor name="description" />
          </Grid2>
        </Grid2>

        <hr />
        {entity.id !== 0 && (
          <MuiLinkList
            title={T.translate("edit_event_category_group.tracks")}
            placeholder={T.translate(
              "edit_event_category_group.placeholders.search_categories"
            )}
            values={entity.tracks}
            options={currentSummit.tracks}
            columns={tracksColumns}
            onLink={handleTrackLink}
            onUnLink={handleTrackUnLink}
            deleteDialogBody={unlinkTrackDialogBody}
          />
        )}
        {entity.id !== 0 && shouldShowField("allowed_groups") && (
          <Box sx={{ mb: 2 }}>
            <InputLabel htmlFor="group">
              {T.translate("edit_event_category_group.allowed_groups")}
            </InputLabel>
            <Grid2 container spacing={1} sx={{ mb: 2, alignItems: "stretch" }}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FormikProvider value={groupSearchFormik}>
                  <MuiFormikAsyncAutocomplete
                    key={groupSearchKey}
                    id="group"
                    name="group"
                    placeholder={T.translate(
                      "edit_event_category_group.placeholders.search_groups"
                    )}
                    queryFunction={queryGroups}
                    hiddenOptions={selectedGroupIds}
                    formatOption={formatGroupOption}
                    getOptionKey={getGroupOptionKey}
                  />
                </FormikProvider>
              </Grid2>
              <Grid2>
                <Button
                  variant="outlined"
                  disabled={!groupSearchFormik.values.group}
                  onClick={handleAllowedGroupLink}
                  sx={{ height: "100%" }}
                >
                  {T.translate("general.add")}
                </Button>
              </Grid2>
            </Grid2>
            <MuiTable
              columns={allowedGroupsColumns}
              data={entity.allowed_groups}
              getName={getGroupTitle}
              onDelete={handleAllowedGroupUnLink}
            />
          </Box>
        )}

        {entity.id !== 0 && (
          <Accordion sx={{ my: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                <b>{T.translate("audit_log.title")}</b>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <AuditLogs
                filterId="category_group"
                entityFilter={[
                  `entity_id==${entity.id}`,
                  `class_name==${entity.class_name}`
                ]}
                columns={["created", "action_description", "user"]}
              />
            </AccordionDetails>
          </Accordion>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button type="submit" variant="contained">
            {T.translate("general.save")}
          </Button>
        </Box>
      </MuiForm>
    </FormikProvider>
  );
};

EventCategoryGroupForm.propTypes = {
  currentSummit: PropTypes.object.isRequired,
  allClasses: PropTypes.array.isRequired,
  entity: PropTypes.object.isRequired,
  errors: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onTrackLink: PropTypes.func.isRequired,
  onTrackUnLink: PropTypes.func.isRequired,
  onAllowedGroupLink: PropTypes.func.isRequired,
  onAllowedGroupUnLink: PropTypes.func.isRequired
};

EventCategoryGroupForm.defaultProps = {
  errors: {}
};

export default EventCategoryGroupForm;
