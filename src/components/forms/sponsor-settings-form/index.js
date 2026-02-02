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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import MuiFormikDatepicker from "../../mui/formik-inputs/mui-formik-datepicker";
import MuiFormikTextField from "../../mui/formik-inputs/mui-formik-textfield";
import MuiFormikCheckbox from "../../mui/formik-inputs/mui-formik-checkbox";
import styles from "./styles.module.less";
import {
  addEmailListValidator,
  addIssAfterDateFieldValidator
} from "../../../utils/yup";
import useScrollToError from "../../../hooks/useScrollToError";

const buildInitialValues = (settings, summitTZ) => {
  const {
    early_bird_end_date,
    standard_price_end_date,
    onsite_price_start_date,
    onsite_price_end_date
  } = settings;
  const normalizedSettings = { ...settings };
  normalizedSettings.early_bird_end_date = early_bird_end_date
    ? epochToMomentTimeZone(early_bird_end_date, summitTZ)
    : null;
  normalizedSettings.standard_price_end_date = standard_price_end_date
    ? epochToMomentTimeZone(standard_price_end_date, summitTZ)
    : null;
  normalizedSettings.onsite_price_start_date = onsite_price_start_date
    ? epochToMomentTimeZone(onsite_price_start_date, summitTZ)
    : null;
  normalizedSettings.onsite_price_end_date = onsite_price_end_date
    ? epochToMomentTimeZone(onsite_price_end_date, summitTZ)
    : null;

  return normalizedSettings;
};

addEmailListValidator();
addIssAfterDateFieldValidator();

const SponsorSettingsForm = ({ settings, onSubmit, summitTZ }) => {
  const formik = useFormik({
    initialValues: buildInitialValues(settings, summitTZ),
    validationSchema: yup.object({
      early_bird_end_date: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required")),
      standard_price_end_date: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required"))
        .isAfterDateField(
          yup.ref("early_bird_end_date"),
          T.translate("validation.after", {
            field1: T.translate("sponsor_settings.standard_price_end_date"),
            field2: T.translate("sponsor_settings.early_bird_end_date")
          })
        ),
      onsite_price_start_date: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required"))
        .isAfterDateField(
          yup.ref("standard_price_end_date"),
          T.translate("validation.after", {
            field1: T.translate("sponsor_settings.onsite_price_start_date"),
            field2: T.translate("sponsor_settings.standard_price_end_date")
          })
        ),
      onsite_price_end_date: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required"))
        .isAfterDateField(
          yup.ref("onsite_price_start_date"),
          T.translate("validation.after", {
            field1: T.translate("sponsor_settings.onsite_price_end_date"),
            field2: T.translate("sponsor_settings.onsite_price_start_date")
          })
        ),
      wire_transfer_notification_email: yup
        .string(T.translate("validation.string"))
        .emailList(T.translate("validation.email")),
      access_request_notification_email: yup
        .string(T.translate("validation.string"))
        .emailList(T.translate("validation.email")),
      wire_transfer_detail: yup.string(T.translate("validation.string")),
      cart_checkout_cancel_policy: yup.string(T.translate("validation.string"))
    }),
    onSubmit,
    validateOnChange: false,
    enableReinitialize: true
  });

  // SCROLL TO ERROR
  useScrollToError(formik);

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        className={styles.formWrapper}
        autoComplete="off"
      >
        <Grid2 container spacing={2}>
          <Grid2 size={4}>
            <MuiFormikDatepicker
              name="early_bird_end_date"
              label={T.translate("sponsor_settings.early_bird_end_date")}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikDatepicker
              name="standard_price_end_date"
              label={T.translate("sponsor_settings.standard_price_end_date")}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikDatepicker
              name="onsite_price_start_date"
              label={T.translate("sponsor_settings.onsite_price_start_date")}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikDatepicker
              name="onsite_price_end_date"
              label={T.translate("sponsor_settings.onsite_price_end_date")}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikTextField
              name="wire_transfer_notification_email"
              label={T.translate(
                "sponsor_settings.wire_transfer_notification_email"
              )}
              fullWidth
            />
          </Grid2>
          <Grid2 size={12}>
            <MuiFormikTextField
              name="access_request_notification_email"
              label={T.translate(
                "sponsor_settings.access_request_notification_email"
              )}
              fullWidth
            />
          </Grid2>
          <Grid2 size={12}>
            <MuiFormikTextField
              name="wire_transfer_detail"
              label={T.translate("sponsor_settings.wire_transfer_detail")}
              fullWidth
              multiline
              rows={4}
              type="text"
            />
          </Grid2>
          <Grid2 size={12}>
            <MuiFormikTextField
              name="cart_checkout_cancel_policy"
              label={T.translate(
                "sponsor_settings.cart_checkout_cancel_policy"
              )}
              fullWidth
              multiline
              rows={4}
              type="text"
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikCheckbox
              name="is_wire_transfer_enabled"
              label={T.translate("sponsor_settings.is_wire_transfer_enabled")}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikCheckbox
              name="is_access_request_enabled"
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
    </FormikProvider>
  );
};

export default SponsorSettingsForm;
