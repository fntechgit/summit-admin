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
import Box from "@mui/material/Box";
import { Grid2 } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import useScrollToError from "../../hooks/useScrollToError";
import MuiFormikColorField from "../mui/formik-inputs/mui-formik-color-field";
import {
  MARKETING_SETTING_TYPE_FILE,
  MARKETING_SETTING_TYPE_HEX_COLOR,
  MARKETING_SETTING_TYPE_TEXT,
  MARKETING_SETTING_TYPE_TEXTAREA
} from "../../utils/constants";

const settingTypesDdl = [
  { label: "Plain Text", value: MARKETING_SETTING_TYPE_TEXT },
  { label: "Html", value: MARKETING_SETTING_TYPE_TEXTAREA },
  { label: "File", value: MARKETING_SETTING_TYPE_FILE },
  { label: "Hex Color", value: MARKETING_SETTING_TYPE_HEX_COLOR }
];

const MarketingSettingForm = ({ onDeleteImage }) => {
  const formik = useFormikContext();
  const { values, errors, touched, submitCount, setFieldValue, setValues } =
    formik;

  useScrollToError(formik, true);

  const handleFieldChange = (ev) => {
    setFieldValue(ev.target.id, ev.target.value);
  };

  const handleUploadFile = (file) => {
    // Batch both updates - two sequential setFieldValue calls each trigger
    // their own synchronous re-render on React 16 (no auto-batching outside
    // synthetic events), so UploadInput's value prop would briefly be the
    // raw File object (file_preview not yet set) and crash on value.split().
    setValues({ ...values, file, file_preview: file.preview });
  };

  const handleRemoveFile = () => {
    setValues({ ...values, file: "", file_preview: "" });

    if (values.id) {
      onDeleteImage(values.id).then(() => {
        setFieldValue("id", 0);
      });
    }
  };

  const valueError = touched.value && errors.value;
  const fileError = submitCount > 0 && errors.file_preview;

  return (
    <Box>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="type">{T.translate("marketing.type")} *</label>
          <MuiFormikSelect
            name="type"
            fullWidth
            size="small"
            displayEmpty
            disabled={values.id !== 0}
            renderValue={(selected) =>
              selected
                ? settingTypesDdl.find((opt) => opt.value === selected)?.label
                : T.translate("marketing.placeholders.select_type")
            }
          >
            {settingTypesDdl.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MuiFormikSelect>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="key">{T.translate("marketing.key")} *</label>
          <MuiFormikTextField name="key" margin="none" fullWidth size="small" />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="selection_plan_id">
            {T.translate("marketing.selection_plan")}
          </label>
          <MuiFormikTextField
            name="selection_plan_id"
            margin="none"
            fullWidth
            size="small"
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        {values.type === MARKETING_SETTING_TYPE_TEXT && (
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label htmlFor="value">
              {T.translate("marketing.plain_text")} *
            </label>
            <MuiFormikTextField
              name="value"
              margin="none"
              fullWidth
              size="small"
            />
          </Grid2>
        )}
        {values.type === MARKETING_SETTING_TYPE_TEXTAREA && (
          <Grid2 size={12}>
            <label htmlFor="value">{T.translate("marketing.html")} *</label>
            <TextEditorV3
              id="value"
              value={values.value}
              onChange={handleFieldChange}
              error={valueError}
              license={process.env.JODIT_LICENSE_KEY}
            />
          </Grid2>
        )}
        {values.type === MARKETING_SETTING_TYPE_FILE && (
          <Grid2 size={12}>
            <label htmlFor="file">{T.translate("marketing.file")} *</label>
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
                value={values.file_preview || values.file}
                handleUpload={handleUploadFile}
                handleRemove={handleRemoveFile}
                className="dropzone"
                multiple={false}
              />
              {fileError && <FormHelperText error>{fileError}</FormHelperText>}
            </Box>
          </Grid2>
        )}
        {values.type === MARKETING_SETTING_TYPE_HEX_COLOR && (
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label htmlFor="value">
              {T.translate("marketing.hex_color")} *
            </label>
            <MuiFormikColorField name="value" />
          </Grid2>
        )}
      </Grid2>
    </Box>
  );
};

MarketingSettingForm.propTypes = {
  onDeleteImage: PropTypes.func.isRequired
};

export default MarketingSettingForm;
