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

import React from "react";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import { Box, Button, Grid2 } from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikPriceField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/price-field";
import InfoNote from "../InfoNote";

const RefundForm = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      reason: "",
      amount: 0
    },
    validationSchema: yup.object({
      reason: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      amount: yup
        .number(T.translate("validation.number"))
        .required(T.translate("validation.required"))
    }),
    onSubmit,
    validateOnChange: false,
    enableReinitialize: true
  });

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <Grid2 container spacing={2}>
          <Grid2 size={6}>
            <MuiFormikTextField
              name="reason"
              fullWidth
              size="small"
              label={T.translate("refund_form.reason")}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikPriceField
              name="amount"
              fullWidth
              size="small"
              label={T.translate("refund_form.amount")}
            />
          </Grid2>
          <Grid2 size={2} sx={{ pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="small"
            >
              {T.translate("refund_form.queue_refund")}
            </Button>
          </Grid2>
        </Grid2>
      </Box>
      <InfoNote message={T.translate("refund_form.info")} sx={{ mt: 2 }} />
    </FormikProvider>
  );
};

export default RefundForm;
