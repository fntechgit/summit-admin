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

import React, { useEffect } from "react";
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
import { requiredStringValidation } from "../../utils/yup";

const validationSchema = yup.object({
  name: requiredStringValidation()
});

const ViewTypeForm = ({ entity, errors, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      name: entity.name || "",
      description: entity.description || "",
      is_default: !!entity.is_default
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => onSubmit({ ...entity, ...values })
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
          <Button
            variant="contained"
            type="submit"
            disabled={formik.isSubmitting}
          >
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
