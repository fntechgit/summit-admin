/**
 * Copyright 2021 OpenStack Foundation
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
import { Box, Grid2, InputLabel } from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import FormikTextEditor from "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor";
import UploadInputV3 from "openstack-uicore-foundation/lib/components/inputs/upload-input-v3";
import useScrollToError from "../../hooks/useScrollToError";
import { KB, MAX_BADGE_FEATURE_IMAGE_UPLOAD_SIZE } from "../../utils/constants";

// image is a URL string when read back from the API, or a pending File API dto after upload
const getImageValue = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [{ filename: value, file_url: value }];
  return [{ filename: value.filename, file_url: value.filepath }];
};

const BadgeFeatureTypeForm = ({ entity, onRemoveImage }) => {
  const formik = useFormikContext();

  useScrollToError(formik, true);

  const handleUploadComplete = (response) => {
    const path =
      response.path && response.name
        ? `${response.path}${response.name}`
        : response.file_url ?? response.path ?? "";
    const image = { ...response, filepath: path, filename: response.name };
    delete image.path;
    delete image.name;
    formik.setFieldValue("image", image);
  };

  const handleRemoveImage = () => {
    const prevValue = formik.values.image;
    formik.setFieldValue("image", null);
    // only hit the API when an image was already persisted; a pending dto just clears
    if (entity.id && typeof prevValue === "string")
      onRemoveImage(entity.id).catch(() =>
        formik.setFieldValue("image", prevValue)
      );
  };

  return (
    <Box>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <InputLabel htmlFor="name">
            {T.translate("edit_badge_feature.name")} *
          </InputLabel>
          <MuiFormikTextField
            name="name"
            margin="none"
            fullWidth
            size="small"
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <InputLabel htmlFor="description">
            {T.translate("edit_badge_feature.description")} *
          </InputLabel>
          <FormikTextEditor
            name="description"
            licence={process.env.JODIT_LICENSE_KEY}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <InputLabel htmlFor="template_content">
            {T.translate("edit_badge_feature.template_content")} *
          </InputLabel>
          <FormikTextEditor
            name="template_content"
            licence={process.env.JODIT_LICENSE_KEY}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <InputLabel>{T.translate("edit_badge_feature.image")}</InputLabel>
          <UploadInputV3
            id="image"
            name="image"
            value={getImageValue(formik.values.image)}
            onUploadComplete={handleUploadComplete}
            onRemove={handleRemoveImage}
            postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
            djsConfig={{ withCredentials: true }}
            maxFiles={1}
            canAdd={!formik.values.image}
            mediaType={{
              max_size: MAX_BADGE_FEATURE_IMAGE_UPLOAD_SIZE * KB,
              type: {
                allowed_extensions: ["png", "jpg", "jpeg", "gif", "svg"]
              }
            }}
          />
        </Grid2>
      </Grid2>
    </Box>
  );
};

BadgeFeatureTypeForm.propTypes = {
  entity: PropTypes.object.isRequired,
  onRemoveImage: PropTypes.func.isRequired
};

export default BadgeFeatureTypeForm;
