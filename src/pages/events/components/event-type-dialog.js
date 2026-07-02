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

import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { queryTicketTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import { MuiColorInput } from "mui-color-input";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikAsyncAutocomplete from "../../../components/mui/formik-inputs/mui-formik-async-select";
import MuiFormikSelect from "../../../components/mui/formik-inputs/mui-formik-select";
import { positiveNumberValidation } from "../../../utils/yup";
import { HUNDRED_PER_PAGE } from "../../../utils/constants";

const NUMERIC_FIELDS = [
  "min_speakers",
  "max_speakers",
  "min_moderators",
  "max_moderators",
  "min_duration",
  "max_duration"
];

const ColorPickerField = React.memo(({ initialValue, onChange, error }) => {
  const [value, setValue] = useState(initialValue || "");

  const handleChange = (newValue) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <MuiColorInput
      value={value}
      format="hex"
      margin="none"
      fullWidth
      onChange={handleChange}
      error={!!error}
      helperText={error || undefined}
    />
  );
});

ColorPickerField.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string
};

ColorPickerField.defaultProps = {
  initialValue: "",
  error: ""
};

const toFormikTicketType = (tt) => ({ value: String(tt.id), label: tt.name });

const buildInitialValues = (entity) => ({
  ...entity,
  allowed_ticket_types: (entity.allowed_ticket_types || []).map(
    toFormikTicketType
  )
});

