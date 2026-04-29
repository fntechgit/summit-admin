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
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2
} from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";

const EditAddressDialog = ({ open, onClose, onSubmit, address }) => {
  const formik = useFormik({
    initialValues: {
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      postal_code: address?.postal_code ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      country: address?.country ?? ""
    },
    validationSchema: yup.object({
      line1: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      line2: yup.string(T.translate("validation.string")),
      postal_code: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      city: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      state: yup.string(T.translate("validation.string")),
      country: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required"))
    }),
    onSubmit: (values) => {
      onSubmit(values);
      onClose();
    },
    validateOnChange: false,
    enableReinitialize: true
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{T.translate("client_card.edit_address")}</DialogTitle>
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent>
            <Grid2 container spacing={2}>
              <Grid2 size={12}>
                <MuiFormikTextField
                  name="line1"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.line1")}
                />
              </Grid2>
              <Grid2 size={12}>
                <MuiFormikTextField
                  name="line2"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.line2")}
                />
              </Grid2>
              <Grid2 size={4}>
                <MuiFormikTextField
                  name="postal_code"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.postal_code")}
                />
              </Grid2>
              <Grid2 size={4}>
                <MuiFormikTextField
                  name="city"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.city")}
                />
              </Grid2>
              <Grid2 size={4}>
                <MuiFormikTextField
                  name="state"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.state")}
                />
              </Grid2>
              <Grid2 size={12}>
                <MuiFormikTextField
                  name="country"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.country")}
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>
              {T.translate("client_card.cancel")}
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {T.translate("client_card.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

export default EditAddressDialog;
