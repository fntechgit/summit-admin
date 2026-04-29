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

const EditClientDialog = ({ open, onClose, onSubmit, client }) => {
  const formik = useFormik({
    initialValues: {
      company_name: client?.company_name ?? "",
      contact_name: client?.contact_name ?? "",
      contact_email: client?.contact_email ?? "",
      contact_phone: client?.contact_phone ?? ""
    },
    validationSchema: yup.object({
      company_name: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      contact_name: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      contact_email: yup
        .string(T.translate("validation.string"))
        .email(T.translate("validation.email"))
        .required(T.translate("validation.required")),
      contact_phone: yup
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
      <DialogTitle>{T.translate("client_card.edit_client")}</DialogTitle>
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent>
            <Grid2 container spacing={2}>
              <Grid2 size={6}>
                <MuiFormikTextField
                  name="company_name"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.company_name")}
                />
              </Grid2>
              <Grid2 size={6}>
                <MuiFormikTextField
                  name="contact_name"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.contact_name")}
                />
              </Grid2>
              <Grid2 size={6}>
                <MuiFormikTextField
                  name="contact_email"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.contact_email")}
                />
              </Grid2>
              <Grid2 size={6}>
                <MuiFormikTextField
                  name="contact_phone"
                  fullWidth
                  size="small"
                  label={T.translate("client_card.contact_phone")}
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

export default EditClientDialog;