const EventTypeDialog = ({
  currentSummit,
  entity,
  errors,
  onClose,
  onSave,
  getMediaUploads,
  onMediaUploadLink,
  onMediaUploadUnLink
}) => {
  const [activeTab, setActiveTab] = useState("main");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMediaUpload, setSelectedMediaUpload] = useState(null);
  const [mediaUploadOptions, setMediaUploadOptions] = useState([]);

  const colorRef = useRef(entity?.color || "");

  const classNameDdl = [
    {
      label: T.translate("edit_event_type.class_presentation_type"),
      value: "PRESENTATION_TYPE"
    },
    {
      label: T.translate("edit_event_type.class_event_type"),
      value: "EVENT_TYPE"
    }
  ];

  const blackoutTimesDdl = [
    {
      label: T.translate("edit_event_type.blackout_time_final"),
      value: "Final"
    },
    {
      label: T.translate("edit_event_type.blackout_time_proposed"),
      value: "Proposed"
    },
    { label: T.translate("edit_event_type.blackout_time_all"), value: "All" },
    {
      label: T.translate("edit_event_type.blackout_time_none"),
      value: "None"
    }
  ];

  const mediaUploadColumns = [
    { columnKey: "name", header: T.translate("general.name") },
    { columnKey: "type_name", header: T.translate("general.type") },
    {
      columnKey: "mandatory_text",
      header: T.translate("media_upload.is_mandatory")
    },
    {
      columnKey: "max_size",
      header: T.translate("media_upload.max_size_simple")
    }
  ];

  const handleSubmit = (values) => {
    if (isSaving) return Promise.resolve();
    const normalizedValues = { ...values, color: colorRef.current };
    NUMERIC_FIELDS.forEach((field) => {
      const parsed = parseInt(values[field], 10);
      // A cleared/non-numeric field must never serialize as NaN -> null.
      normalizedValues[field] = Number.isNaN(parsed) ? 0 : parsed;
    });
    normalizedValues.allowed_ticket_types = values.allowed_ticket_types.map(
      (tt) => ({ id: parseInt(tt.value, 10), name: tt.label })
    );

    setIsSaving(true);
    return Promise.resolve(onSave(normalizedValues))
      .then(() => onClose())
      .catch(() => {
        // keep dialog open on save error to preserve user input
      })
      .finally(() => setIsSaving(false));
  };

  const formik = useFormik({
    initialValues: buildInitialValues(entity),
    validationSchema: yup.object().shape({
      name: yup.string().required(T.translate("validation.required")),
      class_name: yup.string().required(T.translate("validation.required")),
      min_speakers: positiveNumberValidation(),
      max_speakers: positiveNumberValidation(),
      min_moderators: positiveNumberValidation(),
      max_moderators: positiveNumberValidation(),
      min_duration: positiveNumberValidation(),
      max_duration: positiveNumberValidation()
    }),
    onSubmit: handleSubmit
  });

  const { values, setFieldValue } = formik;

  useScrollToError(formik, true);

  useEffect(() => {
    const errorFields = Object.keys(errors || {});
    formik.setErrors(errorFields.length > 0 ? errors : {});
    if (errorFields.length > 0) {
      formik.setTouched(
        errorFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      );
    }
  }, [errors]);

  // Sync sub-resource array from Redux (link/unlink dispatches update it directly)
  // without resetting other user-edited fields.
  useEffect(() => {
    setFieldValue(
      "allowed_media_upload_types",
      entity.allowed_media_upload_types ?? []
    );
  }, [entity.allowed_media_upload_types]);

  const handleColorChange = useCallback((newValue) => {
    colorRef.current = newValue;
  }, []);

  const handleShowAlwaysChange = (ev) => {
    const { checked } = ev.target;
    if (checked) setFieldValue("allowed_ticket_types", []);
    setFieldValue("show_always_on_schedule", checked);
  };

  const handleAddMediaUpload = () => {
    if (!selectedMediaUpload) return;
    onMediaUploadLink(selectedMediaUpload, values.id);
    setSelectedMediaUpload(null);
    setMediaUploadOptions([]);
  };

  const handleDeleteMediaUpload = (mediaUploadId) => {
    onMediaUploadUnLink(mediaUploadId, values.id);
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const isPresentationType = values.class_name === "PRESENTATION_TYPE";
  const isEventType = values.class_name === "EVENT_TYPE";
  const showMediaUploadTypes = isPresentationType && values.id !== 0;

  const isEdit = Boolean(entity.id);
  const title = `${T.translate(
    isEdit ? "general.edit" : "general.add"
  )} ${T.translate("edit_event_type.event_type")}`;

  return (
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
          id="event-type-form"
          component="form"
          onSubmit={formik.handleSubmit}
        >
          <DialogContent>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
                <Tab value="main" label={T.translate("edit_event_type.main")} />
                <Tab
                  value="schedule_settings"
                  label={T.translate("edit_event_type.schedule_settings")}
                />
              </Tabs>
            </Box>

            <div role="tabpanel" hidden={activeTab !== "main"}>
              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <InputLabel htmlFor="class_name">
                    {T.translate("edit_event_type.class")} *
                  </InputLabel>
                  <MuiFormikSelect
                    name="class_name"
                    placeholder={T.translate(
                      "edit_event_type.placeholders.select_class"
                    )}
                    disabled={values.id !== 0}
                  >
                    {classNameDdl.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MuiFormikSelect>
                </Grid2>
                {isEventType && (
                  <Grid2 size={{ xs: 12, md: 4 }} sx={{ mt: "8px" }}>
                    <MuiFormikCheckbox
                      name="allows_attachment"
                      label={T.translate("edit_event_type.allows_attachment")}
                    />
                  </Grid2>
                )}
              </Grid2>

              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <InputLabel htmlFor="name">
                    {T.translate("edit_event_type.name")} *
                  </InputLabel>
                  <MuiFormikTextField name="name" margin="none" fullWidth />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <InputLabel htmlFor="color">
                    {T.translate("edit_event_type.color")}
                  </InputLabel>
                  <ColorPickerField
                    initialValue={entity?.color}
                    onChange={handleColorChange}
                    error={formik.touched.color ? formik.errors.color : ""}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <InputLabel htmlFor="black_out_times">
                    {T.translate("edit_event_type.black_out_times")}
                  </InputLabel>
                  <MuiFormikSelect name="black_out_times">
                    {blackoutTimesDdl.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MuiFormikSelect>
                </Grid2>
              </Grid2>

              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <MuiFormikCheckbox
                    name="use_sponsors"
                    label={T.translate("edit_event_type.use_sponsors")}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <MuiFormikCheckbox
                    name="are_sponsors_mandatory"
                    label={T.translate(
                      "edit_event_type.are_sponsors_mandatory"
                    )}
                  />
                </Grid2>
                {isPresentationType && (
                  <Grid2 size={{ xs: 12, md: 4 }}>
                    <MuiFormikCheckbox
                      name="allows_speaker_event_collision"
                      label={T.translate(
                        "edit_event_type.allows_speaker_event_collision"
                      )}
                    />
                  </Grid2>
                )}
              </Grid2>

              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <MuiFormikCheckbox
                    name="allows_location"
                    label={T.translate("edit_event_type.allows_location")}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <MuiFormikCheckbox
                    name="allows_publishing_dates"
                    label={T.translate(
                      "edit_event_type.allows_publishing_dates"
                    )}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <MuiFormikCheckbox
                    name="allows_location_timeframe_collision"
                    label={T.translate(
                      "edit_event_type.allows_location_timeframe_collision"
                    )}
                  />
                </Grid2>
              </Grid2>

              {isPresentationType && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Grid2 container spacing={2} sx={{ mb: 2 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiFormikCheckbox
                        name="use_speakers"
                        label={T.translate("edit_event_type.use_speakers")}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiFormikCheckbox
                        name="are_speakers_mandatory"
                        label={T.translate(
                          "edit_event_type.are_speakers_mandatory"
                        )}
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={2} sx={{ mb: 2 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel htmlFor="min_speakers">
                        {T.translate("edit_event_type.min_speakers")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="min_speakers"
                        type="number"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel htmlFor="max_speakers">
                        {T.translate("edit_event_type.max_speakers")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="max_speakers"
                        type="number"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                  </Grid2>

                  <Divider sx={{ mb: 2 }} />
                  <Grid2 container spacing={2} sx={{ mb: 2 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiFormikCheckbox
                        name="use_moderator"
                        label={T.translate("edit_event_type.use_moderator")}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiFormikCheckbox
                        name="is_moderator_mandatory"
                        label={T.translate(
                          "edit_event_type.moderator_mandatory"
                        )}
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={2} sx={{ mb: 2 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel htmlFor="moderator_label">
                        {T.translate("edit_event_type.moderator_label")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="moderator_label"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel htmlFor="min_moderators">
                        {T.translate("edit_event_type.min_moderators")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="min_moderators"
                        type="number"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel htmlFor="max_moderators">
                        {T.translate("edit_event_type.max_moderators")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="max_moderators"
                        type="number"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                  </Grid2>

                  <Divider sx={{ mb: 2 }} />
                  <Grid2 container spacing={2} sx={{ mb: 2 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiFormikCheckbox
                        name="allow_custom_ordering"
                        label={T.translate(
                          "edit_event_type.allow_custom_ordering"
                        )}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiFormikCheckbox
                        name="allow_attendee_vote"
                        label={T.translate(
                          "edit_event_type.allow_attendee_vote"
                        )}
                      />
                    </Grid2>
                  </Grid2>

                  <Divider sx={{ mb: 2 }} />
                  <Grid2 container spacing={2} sx={{ mb: 2 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel
                        htmlFor="min_duration"
                        title={T.translate(
                          "edit_event_type.time_restrictions_info"
                        )}
                      >
                        {T.translate("edit_event_type.min_duration")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="min_duration"
                        type="number"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <InputLabel
                        htmlFor="max_duration"
                        title={T.translate(
                          "edit_event_type.time_restrictions_info"
                        )}
                      >
                        {T.translate("edit_event_type.max_duration")}
                      </InputLabel>
                      <MuiFormikTextField
                        name="max_duration"
                        type="number"
                        margin="none"
                        fullWidth
                      />
                    </Grid2>
                  </Grid2>

                  {showMediaUploadTypes && (
                    <>
                      <Divider sx={{ mb: 2 }} />
                      <Grid2
                        container
                        spacing={1}
                        sx={{ mb: 2, alignItems: "center" }}
                      >
                        <Grid2 size={{ xs: 12, md: 6 }}>
                          <Autocomplete
                            size="small"
                            value={selectedMediaUpload}
                            options={mediaUploadOptions.filter(
                              (opt) =>
                                !values.allowed_media_upload_types.some(
                                  (mu) => mu.id === opt.id
                                )
                            )}
                            getOptionLabel={(opt) => opt.name ?? ""}
                            filterOptions={(x) => x}
                            onInputChange={(_, val) => {
                              if (val)
                                getMediaUploads(val, setMediaUploadOptions);
                            }}
                            onChange={(_, val) => setSelectedMediaUpload(val)}
                            renderInput={(params) => (
                              <TextField
                                // eslint-disable-next-line react/jsx-props-no-spreading
                                {...params}
                                label={T.translate(
                                  "edit_event_type.media_upload_types"
                                )}
                              />
                            )}
                          />
                        </Grid2>
                        <Grid2>
                          <Button
                            type="button"
                            variant="outlined"
                            disabled={!selectedMediaUpload}
                            onClick={handleAddMediaUpload}
                          >
                            {T.translate("general.add")}
                          </Button>
                        </Grid2>
                      </Grid2>
                      {values.allowed_media_upload_types?.length > 0 && (
                        <MuiTable
                          columns={mediaUploadColumns}
                          data={values.allowed_media_upload_types}
                          options={{}}
                          onDelete={handleDeleteMediaUpload}
                          confirmButtonColor="error"
                          deleteDialogBody={(name) =>
                            `${T.translate(
                              "general.row_remove_warning"
                            )} ${name}`
                          }
                        />
                      )}
                      <Divider sx={{ mb: 2 }} />
                    </>
                  )}
                </>
              )}
            </div>

            <div role="tabpanel" hidden={activeTab !== "schedule_settings"}>
              <Grid2 container spacing={2}>
                <Grid2 size={12} sx={{ mt: "8px" }}>
                  <MuiFormikCheckbox
                    name="show_always_on_schedule"
                    label={T.translate(
                      "edit_event_type.show_always_on_schedule"
                    )}
                    onChange={handleShowAlwaysChange}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 8 }}>
                  <InputLabel htmlFor="allowed_ticket_types">
                    {T.translate("edit_event_type.allowed_ticket_types")}
                  </InputLabel>
                  <MuiFormikAsyncAutocomplete
                    name="allowed_ticket_types"
                    multiple
                    isMulti
                    disabled={!!values.show_always_on_schedule}
                    placeholder={T.translate(
                      "edit_event_type.placeholders.allowed_ticket_types"
                    )}
                    queryFunction={(input, callback) =>
                      queryTicketTypes(
                        currentSummit.id,
                        { name: input },
                        callback,
                        "v2",
                        HUNDRED_PER_PAGE
                      )
                    }
                    formatOption={(tt) => toFormikTicketType(tt)}
                    formatSelectedValue={(s) => ({
                      value: s.value,
                      label: s.label
                    })}
                  />
                </Grid2>
              </Grid2>
            </div>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              form="event-type-form"
              variant="contained"
              disabled={isSaving}
            >
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

EventTypeDialog.propTypes = {
  currentSummit: PropTypes.shape({ id: PropTypes.number }).isRequired,
  entity: PropTypes.shape({
    id: PropTypes.number,
    color: PropTypes.string,
    allowed_media_upload_types: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  errors: PropTypes.shape({}),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  getMediaUploads: PropTypes.func.isRequired,
  onMediaUploadLink: PropTypes.func.isRequired,
  onMediaUploadUnLink: PropTypes.func.isRequired
};

EventTypeDialog.defaultProps = {
  errors: {}
};

export default EventTypeDialog;
