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

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import FormikTextEditor from "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor";
import useScrollToError from "../../hooks/useScrollToError";
import {
  requiredHTMLValidation,
  requiredStringValidation
} from "../../utils/yup";

const NAME_MAX_LENGTH = 50;

const buildValidationSchema = (entity) =>
  yup.object({
    name: requiredStringValidation()
      .matches(/^\S+$/, T.translate("validation.single_word"))
      .max(
        NAME_MAX_LENGTH,
        T.translate("validation.max_length", { max: NAME_MAX_LENGTH })
      ),
    description: entity.id ? yup.string() : requiredHTMLValidation()
  });

const ViewTypeForm = ({ entity, errors, onSubmit }) => {
  const [isSaving, setIsSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: entity.name || "",
      description: entity.description || "",
      is_default: !!entity.is_default
    },
    validationSchema: buildValidationSchema(!entity.id),
    enableReinitialize: true,
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      Promise.resolve(onSubmit({ ...entity, ...values })).finally(() =>
        setIsSaving(false)
      );
    }
  });

  useScrollToError(formik);

  useEffect(() => {
    const errorFields = Object.keys(errors || {});
    formik.setErrors(errorFields.length > 0 ? errors : {});
    if (errorFields.length > 0) {
      formik.setTouched(
        errorFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
        false
      );
    }
  }, [errors]);

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        noValidate
        autoComplete="off"
        onSubmit={formik.handleSubmit}
      >
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <MuiFormikTextField
              name="name"
              label={T.translate("edit_view_type.name")}
              required
              fullWidth
            />
          </Grid2>
          <Grid2 size={12}>
            <InputLabel htmlFor="description">
              {T.translate("edit_view_type.description")}
            </InputLabel>
            <FormikTextEditor name="description" />
          </Grid2>
          <Grid2 size={12}>
            <MuiFormikCheckbox
              name="is_default"
              label={T.translate("edit_view_type.is_default")}
            />
          </Grid2>
        </Grid2>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" type="submit" disabled={isSaving}>
            {T.translate("general.save")}
          </Button>
        </Stack>
      </Box>
    </FormikProvider>
  );
};

ViewTypeForm.propTypes = {
  entity: PropTypes.object.isRequired,
  errors: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
};

ViewTypeForm.defaultProps = {
  errors: {}
};

export default ViewTypeForm;
