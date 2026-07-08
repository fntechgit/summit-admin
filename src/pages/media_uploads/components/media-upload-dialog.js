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

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
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
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import MuiFormikFilesizeField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/file-size-field";
import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikSelect from "../../../components/mui/formik-inputs/mui-formik-select";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import { positiveNumberValidation } from "../../../utils/yup";

const NUMERIC_FIELDS = [
  "max_size",
  "min_uploads_qty",
  "max_uploads_qty",
  "temporary_links_public_storage_ttl"
];

const PRIVATE_STORAGE_DDL = [
  { value: "None", label: "None" },
  { value: "DropBox", label: "DropBox" },
  { value: "Local", label: "Local" }
];

const MediaUploadDialog = ({
  currentSummit,
  entity,
  errors,
  mediaFileTypes,
  onClose,
  onSave
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const publicStorageDdl = [
    { value: "None", label: "None" },
    { value: "Local", label: "Local" }
  ];

  if (window.PUBLIC_STORAGES.includes("S3"))
    publicStorageDdl.push({ value: "S3", label: "S3" });

  if (window.PUBLIC_STORAGES.includes("SWIFT"))
    publicStorageDdl.push({ value: "Swift", label: "Swift" });

  const presentationTypeOptions = currentSummit.event_types
    .filter((t) => t.class_name === "PresentationType")
    .map((t) => ({ id: t.id, name: t.name }));

  const mediaFileTypesDdl = mediaFileTypes.map((mft) => ({
    value: mft.id,
    label: mft.name
  }));

  const handleSubmit = (values) => {
    if (isSaving) return Promise.resolve();
    const normalizedValues = { ...values };
    NUMERIC_FIELDS.forEach((field) => {
      const parsed = parseInt(values[field], 10);
      // A cleared/non-numeric field must never serialize as NaN.
      normalizedValues[field] = Number.isNaN(parsed) ? 0 : parsed;
    });

    setIsSaving(true);
    return Promise.resolve(onSave(normalizedValues))
      .then(() => onClose())
      .catch(() => {
        // keep dialog open on save error to preserve user input
      })
      .finally(() => setIsSaving(false));
  };

  const formik = useFormik({
    initialValues: entity,
    validationSchema: yup.object().shape({
      name: yup.string().required(T.translate("validation.required")),
      max_size: positiveNumberValidation(),
      min_uploads_qty: positiveNumberValidation(),
      max_uploads_qty: positiveNumberValidation(),
      temporary_links_public_storage_ttl: positiveNumberValidation()
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

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const isEdit = Boolean(entity.id);
  const title = `${T.translate(
    isEdit ? "general.edit" : "general.add"
  )} ${T.translate("media_upload.media_upload")}`;

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
          id="media-upload-form"
          component="form"
          onSubmit={formik.handleSubmit}
        >
          <DialogContent>
            <Grid2 container spacing={2} sx={{ mb: 2 }}>
              <Grid2 size={12}>
                <InputLabel htmlFor="name">
                  {T.translate("media_upload.name")} *
                </InputLabel>
                <MuiFormikTextField name="name" margin="none" fullWidth />
              </Grid2>
            </Grid2>

            <Grid2 container spacing={2} sx={{ mb: 2 }}>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <InputLabel htmlFor="max_size">
                  {T.translate("media_upload.max_size")} *
                </InputLabel>
                <MuiFormikFilesizeField
                  name="max_size"
                  valueUnit="KB"
                  displayUnit="KB"
                  margin="none"
                  fullWidth
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <InputLabel htmlFor="min_uploads_qty">
                  {T.translate("media_upload.min_qty")}
                </InputLabel>
                <MuiFormikTextField
                  name="min_uploads_qty"
                  type="number"
                  margin="none"
                  fullWidth
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <InputLabel
                  htmlFor="max_uploads_qty"
                  title={T.translate("media_upload.max_qty_hint")}
                >
                  {T.translate("media_upload.max_qty")}
                </InputLabel>
                <MuiFormikTextField
                  name="max_uploads_qty"
                  type="number"
                  margin="none"
                  fullWidth
                />
              </Grid2>
            </Grid2>

            <Grid2 container spacing={2} sx={{ mb: 2 }}>
              <Grid2 size={12}>
                <InputLabel htmlFor="description">
                  {T.translate("media_upload.description")}
                </InputLabel>
                <FormikTextEditor name="description" maxLength={5120} />
              </Grid2>
            </Grid2>

            <Divider sx={{ mb: 2 }} />

            <Grid2 container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <InputLabel htmlFor="type_id">
                  {T.translate("media_upload.type")}
                </InputLabel>
                <MuiFormikSelect
                  name="type_id"
                  placeholder={T.translate(
                    "media_upload.placeholders.select_type"
                  )}
                >
                  {mediaFileTypesDdl.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }} sx={{ mt: "8px" }}>
                <MuiFormikCheckbox
                  name="is_editable"
                  label={T.translate("media_upload.is_editable")}
                />
              </Grid2>
            </Grid2>

            <Divider sx={{ mb: 2 }} />

            <Grid2 container spacing={2} sx={{ mb: 2 }}>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <InputLabel htmlFor="private_storage_type">
                  {T.translate("media_upload.private_storage_type")}
                </InputLabel>
                <MuiFormikSelect
                  name="private_storage_type"
                  placeholder={T.translate(
                    "media_upload.placeholders.select_private_storage"
                  )}
                >
                  {PRIVATE_STORAGE_DDL.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <InputLabel htmlFor="public_storage_type">
                  {T.translate("media_upload.public_storage_type")}
                </InputLabel>
                <MuiFormikSelect
                  name="public_storage_type"
                  placeholder={T.translate(
                    "media_upload.placeholders.select_public_storage"
                  )}
                >
                  {publicStorageDdl.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }} sx={{ mt: "8px" }}>
                <MuiFormikCheckbox
                  name="use_temporary_links_on_public_storage"
                  label={T.translate(
                    "media_upload.use_temporary_links_on_public_storage"
                  )}
                />
              </Grid2>
            </Grid2>

            {values.use_temporary_links_on_public_storage && (
              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <InputLabel htmlFor="temporary_links_public_storage_ttl">
                    {T.translate(
                      "media_upload.temporary_links_public_storage_ttl_info"
                    )}
                  </InputLabel>
                  <MuiFormikTextField
                    name="temporary_links_public_storage_ttl"
                    type="number"
                    margin="none"
                    fullWidth
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {T.translate("media_upload.minutes")}
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Grid2>
              </Grid2>
            )}

            <Divider sx={{ mb: 2 }} />

            <Grid2 container spacing={2}>
              <Grid2 size={12}>
                <Autocomplete
                  multiple
                  size="small"
                  options={presentationTypeOptions}
                  value={presentationTypeOptions.filter((opt) =>
                    values.presentation_types.includes(opt.id)
                  )}
                  getOptionLabel={(opt) => opt.name ?? ""}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  onChange={(_, selected) =>
                    setFieldValue(
                      "presentation_types",
                      selected.map((opt) => opt.id)
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...params}
                      label={T.translate("media_upload.presentation_types")}
                    />
                  )}
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              form="media-upload-form"
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

MediaUploadDialog.propTypes = {
  currentSummit: PropTypes.shape({
    event_types: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  entity: PropTypes.shape({
    id: PropTypes.number,
    presentation_types: PropTypes.arrayOf(PropTypes.number)
  }).isRequired,
  errors: PropTypes.shape({}),
  mediaFileTypes: PropTypes.arrayOf(PropTypes.shape({})),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

MediaUploadDialog.defaultProps = {
  errors: {},
  mediaFileTypes: []
};

export default MediaUploadDialog;
