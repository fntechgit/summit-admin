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
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import useScrollToError from "../../hooks/useScrollToError";

const SummitDocForm = ({
  currentSummit,
  addFileToDoc,
  removeFileFromDoc,
  setFile
}) => {
  const formik = useFormikContext();
  const { values, setFieldValue, setValues } = formik;

  useScrollToError(formik, true);

  const eventTypesDDL = currentSummit.event_types.map((et) => ({
    value: et.id,
    label: et.name
  }));

  const selectionPlansDDL = currentSummit.selection_plans.map((sp) => ({
    value: sp.id,
    label: sp.name
  }));

  const handleShowAlwaysChange = (ev) => {
    const { checked } = ev.target;
    // Update both fields in one call - two sequential setFieldValue calls
    // each trigger their own validation pass against a stale snapshot of
    // the other field, flashing a spurious "required" error on event_types.
    setValues({
      ...values,
      show_always: checked,
      event_types: checked ? [] : values.event_types
    });
  };

  const handleUploadFile = (uploadedFile) => {
    if (values.id) {
      addFileToDoc(values, uploadedFile);
    } else {
      setFieldValue("file_preview", uploadedFile.preview);
      setFile(uploadedFile);
    }
  };

  const handleRemoveFile = () => {
    if (values.id) {
      removeFileFromDoc(values);
    } else {
      setFieldValue("file_preview", "");
      setFile(null);
    }
  };

  return (
    <Box>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <label htmlFor="name">{T.translate("summitdoc.name")} *</label>
          <MuiFormikTextField
            name="name"
            margin="none"
            fullWidth
            size="small"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <label htmlFor="label">{T.translate("summitdoc.label")} *</label>
          <MuiFormikTextField
            name="label"
            margin="none"
            fullWidth
            size="small"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <label htmlFor="event_types">
            {T.translate("summitdoc.event_types")} *{" "}
            <Tooltip title={T.translate("summitdoc.event_types_info")}>
              <InfoOutlinedIcon fontSize="inherit" />
            </Tooltip>
          </label>
          <MuiFormikSelect
            name="event_types"
            data-testid="event-types-select"
            multiple
            fullWidth
            size="small"
            displayEmpty
            disabled={values.show_always}
            renderValue={(selected) =>
              selected
                .map(
                  (id) => eventTypesDDL.find((opt) => opt.value === id)?.label
                )
                .filter(Boolean)
                .join(", ")
            }
          >
            {eventTypesDDL.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MuiFormikSelect>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <MuiFormikCheckbox
            name="show_always"
            label={T.translate("summitdoc.show_always")}
            onChange={handleShowAlwaysChange}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 9 }}>
          <label htmlFor="description">
            {T.translate("summitdoc.description")} *
          </label>
          <MuiFormikTextField
            name="description"
            margin="none"
            fullWidth
            multiline
            minRows={3}
            size="small"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <label htmlFor="selection_plan_id">
            {T.translate("summitdoc.selection_plan")}
          </label>
          <MuiFormikSelect
            name="selection_plan_id"
            fullWidth
            size="small"
            displayEmpty
            renderValue={(selected) =>
              selected
                ? selectionPlansDDL.find((opt) => opt.value === selected)?.label
                : T.translate("summitdoc.placeholders.selection_plan")
            }
          >
            <MenuItem value="">
              {T.translate("summitdoc.placeholders.selection_plan")}
            </MenuItem>
            {selectionPlansDDL.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </MuiFormikSelect>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12 }}>
          <label>{T.translate("summitdoc.file")} *</label>
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
              disabled={values.web_link?.length > 0}
            />
          </Box>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <label htmlFor="web_link">
            {T.translate("summitdoc.web_link")} *
          </label>
          <MuiFormikTextField
            name="web_link"
            margin="none"
            fullWidth
            size="small"
            placeholder={T.translate("summitdoc.placeholders.web_link")}
            disabled={!!(values.file_preview || values.file)}
          />
        </Grid2>
      </Grid2>
    </Box>
  );
};

SummitDocForm.propTypes = {
  currentSummit: PropTypes.object.isRequired,
  addFileToDoc: PropTypes.func.isRequired,
  removeFileFromDoc: PropTypes.func.isRequired,
  setFile: PropTypes.func.isRequired
};

export default SummitDocForm;
