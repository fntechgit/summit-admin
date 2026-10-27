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

import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { Box } from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikRadioGroup from "openstack-uicore-foundation/lib/components/mui/formik-inputs/radio-group";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import { requiredStringValidation } from "../../../../../utils/yup";
import {
  VISIBILITY_OPTION_EVERYONE,
  VISIBILITY_OPTION_ME
} from "../../../../../utils/filter-criteria-constants";

const SaveViewDialog = ({ selectedView, onSave, onClose }) => {
  const formik = useFormik({
    initialValues: {
      name: "",
      visibility: selectedView?.visibility ?? ""
    },
    validationSchema: yup.object({
      name: requiredStringValidation().trim(),
      visibility: requiredStringValidation()
    }),
    onSubmit: (values) =>
      onSave(values)
        .finally(() => onClose())
        .catch(() => {})
  });

  const handleClose = () => {
    if (formik.isSubmitting) return;
    onClose();
  };

  return (
    <CustomDialog
      title={T.translate("saved_views.save_current")}
      open
      onClose={handleClose}
      maxWidth="xs"
      primaryAction={{
        label: T.translate("general.save"),
        onClick: formik.submitForm
      }}
      secondaryAction={{
        label: T.translate("general.cancel"),
        onClick: handleClose
      }}
    >
      <FormikProvider value={formik}>
        {/* keeps Enter in the name field submitting */}
        <Box
          component="form"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (formik.isSubmitting) return;
            formik.handleSubmit(ev);
          }}
          noValidate
          autoComplete="off"
        >
          <MuiFormikTextField
            name="name"
            label={T.translate("general.name")}
            fullWidth
            autoFocus
          />
          <MuiFormikRadioGroup
            name="visibility"
            label={T.translate("save_filter_criteria.visible_to")}
            row
            options={[
              {
                value: VISIBILITY_OPTION_ME,
                label: T.translate("save_filter_criteria.me")
              },
              {
                value: VISIBILITY_OPTION_EVERYONE,
                label: T.translate("save_filter_criteria.everyone")
              }
            ]}
          />
        </Box>
      </FormikProvider>
    </CustomDialog>
  );
};

SaveViewDialog.propTypes = {
  selectedView: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    visibility: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

SaveViewDialog.defaultProps = {
  selectedView: null
};

export default SaveViewDialog;
