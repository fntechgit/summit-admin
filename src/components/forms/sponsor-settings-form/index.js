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
import { useFormik } from "formik";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid2,
  TextField
} from "@mui/material";
import { DateField } from "@mui/x-date-pickers/DateField";
import * as yup from "yup";
import styles from "./styles.module.less";

const SponsorSettingsForm = ({ settings, onSubmit }) => {
  const formik = useFormik({
    initialValues: settings,
    validationSchema: yup.object({
      early_bird_start_date: yup.date(T.translate("validation.date")),
      early_bird_end_date: yup.date(T.translate("validation.date")),
      standard_price_start_date: yup.date(T.translate("validation.date")),
      standard_price_end_date: yup.date(T.translate("validation.date")),
      onsite_price_start_date: yup.date(T.translate("validation.date")),
      onsite_price_end_date: yup.date(T.translate("validation.date")),
      wire_transfer_fee: yup.number(T.translate("validation.number")),
      wire_transfer_notification_email: yup
        .string(T.translate("validation.string"))
        .email(T.translate("validation.email")),
      support_email: yup
        .string(T.translate("validation.string"))
        .email(T.translate("validation.email")),
      access_request_notification_email: yup.string(
        T.translate("validation.string")
      ),
      wire_transfer_detail: yup.string(T.translate("validation.string")),
      cart_checkout_cancel_policy: yup.string(T.translate("validation.string")),
      is_wire_transfer_enabled: yup.boolean(T.translate("validation.checkbox")),
      is_access_request_enabled: yup.boolean(T.translate("validation.checkbox"))
    }),
    onSubmit,
    enableReinitialize: true
  });

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      noValidate
      className={styles.formWrapper}
      autoComplete="off"
    >
      <Grid2 container spacing={2}>
        <Grid2 item size={4}>
          <DateField
            name="early_bird_start_date"
            label={T.translate("sponsor_settings.early_bird_start_date")}
            value={settings.early_bird_start_date}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="early_bird_end_date"
            label={T.translate("sponsor_settings.early_bird_end_date")}
            value={settings.early_bird_end_date}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="standard_price_start_date"
            label={T.translate("sponsor_settings.standard_price_start_date")}
            value={settings.standard_price_start_date}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="standard_price_end_date"
            label={T.translate("sponsor_settings.standard_price_end_date")}
            value={settings.standard_price_end_date}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="onsite_price_start_date"
            label={T.translate("sponsor_settings.onsite_price_start_date")}
            value={settings.onsite_price_start_date}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="onsite_price_end_date"
            label={T.translate("sponsor_settings.onsite_price_end_date")}
            value={settings.onsite_price_end_date}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="wire_transfer_fee"
            label={T.translate("sponsor_settings.wire_transfer_fee")}
            value={settings.wire_transfer_fee}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="wire_transfer_notification_email"
            label={T.translate(
              "sponsor_settings.wire_transfer_notification_email"
            )}
            value={settings.wire_transfer_notification_email}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={4}>
          <DateField
            name="support_email"
            label={T.translate("sponsor_settings.support_email")}
            value={settings.support_email}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={12}>
          <TextField
            name="access_request_notification_email"
            label={T.translate(
              "sponsor_settings.access_request_notification_email"
            )}
            value={settings.access_request_notification_email}
            margin="normal"
            fullWidth
          />
        </Grid2>
        <Grid2 item size={12}>
          <TextField
            name="wire_transfer_detail"
            label={T.translate("sponsor_settings.wire_transfer_detail")}
            value={settings.wire_transfer_detail}
            margin="normal"
            fullWidth
            multiline
            rows={4}
          />
        </Grid2>
        <Grid2 item size={12}>
          <TextField
            name="cart_checkout_cancel_policy"
            label={T.translate("sponsor_settings.cart_checkout_cancel_policy")}
            value={settings.cart_checkout_cancel_policy}
            margin="normal"
            fullWidth
            multiline
            rows={4}
          />
        </Grid2>
        <Grid2 item size={4}>
          <FormControlLabel
            control={
              <Checkbox
                name="is_wire_transfer_enabled"
                checked={settings.is_wire_transfer_enabled}
              />
            }
            label={T.translate("sponsor_settings.is_wire_transfer_enabled")}
          />
        </Grid2>
        <Grid2 item size={4}>
          <FormControlLabel
            control={
              <Checkbox
                name="is_access_request_enabled"
                checked={settings.is_access_request_enabled}
              />
            }
            label={T.translate("sponsor_settings.is_access_request_enabled")}
          />
        </Grid2>
      </Grid2>
      <Box className={styles.footer}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
        >
          {T.translate("general.save")}
        </Button>
      </Box>
    </Box>
  );
};

export default SponsorSettingsForm;
