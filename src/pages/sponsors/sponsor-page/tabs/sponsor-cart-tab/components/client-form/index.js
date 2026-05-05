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

import React, { useEffect, useMemo } from "react";
import { debounce } from "lodash";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import Box from "@mui/material/Box";
import { MuiFormikTextField } from "openstack-uicore-foundation/lib/components";
import { DEBOUNCE_WAIT_250 } from "../../../../../../../utils/constants";

const ClientForm = ({ initialValues, onChange }) => {
  const formik = useFormik({
    initialValues: {
      full_name: initialValues?.full_name || "",
      email: initialValues?.email || ""
    },
    validationSchema: yup.object({
      full_name: yup.string().required(T.translate("validation.required")),
      email: yup
        .string()
        .email(T.translate("validation.email"))
        .required(T.translate("validation.required"))
    }),
    enableReinitialize: true
  });

  const debouncedOnChange = useMemo(
    () => debounce(onChange, DEBOUNCE_WAIT_250),
    [onChange]
  );

  useEffect(() => {
    debouncedOnChange(formik.values);
  }, [formik.values]);

  return (
    <FormikProvider value={formik}>
      <Box component="form" onSubmit={formik.handleSubmit} autoComplete="off">
        <MuiFormikTextField
          name="full_name"
          label={T.translate("general.full_name")}
          fullWidth
        />
        <MuiFormikTextField
          name="email"
          label={T.translate("general.email")}
          fullWidth
        />
      </Box>
    </FormikProvider>
  );
};

export default ClientForm;
