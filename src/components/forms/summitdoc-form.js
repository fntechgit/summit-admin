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

import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import { Grid2 } from "@mui/material";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import { scrollToError, shallowEqual } from "../../utils/methods";

const SummitDocForm = ({
  currentSummit,
  entity: entityProp,
  errors: errorsProp,
  onSubmit,
  addFileToDoc,
  removeFileFromDoc
}) => {
  const [entity, setEntity] = useState({ ...entityProp });
  const [errors, setErrors] = useState(errorsProp);
  const [file, setFile] = useState(null);

  useEffect(() => {
    scrollToError(errorsProp);
  }, [errorsProp]);

  useEffect(() => {
    if (!shallowEqual(entity, entityProp)) {
      setEntity({ ...entityProp });
      setErrors({});
    }
  }, [entityProp]);

  useEffect(() => {
    if (!shallowEqual(errors, errorsProp)) {
      setErrors({ ...errorsProp });
    }
  }, [errorsProp]);

  const handleChange = (ev) => {
    const newEntity = { ...entity };
    const newErrors = { ...errors };
    const { id } = ev.target;
    let { value } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (ev.target.type === "number") {
      value = parseInt(value, 10);
    }

    newErrors[id] = "";
    newEntity[id] = value;

    if (id === "show_always" && value) {
      newEntity.event_types = [];
    }

    setEntity(newEntity);
    setErrors(newErrors);
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit(entity, file);
  };

  const hasErrors = (field) => {
    if (field in errors) {
      return errors[field];
    }

    return "";
  };

  const handleUploadFile = (uploadedFile) => {
    const newEntity = { ...entity };

    if (newEntity.id) {
      addFileToDoc(newEntity, uploadedFile);
    } else {
      newEntity.file_preview = uploadedFile.preview;
      setFile(uploadedFile);
      setEntity(newEntity);
    }
  };

  const handleRemoveFile = () => {
    const newEntity = { ...entity };

    if (newEntity.id) {
      removeFileFromDoc(newEntity);
    } else {
      newEntity.file_preview = "";
      setFile(null);
      setEntity(newEntity);
    }
  };

  const eventTypesDDL = currentSummit.event_types.map((et) => ({
    value: et.id,
    label: et.name
  }));

  const selectionPlansDDL = currentSummit.selection_plans.map((sp) => ({
    value: sp.id,
    label: sp.name
  }));

  return (
    <Box component="form">
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="name">{T.translate("summitdoc.name")} *</label>
          <TextField
            id="name"
            value={entity.name}
            onChange={handleChange}
            fullWidth
            size="small"
            error={!!hasErrors("name")}
            helperText={hasErrors("name")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="label">{T.translate("summitdoc.label")} *</label>
          <TextField
            id="label"
            value={entity.label}
            onChange={handleChange}
            fullWidth
            size="small"
            error={!!hasErrors("label")}
            helperText={hasErrors("label")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="event_types">
            {T.translate("summitdoc.event_types")} *{" "}
            <Tooltip title={T.translate("summitdoc.event_types_info")}>
              <InfoOutlinedIcon fontSize="inherit" />
            </Tooltip>
          </label>
          <Select
            id="event_types"
            name="event_types"
            data-testid="event-types-select"
            multiple
            fullWidth
            size="small"
            displayEmpty
            value={entity.event_types || []}
            disabled={entity.show_always}
            onChange={(ev) =>
              handleChange({
                target: { id: "event_types", value: ev.target.value }
              })
            }
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
          </Select>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 8 }}>
          <label htmlFor="description">
            {T.translate("summitdoc.description")} *
          </label>
          <TextField
            id="description"
            value={entity.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={3}
            size="small"
            error={!!hasErrors("description")}
            helperText={hasErrors("description")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <label htmlFor="selection_plan_id">
            {T.translate("summitdoc.selection_plan")}
          </label>
          <Select
            id="selection_plan_id"
            name="selection_plan_id"
            fullWidth
            size="small"
            displayEmpty
            value={entity.selection_plan_id || ""}
            onChange={(ev) =>
              handleChange({
                target: { id: "selection_plan_id", value: ev.target.value }
              })
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
          </Select>
        </Grid2>
      </Grid2>

      <Grid2 container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                id="show_always"
                checked={entity.show_always}
                onChange={handleChange}
              />
            }
            label={T.translate("summitdoc.show_always")}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <label>{T.translate("summitdoc.file")} *</label>
          <UploadInput
            value={entity.file_preview || entity.file}
            handleUpload={handleUploadFile}
            handleRemove={handleRemoveFile}
            className="dropzone"
            multiple={false}
            disabled={entity.web_link?.length > 0}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <label htmlFor="web_link">
            {T.translate("summitdoc.web_link")} *
          </label>
          <TextField
            id="web_link"
            value={entity.web_link}
            onChange={handleChange}
            placeholder={T.translate("summitdoc.placeholders.web_link")}
            fullWidth
            size="small"
            disabled={!!(entity.file_preview || entity.file)}
            error={!!hasErrors("web_link")}
            helperText={hasErrors("web_link")}
          />
        </Grid2>
      </Grid2>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={handleSubmit}>
          {T.translate("general.save")}
        </Button>
      </Box>
    </Box>
  );
};

export default SummitDocForm;
