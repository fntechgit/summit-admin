/**
 * Copyright 2024 OpenStack Foundation
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
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid2,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ClearIcon from "@mui/icons-material/Clear";
import { queryMembers } from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiFormikAsyncAutocomplete from "../../../components/mui/formik-inputs/mui-formik-async-select";
import useScrollToError from "../../../hooks/useScrollToError";

const formatMemberOption = (m) => ({
  value: m.id,
  label: m.email
    ? `${m.first_name} ${m.last_name} (${m.email})`
    : `${m.first_name} ${m.last_name} (${m.id})`
});

const toMemberOption = (member) => {
  if (!member) return null;
  return formatMemberOption(member);
};

const TrackChairDialog = ({ entity, tracks, onSave, onClose }) => {
  const formik = useFormik({
    initialValues: {
      id: entity?.id ?? 0,
      member: toMemberOption(entity?.member ?? null),
      trackIds: entity?.trackIds ?? []
    },
    enableReinitialize: true,
    validationSchema: yup.object().shape({
      member: yup
        .object()
        .nullable()
        .required(T.translate("validation.required")),
      trackIds: yup
        .array()
        .min(1, T.translate("validation.required"))
        .required(T.translate("validation.required"))
    }),
    onSubmit: (values) => onSave(values)
  });

  useScrollToError(formik, true);

  const title = entity?.id
    ? `${T.translate("general.edit")} ${T.translate(
        "track_chairs.track_chair"
      )}`
    : T.translate("track_chairs.add");

  const tracks_ddl = tracks.map((t) => ({ label: t.name, value: t.id }));

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">{title}</Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ mr: 1 }}
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
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={12}>
                <InputLabel>
                  {T.translate("track_chairs.placeholders.select_track_chair")}{" "}
                  *
                </InputLabel>
                <MuiFormikAsyncAutocomplete
                  name="member"
                  queryFunction={queryMembers}
                  formatOption={formatMemberOption}
                  placeholder={T.translate(
                    "track_chairs.placeholders.select_track_chair"
                  )}
                />
              </Grid2>
              <Grid2 size={12}>
                <InputLabel htmlFor="trackIds">
                  {T.translate("track_chairs.track")} *
                </InputLabel>
                <FormControl
                  fullWidth
                  error={
                    formik.touched.trackIds && Boolean(formik.errors.trackIds)
                  }
                >
                  <Select
                    id="trackIds"
                    multiple
                    value={formik.values.trackIds}
                    onChange={(ev) =>
                      formik.setFieldValue("trackIds", ev.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("trackIds", true)}
                    displayEmpty
                    renderValue={(selected) =>
                      selected.length === 0 ? (
                        <span style={{ color: "#aaa" }}>
                          {T.translate(
                            "track_chairs.placeholders.select_track"
                          )}
                        </span>
                      ) : (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((id) => {
                            const track = tracks_ddl.find(
                              (t) => t.value === id
                            );
                            return track ? (
                              <Chip
                                key={id}
                                label={track.label}
                                size="small"
                                onDelete={() =>
                                  formik.setFieldValue(
                                    "trackIds",
                                    formik.values.trackIds.filter(
                                      (v) => v !== id
                                    )
                                  )
                                }
                                deleteIcon={
                                  <ClearIcon
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                }
                              />
                            ) : null;
                          })}
                        </Box>
                      )
                    }
                  >
                    {tracks_ddl.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        <Checkbox
                          checked={formik.values.trackIds.includes(t.value)}
                        />
                        <ListItemText primary={t.label} />
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.trackIds && formik.errors.trackIds && (
                    <FormHelperText>{formik.errors.trackIds}</FormHelperText>
                  )}
                </FormControl>
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

TrackChairDialog.propTypes = {
  entity: PropTypes.object,
  tracks: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default TrackChairDialog;
