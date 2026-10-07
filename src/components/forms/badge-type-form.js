/**
 * Copyright 2019 OpenStack Foundation
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

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import MuiLinkList from "../mui/link-list";
import useScrollToError from "../../hooks/useScrollToError";
import { requiredStringValidation } from "../../utils/yup";

const DESCRIPTION_MAX_LENGTH = 500;
const DESCRIPTION_ROWS = 6;

const validationSchema = yup.object().shape({
  name: requiredStringValidation(),
  description: requiredStringValidation()
});

const linkedColumns = [
  { columnKey: "name", header: T.translate("edit_badge_type.name") }
];

const unlinkDialogBody = (name) =>
  T.translate("edit_badge_type.unlink_warning", { name });

const BadgeTypeForm = ({
  entity,
  currentSummit,
  errors,
  onAccessLevelLink,
  onAccessLevelUnLink,
  onFeatureLink,
  onFeatureUnLink,
  onViewTypeLink,
  onViewTypeUnLink,
  onSubmit
}) => {
  // only the editable fields, so linking/unlinking (which updates the
  // entity in the store) doesn't reinitialize and drop unsaved edits
  const formik = useFormik({
    initialValues: {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      is_default: !!entity.is_default
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => onSubmit({ ...entity, ...values })
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

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <Grid2 container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <MuiFormikTextField
              name="name"
              label={T.translate("edit_badge_type.name")}
              required
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <MuiFormikCheckbox
              name="is_default"
              label={T.translate("edit_badge_type.default")}
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 10 }}>
            <MuiFormikTextField
              name="description"
              label={T.translate("edit_badge_type.description")}
              required
              multiline
              rows={DESCRIPTION_ROWS}
              maxLength={DESCRIPTION_MAX_LENGTH}
              fullWidth
            />
          </Grid2>
        </Grid2>

        {entity.id !== 0 && (
          <>
            <Box sx={{ pt: 2 }} />
            <MuiLinkList
              title={T.translate("edit_badge_type.access_levels")}
              placeholder={T.translate(
                "edit_badge_type.placeholders.select_access_level"
              )}
              values={entity.access_levels}
              options={currentSummit.badge_access_level_types}
              columns={linkedColumns}
              deleteDialogBody={unlinkDialogBody}
              onLink={(accessLevel) =>
                onAccessLevelLink(entity.id, accessLevel)
              }
              onUnLink={(accessLevelId) =>
                onAccessLevelUnLink(entity.id, accessLevelId)
              }
            />
            <Box sx={{ pt: 2 }} />
            <MuiLinkList
              title={T.translate("edit_badge_type.badge_features")}
              placeholder={T.translate(
                "edit_badge_type.placeholders.select_badge_feature"
              )}
              values={entity.badge_features}
              options={currentSummit.badge_features}
              columns={linkedColumns}
              deleteDialogBody={unlinkDialogBody}
              onLink={(feature) => onFeatureLink(entity.id, feature)}
              onUnLink={(featureId) => onFeatureUnLink(entity.id, featureId)}
            />
            <Box sx={{ pt: 2 }} />
            <MuiLinkList
              title={T.translate("edit_badge_type.view_types")}
              placeholder={T.translate(
                "edit_badge_type.placeholders.select_view_type"
              )}
              values={entity.allowed_view_types}
              options={currentSummit.badge_view_types ?? []}
              columns={linkedColumns}
              deleteDialogBody={unlinkDialogBody}
              onLink={(viewType) => onViewTypeLink(entity.id, viewType)}
              onUnLink={(viewTypeId) => onViewTypeUnLink(entity.id, viewTypeId)}
            />
          </>
        )}

        <Box sx={{ pt: 2 }} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" type="submit">
            {T.translate("general.save")}
          </Button>
        </Stack>
      </Box>
    </FormikProvider>
  );
};

BadgeTypeForm.propTypes = {
  entity: PropTypes.object.isRequired,
  currentSummit: PropTypes.object.isRequired,
  errors: PropTypes.object,
  onAccessLevelLink: PropTypes.func.isRequired,
  onAccessLevelUnLink: PropTypes.func.isRequired,
  onFeatureLink: PropTypes.func.isRequired,
  onFeatureUnLink: PropTypes.func.isRequired,
  onViewTypeLink: PropTypes.func.isRequired,
  onViewTypeUnLink: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

BadgeTypeForm.defaultProps = {
  errors: {}
};

export default BadgeTypeForm;
