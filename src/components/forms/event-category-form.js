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
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import T from "i18n-react/dist/i18n-react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Grid2,
  InputLabel,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { UploadInputV3 } from "openstack-uicore-foundation/lib/components";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";
import MuiTableSortable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import {
  queryTags,
  queryAccessLevels
} from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import FormikTextEditor from "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor";
import MuiFormikAsyncAutocomplete from "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select";
import MuiFormikColorField from "../mui/formik-inputs/mui-formik-color-field";
import useScrollToError from "../../hooks/useScrollToError";
import {
  requiredStringValidation,
  requiredHTMLValidation,
  hexColorValidation
} from "../../utils/yup";

const validationSchema = yup.object().shape({
  name: requiredStringValidation(),
  code: requiredStringValidation(),
  color: hexColorValidation().required(T.translate("validation.required")),
  text_color: hexColorValidation().required(T.translate("validation.required")),
  description: requiredHTMLValidation()
});

const subtrackColumns = [
  { columnKey: "id", header: T.translate("general.id") },
  { columnKey: "name", header: T.translate("event_category_list.name") },
  { columnKey: "code", header: T.translate("event_category_list.code") },
  {
    columnKey: "color",
    header: T.translate("event_category_list.color"),
    render: (row) => (
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: 0.5,
          backgroundColor: row.color?.startsWith("#")
            ? row.color
            : `#${row.color}`
        }}
      />
    )
  }
];

