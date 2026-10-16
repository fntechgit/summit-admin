/**
 * Copyright 2018 OpenStack Foundation
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
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { Box, Button, Divider, Typography } from "@mui/material";
import BadgeFeatureTypeForm from "../../components/forms/badge-feature-type-form";
import {
  getBadgeFeature,
  resetBadgeFeatureForm,
  saveBadgeFeature,
  removeBadgeFeatureImage
} from "../../actions/badge-actions";
import AddNewButton from "../../components/buttons/add-new-button";
import {
  requiredHTMLValidation,
  requiredStringValidation
} from "../../utils/yup";

export const buildValues = (entity) => ({
  id: entity?.id ?? 0,
  name: entity?.name ?? "",
  description: entity?.description ?? "",
  template_content: entity?.template_content ?? "",
  image: entity?.image ?? null
});

export const validationSchema = yup.object().shape({
  name: requiredStringValidation(),
  description: requiredHTMLValidation(),
  template_content: requiredHTMLValidation()
});

const EditBadgeFeaturePage = ({
  currentSummit,
  entity,
  match,
  history,
  getBadgeFeature,
  resetBadgeFeatureForm,
  saveBadgeFeature,
  removeBadgeFeatureImage
}) => {
  const badgeFeatureId = match.params.badge_feature_id;

  useEffect(() => {
    if (!badgeFeatureId) {
      resetBadgeFeatureForm();
    } else {
      // entity is persisted; resetting first changes entity.id so the Formik resync fires on refetch
      resetBadgeFeatureForm();
      getBadgeFeature(badgeFeatureId);
    }
  }, [badgeFeatureId]);

  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit: (values) =>
      saveBadgeFeature(values)
        .then((payload) => {
          const listUrl = `/app/summits/${currentSummit.id}/badge-features`;
          // new entities stay on their edit route so the image can be attached
          history.push(
            values.id ? listUrl : `${listUrl}/${payload.response.id}`
          );
        })
        .catch(() => {})
  });

  useEffect(() => {
    formik.resetForm({ values: buildValues(entity) });
  }, [entity.id]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  return (
    <Box className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Typography variant="h5" component="h3" sx={{ my: 2 }}>
        {title} {T.translate("edit_badge_feature.badge_feature")}
        <AddNewButton entity={entity} />
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <FormikProvider value={formik}>
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <BadgeFeatureTypeForm
            entity={entity}
            onRemoveImage={removeBadgeFeatureImage}
          />
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
            >
              {T.translate("general.save")}
            </Button>
          </Box>
        </Box>
      </FormikProvider>
    </Box>
  );
};

const mapStateToProps = ({ currentSummitState, currentBadgeFeatureState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentBadgeFeatureState
});

export default connect(mapStateToProps, {
  getBadgeFeature,
  resetBadgeFeatureForm,
  saveBadgeFeature,
  removeBadgeFeatureImage
})(EditBadgeFeaturePage);
