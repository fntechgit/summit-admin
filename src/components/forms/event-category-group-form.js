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

import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  queryTracks,
  queryGroups
} from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelectV2 from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select-v2";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import MuiFormikAsyncAutocomplete from "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select";
import MuiFormikColorField from "../mui/formik-inputs/mui-formik-color-field";
import useScrollToError from "../../hooks/useScrollToError";
import { requiredStringValidation } from "../../utils/yup";

const DEFAULT_PER_PAGE = 10;

const EventCategoryGroupForm = ({
  entity: initialEntity,
  allClasses,
  currentSummit,
  onSubmit,
  onTrackLink,
  onTrackUnLink,
  onAllowedGroupLink,
  onAllowedGroupUnLink
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [trackState, setTrackState] = useState({
    page: 1,
    perPage: DEFAULT_PER_PAGE
  });
  const [groupState, setGroupState] = useState({
    page: 1,
    perPage: DEFAULT_PER_PAGE
  });

  const trackSearchFormik = useFormik({
    initialValues: { track: null },
    onSubmit: () => {}
  });
  const groupSearchFormik = useFormik({
    initialValues: { group: null },
    onSubmit: () => {}
  });

  const isNew = !initialEntity?.id;

  const excludedTrackIds = initialEntity?.tracks?.map((t) => t.id) ?? [];
  const queryTrackOptions = (input, callback) =>
    queryTracks(currentSummit.id, input, callback, excludedTrackIds);

  const toEpoch = (momentValue) => {
    if (!momentValue || !momentValue.isValid()) return 0;
    return momentValue.unix();
  };

  const fromEpoch = (epoch) => {
    if (!epoch) return null;
    return epochToMomentTimeZone(epoch, currentSummit.time_zone_id);
  };

  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      class_name: initialEntity?.class_name ?? null,
      name: initialEntity?.name ?? "",
      color: initialEntity?.color ?? "",
      begin_attendee_voting_period_date:
        initialEntity?.begin_attendee_voting_period_date ?? 0,
      end_attendee_voting_period_date:
        initialEntity?.end_attendee_voting_period_date ?? 0,
      max_attendee_votes: initialEntity?.max_attendee_votes ?? 0,
      submission_begin_date: initialEntity?.submission_begin_date ?? 0,
      submission_end_date: initialEntity?.submission_end_date ?? 0,
      max_submission_allowed_per_user:
        initialEntity?.max_submission_allowed_per_user ?? 0,
      description: initialEntity?.description ?? ""
    },
    enableReinitialize: true,
    validationSchema: yup.object().shape({
      name: requiredStringValidation(),
      class_name: yup
        .string()
        .nullable()
        .required(T.translate("validation.required"))
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      Promise.resolve(onSubmit(values)).finally(() => {
        setIsSaving(false);
      });
    }
  });

  useScrollToError(formik, true);

  const selectedClass = allClasses.find(
    (c) => c.class_name === formik.values.class_name
  );
  const showSubmissionFields = selectedClass?.submission_begin_date ?? false;
  const showAllowedGroups = selectedClass?.allowed_groups ?? false;

  const classNameDdl = allClasses.map((c) => ({
    label: c.class_name,
    value: c.class_name
  }));

  const tracksColumns = [
    { columnKey: "name", header: T.translate("edit_event_category.name") },
    { columnKey: "code", header: T.translate("edit_event_category.code") }
  ];

  const allowedGroupsColumns = [
    { columnKey: "title", header: T.translate("edit_event_category.name") },
    {
      columnKey: "description",
      header: T.translate("edit_event_category.description")
    }
  ];

  const handleAddTrack = () => {
    const track = trackSearchFormik.values.track?.raw;
    if (!track) return;
    onTrackLink(initialEntity.id, track);
    trackSearchFormik.setFieldValue("track", null);
  };

  const handleTrackDelete = (trackId) => {
    onTrackUnLink(initialEntity.id, trackId);
  };

  const handleAddGroup = () => {
    const group = groupSearchFormik.values.group?.raw;
    if (!group) return;
    onAllowedGroupLink(initialEntity.id, group);
    groupSearchFormik.setFieldValue("group", null);
  };

  const handleAllowedGroupDelete = (groupId) => {
    onAllowedGroupUnLink(initialEntity.id, groupId);
  };

  const tracks = initialEntity?.tracks ?? [];
  const paginatedTracks = tracks.slice(
    (trackState.page - 1) * trackState.perPage,
    trackState.page * trackState.perPage
  );

  const allowedGroups = initialEntity?.allowed_groups ?? [];
  const paginatedGroups = allowedGroups.slice(
    (groupState.page - 1) * groupState.perPage,
    groupState.page * groupState.perPage
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <FormikProvider value={formik}>
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <Grid2 container spacing={2} alignItems="flex-start">
            <Grid2 size={4}>
              <Typography
                variant="body2"
                component="label"
                htmlFor="class_name"
              >
                {T.translate("edit_event_category_group.class")} *
              </Typography>
              <MuiFormikSelectV2
                name="class_name"
                placeholder={T.translate(
                  "edit_event_category_group.placeholders.select_class"
                )}
                options={classNameDdl}
                isDisabled={!isNew}
                isClearable={false}
                size="small"
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography variant="body2" component="label" htmlFor="name">
                {T.translate("edit_event_category_group.name")} *
              </Typography>
              <MuiFormikTextField
                variant="outlined"
                name="name"
                id="name"
                size="small"
                margin="none"
                fullWidth
                required
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography variant="body2" component="label">
                {T.translate("edit_event_category_group.color")} *
              </Typography>
              <MuiFormikColorField name="color" />
            </Grid2>

            <Grid2 size={4}>
              <Typography variant="body2" component="label">
                {T.translate(
                  "edit_event_category_group.begin_attendee_voting_period_date"
                )}
              </Typography>
              <DateTimePicker
                value={fromEpoch(
                  formik.values.begin_attendee_voting_period_date
                )}
                onChange={(val) =>
                  formik.setFieldValue(
                    "begin_attendee_voting_period_date",
                    toEpoch(val)
                  )
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography variant="body2" component="label">
                {T.translate(
                  "edit_event_category_group.end_attendee_voting_period_date"
                )}
              </Typography>
              <DateTimePicker
                value={fromEpoch(formik.values.end_attendee_voting_period_date)}
                onChange={(val) =>
                  formik.setFieldValue(
                    "end_attendee_voting_period_date",
                    toEpoch(val)
                  )
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography
                variant="body2"
                component="label"
                htmlFor="max_attendee_votes"
              >
                {T.translate("edit_event_category_group.max_attendee_votes")}
              </Typography>
              <MuiFormikTextField
                variant="outlined"
                name="max_attendee_votes"
                id="max_attendee_votes"
                type="number"
                size="small"
                margin="none"
                fullWidth
              />
            </Grid2>

            {showSubmissionFields && (
              <>
                <Grid2 size={4}>
                  <Typography variant="body2" component="label">
                    {T.translate(
                      "edit_event_category_group.submission_begin_date"
                    )}
                  </Typography>
                  <DateTimePicker
                    value={fromEpoch(formik.values.submission_begin_date)}
                    onChange={(val) =>
                      formik.setFieldValue(
                        "submission_begin_date",
                        toEpoch(val)
                      )
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </Grid2>
                <Grid2 size={4}>
                  <Typography variant="body2" component="label">
                    {T.translate(
                      "edit_event_category_group.submission_end_date"
                    )}
                  </Typography>
                  <DateTimePicker
                    value={fromEpoch(formik.values.submission_end_date)}
                    onChange={(val) =>
                      formik.setFieldValue("submission_end_date", toEpoch(val))
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </Grid2>
                <Grid2 size={4}>
                  <Typography
                    variant="body2"
                    component="label"
                    htmlFor="max_submission_allowed_per_user"
                  >
                    {T.translate(
                      "edit_event_category_group.max_submission_allowed_per_user"
                    )}
                  </Typography>
                  <MuiFormikTextField
                    variant="outlined"
                    name="max_submission_allowed_per_user"
                    id="max_submission_allowed_per_user"
                    type="number"
                    margin="none"
                    fullWidth
                  />
                </Grid2>
              </>
            )}

            <Grid2 size={12}>
              <Typography variant="body2" component="label">
                {T.translate("edit_event_category_group.description")}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <TextEditorV3
                  id="description"
                  value={formik.values.description}
                  onChange={(ev) =>
                    formik.setFieldValue("description", ev.target.value)
                  }
                  license={process.env.JODIT_LICENSE_KEY}
                />
              </Box>
            </Grid2>

            {!isNew && (
              <>
                <Grid2 size={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {T.translate("edit_event_category_group.tracks")}
                  </Typography>
                  <Grid2
                    container
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ mb: 1 }}
                  >
                    <Grid2 size="grow">
                      <FormikProvider value={trackSearchFormik}>
                        <MuiFormikAsyncAutocomplete
                          name="track"
                          placeholder={T.translate(
                            "edit_event_category_group.placeholders.search_categories"
                          )}
                          queryFunction={queryTrackOptions}
                          formatOption={(track) => ({
                            value: track.id,
                            label: track.name,
                            raw: track
                          })}
                        />
                      </FormikProvider>
                    </Grid2>
                    <Grid2>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!trackSearchFormik.values.track}
                        onClick={handleAddTrack}
                      >
                        {T.translate("general.add")}
                      </Button>
                    </Grid2>
                  </Grid2>
                  <MuiTable
                    columns={tracksColumns}
                    data={paginatedTracks}
                    totalRows={tracks.length}
                    perPage={trackState.perPage}
                    currentPage={trackState.page}
                    onPageChange={(page) =>
                      setTrackState((prev) => ({ ...prev, page }))
                    }
                    onPerPageChange={(n) => {
                      setTrackState((prev) => ({
                        ...prev,
                        perPage: parseInt(n, 10),
                        page: 1
                      }));
                    }}
                    onDelete={handleTrackDelete}
                    getName={(row) => row.name}
                    deleteDialogBody={T.translate(
                      "edit_event_category_group.unlink_track_warning"
                    )}
                  />
                </Grid2>

                {showAllowedGroups && (
                  <Grid2 size={12}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {T.translate("edit_event_category_group.allowed_groups")}
                    </Typography>
                    <Grid2
                      container
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ mb: 1 }}
                    >
                      <Grid2 size="grow">
                        <FormikProvider value={groupSearchFormik}>
                          <MuiFormikAsyncAutocomplete
                            name="group"
                            placeholder={T.translate(
                              "edit_event_category_group.placeholders.search_groups"
                            )}
                            queryFunction={queryGroups}
                            formatOption={(group) => ({
                              value: group.id,
                              label: group.title,
                              raw: group
                            })}
                          />
                        </FormikProvider>
                      </Grid2>
                      <Grid2>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={!groupSearchFormik.values.group}
                          onClick={handleAddGroup}
                        >
                          {T.translate("general.add")}
                        </Button>
                      </Grid2>
                    </Grid2>
                    <MuiTable
                      columns={allowedGroupsColumns}
                      data={paginatedGroups}
                      totalRows={allowedGroups.length}
                      perPage={groupState.perPage}
                      currentPage={groupState.page}
                      onPageChange={(page) =>
                        setGroupState((prev) => ({ ...prev, page }))
                      }
                      onPerPageChange={(n) => {
                        setGroupState((prev) => ({
                          ...prev,
                          perPage: parseInt(n, 10),
                          page: 1
                        }));
                      }}
                      onDelete={handleAllowedGroupDelete}
                      getName={(row) => row.title}
                    />
                  </Grid2>
                )}
              </>
            )}
          </Grid2>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {T.translate("general.save")}
            </Button>
          </Box>
        </Box>
      </FormikProvider>
    </LocalizationProvider>
  );
};

EventCategoryGroupForm.propTypes = {
  entity: PropTypes.shape({}),
  allClasses: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  currentSummit: PropTypes.shape({}).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onTrackLink: PropTypes.func,
  onTrackUnLink: PropTypes.func,
  onAllowedGroupLink: PropTypes.func,
  onAllowedGroupUnLink: PropTypes.func
};

EventCategoryGroupForm.defaultProps = {
  entity: null,
  onTrackLink: () => {},
  onTrackUnLink: () => {},
  onAllowedGroupLink: () => {},
  onAllowedGroupUnLink: () => {}
};

export default EventCategoryGroupForm;
