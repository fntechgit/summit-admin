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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";
import MarketingSettingForm from "../../components/forms/marketing-setting-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getMarketingSetting,
  resetSettingForm,
  saveMarketingSetting,
  deleteSetting
} from "../../actions/marketing-actions";
import AddNewButton from "../../components/buttons/add-new-button";
import { requiredStringValidation } from "../../utils/yup";
import { MARKETING_SETTING_TYPE_FILE } from "../../utils/constants";
// import '../../styles/edit-marketing-setting-page.less';

export const buildValues = (entity) => ({
  id: entity?.id ?? 0,
  key: entity?.key ?? "",
  type: entity?.type ?? "",
  value: entity?.value ?? "",
  file_preview: entity?.file_preview ?? "",
  file: entity?.file ?? null,
  selection_plan_id: entity?.selection_plan_id ?? ""
});

export const validationSchema = yup.object().shape({
  key: requiredStringValidation(),
  type: requiredStringValidation(),
  value: yup
    .string()
    .nullable()
    .when("type", {
      is: (type) => type !== MARKETING_SETTING_TYPE_FILE,
      then: (schema) => schema.required(T.translate("validation.required")),
      otherwise: (schema) => schema
    }),
  file: yup.mixed().nullable(),
  file_preview: yup
    .string()
    .nullable()
    .when(["type", "file"], {
      is: (type, file) => type === MARKETING_SETTING_TYPE_FILE && !file,
      then: (schema) =>
        schema.required(T.translate("validation.file_required")),
      otherwise: (schema) => schema
    })
});

const EditMarketingSettingPage = ({
  currentSummit,
  entity,
  errors,
  match,
  history,
  getMarketingSetting,
  resetSettingForm,
  saveMarketingSetting,
  deleteSetting
}) => {
  const settingId = match.params.setting_id;
  const { successMessage } = useSnackbarMessage();

  useEffect(() => {
    if (!settingId) {
      resetSettingForm();
    } else {
      getMarketingSetting(settingId);
    }
  }, [settingId]);

  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit: (values) =>
      saveMarketingSetting(values, values.file)
        .then(() => {
          successMessage(
            T.translate(
              values.id
                ? "marketing.setting_saved"
                : "marketing.setting_created"
            )
          );
          history.push(`/app/summits/${currentSummit.id}/marketing`);
        })
        .catch(() => {})
  });

  useEffect(() => {
    formik.resetForm({ values: buildValues(entity) });
  }, [entity.id]);

  useEffect(() => {
    const errorFields = Object.keys(errors || {});
    formik.setErrors(errorFields.length > 0 ? errors : {});
  }, [errors]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.key : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("marketing.marketing_setting")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <MarketingSettingForm onDeleteImage={deleteSetting} />
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
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, marketingSettingState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...marketingSettingState
});

export default connect(mapStateToProps, {
  getSummitById,
  getMarketingSetting,
  resetSettingForm,
  saveMarketingSetting,
  deleteSetting
})(EditMarketingSettingPage);
