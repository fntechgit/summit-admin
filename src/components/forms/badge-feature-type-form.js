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
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import useScrollToError from "../../hooks/useScrollToError";

const BadgeFeatureTypeForm = ({ entity, onUploadImage, onRemoveImage }) => {
  const formik = useFormikContext();

  useScrollToError(formik, true);

  const handleUploadImage = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    onUploadImage(entity, formData);
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

      {/* image endpoint needs an existing id, so upload is only offered after the first save */}
      {entity.id !== 0 && (
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <InputLabel>{T.translate("edit_badge_feature.image")}</InputLabel>
            {/* need this styles to adapt bootstrap to MUI */}
            <Box
              sx={{
                "& .file-upload": {
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start"
                },
                "& .file-upload > :first-of-type": { flex: 1 },
                "& .selected-files-box": { flex: "0 0 auto", maxWidth: "50%" }
              }}
            >
              <UploadInput
                value={entity.image}
                handleUpload={handleUploadImage}
                handleRemove={() => onRemoveImage(entity.id)}
                className="dropzone"
                multiple={false}
                accept="image/*"
              />
            </Box>
          </Grid2>
        </Grid2>
      )}
    </Box>
  );
};

BadgeFeatureTypeForm.propTypes = {
  entity: PropTypes.object.isRequired,
  onUploadImage: PropTypes.func.isRequired,
  onRemoveImage: PropTypes.func.isRequired
};

export default BadgeFeatureTypeForm;