const EventCategoryForm = ({
  currentSummit,
  entity,
  errors,
  history,
  onSubmit,
  onRemoveImage,
  onLinkSubCategory,
  onUnlinkSubCategory,
  onUpdateSubCategoryOrder
}) => {
  const { errorMessage } = useSnackbarMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [subtrackToLink, setSubtrackToLink] = useState(null);
  const [iconUrl, setIconUrl] = useState(entity.icon_url);
  const [scheduleSettingsExpanded, setScheduleSettingsExpanded] =
    useState(false);

  useEffect(() => {
    setIconUrl(entity.icon_url);
  }, [entity.icon_url]);

  const handleSubmit = (values) => {
    setIsSaving(true);
    const normalizedValues = {
      ...values,
      allowed_tags: values.allowed_tags.map((t) => ({
        id: parseInt(t.value, 10),
        tag: t.label
      })),
      allowed_access_levels: values.allowed_access_levels.map((al) => ({
        id: parseInt(al.value, 10),
        name: al.label
      }))
    };
    Promise.resolve(onSubmit(normalizedValues)).finally(() =>
      setIsSaving(false)
    );
  };

  const formik = useFormik({
    initialValues: {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      color: entity.color,
      text_color: entity.text_color,
      description: entity.description,
      session_count: entity.session_count,
      alternate_count: entity.alternate_count,
      lightning_count: entity.lightning_count,
      lightning_alternate_count: entity.lightning_alternate_count,
      voting_visible: entity.voting_visible,
      chair_visible: entity.chair_visible,
      allowed_tags: (entity.allowed_tags || []).map((t) => ({
        value: String(t.id),
        label: t.tag
      })),
      allowed_access_levels: (entity.allowed_access_levels || []).map((al) => ({
        value: String(al.id),
        label: al.name
      })),
      proposed_schedule_transition_time:
        entity.proposed_schedule_transition_time ?? ""
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit
  });

  useScrollToError(formik);

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      formik.setErrors(errors);
      formik.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
    }
  }, [errors]);

  const handleIconUploadComplete = (response) => {
    setIconUrl(response.url ?? response.file_url ?? response.path ?? null);
  };

  const handleIconUploadError = () => {
    errorMessage(T.translate("edit_event_category.icon_upload_error"));
  };

  const handleRemoveIcon = () => {
    setIconUrl(null);
    onRemoveImage(entity.id);
  };

  const availableSubTracks = currentSummit.tracks.filter(
    (t) =>
      !t.parent_id &&
      !entity.subtracks?.map((st) => st.id).includes(t.id) &&
      t.id !== entity.id
  );

  const handleAddSubtrack = () => {
    if (!subtrackToLink) return;
    onLinkSubCategory(entity.id, subtrackToLink.id);
    setSubtrackToLink(null);
  };

  const handleEditSubtrack = (subtrack) =>
    history.push(
      `/app/summits/${currentSummit.id}/event-categories/${subtrack.id}`
    );

  const handleUnlinkSubtrack = (subtrackId) =>
    onUnlinkSubCategory(entity.id, subtrackId);

  const handleReorderSubtracks = (_newOrder, subtrackId, newSubtrackOrder) =>
    onUpdateSubCategoryOrder(entity.id, subtrackId, newSubtrackOrder);

  return (
    <FormikProvider value={formik}>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="name">
              {T.translate("edit_event_category.name")} *
            </InputLabel>
            <MuiFormikTextField name="name" margin="none" fullWidth />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="code">
              {T.translate("edit_event_category.code")} *
            </InputLabel>
            <MuiFormikTextField name="code" margin="none" fullWidth />
          </Grid2>
          <Grid2 size={{ xs: 6, md: 2 }}>
            <InputLabel htmlFor="color">
              {T.translate("edit_event_category.color")} *
            </InputLabel>
            <MuiFormikColorField name="color" />
          </Grid2>
          <Grid2 size={{ xs: 6, md: 2 }}>
            <InputLabel htmlFor="text_color">
              {T.translate("edit_event_category.text_color")} *
            </InputLabel>
            <MuiFormikColorField name="text_color" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="description">
              {T.translate("edit_event_category.description")} *
            </InputLabel>
            <FormikTextEditor name="description" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <InputLabel htmlFor="session_count">
              {T.translate("edit_event_category.number_sessions")}
            </InputLabel>
            <MuiFormikTextField
              name="session_count"
              type="number"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <InputLabel htmlFor="alternate_count">
              {T.translate("edit_event_category.number_alternates")}
            </InputLabel>
            <MuiFormikTextField
              name="alternate_count"
              type="number"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <InputLabel htmlFor="lightning_count">
              {T.translate("edit_event_category.number_lightning")}
            </InputLabel>
            <MuiFormikTextField
              name="lightning_count"
              type="number"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <InputLabel htmlFor="lightning_alternate_count">
              {T.translate("edit_event_category.number_lightning_alternates")}
            </InputLabel>
            <MuiFormikTextField
              name="lightning_alternate_count"
              type="number"
              margin="none"
              fullWidth
            />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, sm: 4 }}>
            <MuiFormikCheckbox
              name="voting_visible"
              label={T.translate("edit_event_category.visible_voters")}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 8 }}>
            <MuiFormikCheckbox
              name="chair_visible"
              label={T.translate("edit_event_category.visible_track_chairs")}
            />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="allowed_tags">
              {T.translate("edit_event_category.tags")}
            </InputLabel>
            <MuiFormikAsyncAutocomplete
              name="allowed_tags"
              isMulti
              fullWidth
              placeholder={T.translate(
                "edit_event_category.placeholders.select_tags"
              )}
              queryFunction={(input, callback) =>
                queryTags(currentSummit.id, input, callback)
              }
              formatOption={(tag) => ({
                value: tag.id.toString(),
                label: tag.tag
              })}
              formatSelectedValue={(s) => ({ value: s.value, label: s.label })}
            />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <InputLabel
              htmlFor="allowed_access_levels"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              {T.translate("edit_event_category.allowed_access_levels")}
              <Tooltip
                title={T.translate(
                  "edit_event_category.allowed_access_levels_info"
                )}
              >
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </InputLabel>
            <MuiFormikAsyncAutocomplete
              name="allowed_access_levels"
              isMulti
              fullWidth
              placeholder={T.translate(
                "edit_event_category.placeholders.select_access_levels"
              )}
              queryFunction={(input, callback) =>
                queryAccessLevels(currentSummit.id, input, callback)
              }
              formatOption={(al) => ({
                value: al.id.toString(),
                label: al.name
              })}
              formatSelectedValue={(s) => ({ value: s.value, label: s.label })}
            />
          </Grid2>
        </Grid2>

        {entity.id !== 0 && (
          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <InputLabel htmlFor="icon_url">
                {T.translate("edit_event_category.pic")}
              </InputLabel>
              <UploadInputV3
                id="icon_url"
                value={
                  iconUrl ? [{ filename: iconUrl, file_path: iconUrl }] : []
                }
                onUploadComplete={handleIconUploadComplete}
                onError={handleIconUploadError}
                onRemove={handleRemoveIcon}
                postUrl={`${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tracks/${entity.id}/icon`}
                djsConfig={{ withCredentials: true }}
                maxFiles={1}
                canAdd={!iconUrl}
                mediaType={{
                  type: {
                    allowed_extensions: ["jpg", "jpeg", "png", "gif", "svg"]
                  }
                }}
              />
            </Grid2>
          </Grid2>
        )}

        <Accordion
          expanded={scheduleSettingsExpanded}
          onChange={() => setScheduleSettingsExpanded((prev) => !prev)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              {T.translate(
                "edit_event_category.proposed_schedule_settings.title"
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <InputLabel htmlFor="proposed_schedule_transition_time">
                  {T.translate(
                    "edit_event_category.proposed_schedule_settings.transition_time"
                  )}
                </InputLabel>
                <MuiFormikTextField
                  name="proposed_schedule_transition_time"
                  type="number"
                  margin="none"
                  fullWidth
                  placeholder={T.translate(
                    "edit_event_category.proposed_schedule_settings.placeholders.transition_time"
                  )}
                  slotProps={{ htmlInput: { min: 1, max: 240 } }}
                />
              </Grid2>
            </Grid2>
          </AccordionDetails>
        </Accordion>

        {!!entity.id && !entity.parent?.id && (
          <Box sx={{ mb: 2 }}>
            <Grid2 container spacing={2} sx={{ mb: 1 }}>
              <Grid2 size={12}>
                <InputLabel>
                  {T.translate("edit_event_category.subtracks")}
                  &nbsp;(<i>Nested tracks on schedule filter widget</i>)
                </InputLabel>
              </Grid2>
            </Grid2>
            <Grid2 container spacing={1} sx={{ mb: 2, alignItems: "stretch" }}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={availableSubTracks}
                  getOptionLabel={(t) => t.name}
                  value={subtrackToLink}
                  onChange={(_ev, value) => setSubtrackToLink(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={T.translate(
                        "edit_event_category.placeholders.select_subtrack"
                      )}
                      variant="outlined"
                    />
                  )}
                />
              </Grid2>
              <Grid2>
                <Button
                  variant="outlined"
                  disabled={!subtrackToLink}
                  onClick={handleAddSubtrack}
                  sx={{ height: "100%" }}
                >
                  {T.translate("general.add")}
                </Button>
              </Grid2>
            </Grid2>
            <MuiTableSortable
              data={entity.subtracks}
              columns={subtrackColumns}
              getName={(subtrack) => subtrack.name}
              onEdit={handleEditSubtrack}
              onDelete={handleUnlinkSubtrack}
              deleteDialogBody={(name) =>
                `${T.translate(
                  "edit_event_category.unlink_subtrack_warning"
                )}${name}`
              }
              confirmButtonColor="error"
              onReorder={handleReorderSubtracks}
            />
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {T.translate("general.save")}
          </Button>
        </Box>
      </Box>
    </FormikProvider>
  );
};

export default EventCategoryForm;
