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

import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
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
import MuiFormikColorInput from "../../../components/mui/formik-inputs/mui-formik-color-input";
import useScrollToError from "../../../hooks/useScrollToError";
import { requiredStringValidation } from "../../../utils/yup";
import { DEBOUNCE_WAIT_250 } from "../../../utils/constants";

const DEFAULT_PER_PAGE = 10;

const EventCategoryGroupDialog = ({
  entity: initialEntity,
  allClasses,
  currentSummit,
  onClose,
  onSave,
  onTrackLink,
  onTrackUnLink,
  onAllowedGroupLink,
  onAllowedGroupUnLink
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [trackState, setTrackState] = useState({
    input: "",
    options: [],
    loading: false,
    selected: null,
    page: 1,
    perPage: DEFAULT_PER_PAGE
  });
  const [groupState, setGroupState] = useState({
    input: "",
    options: [],
    loading: false,
    selected: null,
    page: 1,
    perPage: DEFAULT_PER_PAGE
  });

  const isNew = !initialEntity?.id;

  useEffect(() => {
    if (!trackState.input) {
      setTrackState((prev) => ({ ...prev, options: [] }));
      return undefined;
    }
    setTrackState((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(() => {
      const excludedIds = initialEntity?.tracks?.map((t) => t.id) ?? [];
      queryTracks(
        currentSummit.id,
        trackState.input,
        (results) => {
          setTrackState((prev) => ({
            ...prev,
            options: results,
            loading: false
          }));
        },
        excludedIds
      );
    }, DEBOUNCE_WAIT_250);
    return () => clearTimeout(timer);
  }, [trackState.input]);

  useEffect(() => {
    if (!groupState.input) {
      setGroupState((prev) => ({ ...prev, options: [] }));
      return undefined;
    }
    setGroupState((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(() => {
      queryGroups(groupState.input, (results) => {
        setGroupState((prev) => ({
          ...prev,
          options: results,
          loading: false
        }));
      });
    }, DEBOUNCE_WAIT_250);
    return () => clearTimeout(timer);
  }, [groupState.input]);

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
      Promise.resolve(onSave(values))
        .then(() => {
          setIsSaving(false);
          onClose();
        })
        .catch(() => {
          setIsSaving(false);
        });
    }
  });

  useScrollToError(formik);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

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
    if (!trackState.selected) return;
    onTrackLink(initialEntity.id, trackState.selected);
    setTrackState((prev) => ({
      ...prev,
      selected: null,
      input: "",
      options: []
    }));
  };

  const handleTrackDelete = (trackId) => {
    onTrackUnLink(initialEntity.id, trackId);
  };

  const handleAddGroup = () => {
    if (!groupState.selected) return;
    onAllowedGroupLink(initialEntity.id, groupState.selected);
    setGroupState((prev) => ({
      ...prev,
      selected: null,
      input: "",
      options: []
    }));
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

  const title = isNew
    ? `${T.translate("general.add")} ${T.translate(
        "edit_event_category_group.event_category_group"
      )}`
    : `${T.translate("general.edit")} ${T.translate(
        "edit_event_category_group.event_category_group"
      )}`;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog
        open
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={isSaving}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          {title}
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ mr: 1 }}
            disabled={isSaving}
            aria-label="close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <FormikProvider value={formik}>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            noValidate
            autoComplete="off"
          >
            <DialogContent sx={{ p: 0 }}>
              <Grid2
                container
                spacing={2}
                alignItems="flex-start"
                sx={{ p: 3 }}
              >
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
                  <MuiFormikColorInput name="color" size="small" fullWidth />
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
                    value={fromEpoch(
                      formik.values.end_attendee_voting_period_date
                    )}
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
                    {T.translate(
                      "edit_event_category_group.max_attendee_votes"
                    )}
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
                          formik.setFieldValue(
                            "submission_end_date",
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
                          <Autocomplete
                            size="small"
                            fullWidth
                            options={trackState.options}
                            getOptionLabel={(option) => option.name || ""}
                            isOptionEqualToValue={(option, value) =>
                              option.id === value.id
                            }
                            loading={trackState.loading}
                            value={trackState.selected}
                            onChange={(_, track) =>
                              setTrackState((prev) => ({
                                ...prev,
                                selected: track
                              }))
                            }
                            onInputChange={(_, val, reason) => {
                              if (reason === "input")
                                setTrackState((prev) => ({
                                  ...prev,
                                  input: val
                                }));
                              if (reason === "clear") {
                                setTrackState((prev) => ({
                                  ...prev,
                                  selected: null,
                                  input: "",
                                  options: []
                                }));
                              }
                            }}
                            filterOptions={(x) => x}
                            renderInput={(params) => (
                              /* eslint-disable-next-line react/jsx-props-no-spreading */
                              <TextField
                                {...params}
                                size="small"
                                placeholder={T.translate(
                                  "edit_event_category_group.placeholders.search_categories"
                                )}
                                slotProps={{
                                  input: {
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {trackState.loading && (
                                          <CircularProgress
                                            color="inherit"
                                            size={16}
                                          />
                                        )}
                                        {params.InputProps.endAdornment}
                                      </>
                                    )
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid2>
                        <Grid2>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={!trackState.selected}
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
                          {T.translate(
                            "edit_event_category_group.allowed_groups"
                          )}
                        </Typography>
                        <Grid2
                          container
                          spacing={1}
                          alignItems="flex-start"
                          sx={{ mb: 1 }}
                        >
                          <Grid2 size="grow">
                            <Autocomplete
                              size="small"
                              fullWidth
                              options={groupState.options}
                              getOptionLabel={(option) => option.title || ""}
                              isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                              }
                              loading={groupState.loading}
                              value={groupState.selected}
                              onChange={(_, group) =>
                                setGroupState((prev) => ({
                                  ...prev,
                                  selected: group
                                }))
                              }
                              onInputChange={(_, val, reason) => {
                                if (reason === "input")
                                  setGroupState((prev) => ({
                                    ...prev,
                                    input: val
                                  }));
                                if (reason === "clear") {
                                  setGroupState((prev) => ({
                                    ...prev,
                                    selected: null,
                                    input: "",
                                    options: []
                                  }));
                                }
                              }}
                              filterOptions={(x) => x}
                              renderInput={(params) => (
                                /* eslint-disable-next-line react/jsx-props-no-spreading */
                                <TextField
                                  {...params}
                                  size="small"
                                  placeholder={T.translate(
                                    "edit_event_category_group.placeholders.search_groups"
                                  )}
                                  slotProps={{
                                    input: {
                                      ...params.InputProps,
                                      endAdornment: (
                                        <>
                                          {groupState.loading && (
                                            <CircularProgress
                                              color="inherit"
                                              size={16}
                                            />
                                          )}
                                          {params.InputProps.endAdornment}
                                        </>
                                      )
                                    }
                                  }}
                                />
                              )}
                            />
                          </Grid2>
                          <Grid2>
                            <Button
                              variant="contained"
                              size="small"
                              disabled={!groupState.selected}
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
            </DialogContent>
            <Divider />
            <DialogActions>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSaving}
              >
                {T.translate("general.save")}
              </Button>
            </DialogActions>
          </Box>
        </FormikProvider>
      </Dialog>
    </LocalizationProvider>
  );
};

EventCategoryGroupDialog.propTypes = {
  entity: PropTypes.shape({}),
  allClasses: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  currentSummit: PropTypes.shape({}).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onTrackLink: PropTypes.func,
  onTrackUnLink: PropTypes.func,
  onAllowedGroupLink: PropTypes.func,
  onAllowedGroupUnLink: PropTypes.func
};

EventCategoryGroupDialog.defaultProps = {
  entity: null,
  onTrackLink: () => {},
  onTrackUnLink: () => {},
  onAllowedGroupLink: () => {},
  onAllowedGroupUnLink: () => {}
};

export default EventCategoryGroupDialog;
