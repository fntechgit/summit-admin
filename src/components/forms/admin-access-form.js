/**
 * Copyright 2020 OpenStack Foundation
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
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import MemberInput from "openstack-uicore-foundation/lib/components/inputs/member-input";
import SummitInput from "openstack-uicore-foundation/lib/components/inputs/summit-input";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import { requiredStringValidation } from "../../utils/yup";

const validationSchema = yup.object().shape({
  title: requiredStringValidation(),
  members: yup.array().min(1, T.translate("validation.required")),
  summits: yup.array().min(1, T.translate("validation.required"))
});

const AdminAccessForm = ({
  entity,
  errors: serverErrors,
  onSubmit,
  isSaving = false
}) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: entity.id || 0,
      title: entity.title || "",
      members: entity.members || [],
      summits: entity.summits || []
    },
    validationSchema,
    onSubmit: (values) => onSubmit(values)
  });

  useEffect(() => {
    if (!serverErrors || Object.keys(serverErrors).length === 0) {
      formik.setErrors({});
      formik.setTouched({});
      return;
    }
    formik.setErrors(serverErrors);
    formik.setTouched(
      Object.fromEntries(Object.keys(serverErrors).map((k) => [k, true]))
    );
  }, [serverErrors]);

  return (
    <FormikProvider value={formik}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {entity.id ? T.translate("general.edit") : T.translate("general.add")}{" "}
        {T.translate("admin_access.admin_access")}
      </Typography>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{ width: "100%" }}
      >
        <input type="hidden" name="id" value={formik.values.id} />
        <Grid2 container spacing={2}>
          <Grid2 size={12}>
            <MuiFormikTextField
              name="title"
              label={T.translate("admin_access.title")}
              required
              fullWidth
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography component="label" sx={{ display: "block", mb: 0.5 }}>
              {T.translate("admin_access.members")} *
            </Typography>
            <MemberInput
              id="members"
              value={formik.values.members}
              getOptionLabel={(member) => {
                if (typeof member !== "object" || member === null)
                  return String(member ?? "");
                return `${member.first_name} ${member.last_name} (${
                  "email" in member ? member.email : member.id
                })`;
              }}
              onChange={(ev) =>
                formik.setFieldValue("members", ev.target.value)
              }
              onBlur={() => formik.setFieldTouched("members", true)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 1400 }) }}
              multi
            />
            {formik.touched.members && formik.errors.members && (
              <Typography color="error" sx={{ fontSize: "1.2rem", mt: 0.5 }}>
                {formik.errors.members}
              </Typography>
            )}
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography component="label" sx={{ display: "block", mb: 0.5 }}>
              {T.translate("admin_access.summits")} *
            </Typography>
            <SummitInput
              id="summits"
              value={formik.values.summits}
              onChange={(ev) =>
                formik.setFieldValue("summits", ev.target.value)
              }
              onBlur={() => formik.setFieldTouched("summits", true)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 1400 }) }}
              multi
            />
            {formik.touched.summits && formik.errors.summits && (
              <Typography color="error" sx={{ fontSize: "1.2rem", mt: 0.5 }}>
                {formik.errors.summits}
              </Typography>
            )}
          </Grid2>

          <Grid2
            size={12}
            sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}
          >
            <Button type="submit" variant="contained" disabled={isSaving}>
              {T.translate("general.save")}
            </Button>
          </Grid2>
        </Grid2>
      </Box>
    </FormikProvider>
  );
};

export default AdminAccessForm;
