import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Grid2,
  InputLabel,
  MenuItem,
  Switch,
  Typography
} from "@mui/material";
import T from "i18n-react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import MuiFormikTextField from "../../../../components/inputs/mui-formik-textfield";
import useScrollToError from "../../../../hooks/useScrollToError";
import MuiFormikRadioGroup from "../../../../components/inputs/mui-formik-radio-group";
import MuiFormikSelect from "../../../../components/inputs/mui-formik-select";
import MuiFormikCheckboxGroup from "../../../../components/inputs/mui-formik-checkbox-group";

const ProcessRequestForm = ({
  request,
  sponsorships,
  userGroups,
  summit,
  onSubmit
}) => {
  const formik = useFormik({
    initialValues: request,
    validationSchema: yup.object({
      code: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      opens_at: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required")),
      expires_at: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required"))
        .isAfterDateField(
          yup.ref("opens_at"),
          T.translate("validation.after", {
            field1: T.translate("sponsor_forms.form_template_popup.expires_at"),
            field2: T.translate("sponsor_forms.form_template_popup.opens_at")
          })
        )
    }),
    onSubmit,
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
        autoComplete="off"
      >
        <DialogContent sx={{ p: 0 }}>
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.request_details")}
          </Typography>
          <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
            <Grid2 size={6}>
              <Typography variant="body2">
                {T.translate("sponsor_users.process_request.request_time")}
              </Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body2">{request.created}</Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body2">
                {T.translate("sponsor_users.process_request.show")}
              </Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body2">{summit.title}</Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body2">
                {T.translate("sponsor_users.process_request.company")}
              </Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body2">{request.company_name}</Typography>
            </Grid2>
          </Grid2>
          <Divider />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.new_user")}
          </Typography>
          <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
            <Grid2 size={6}>
              <MuiFormikTextField
                name="name"
                label={T.translate("sponsor_users.process_request.name")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={6}>
              <MuiFormikTextField
                name="email"
                label={T.translate("sponsor_users.process_request.email")}
                fullWidth
              />
            </Grid2>
          </Grid2>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label={T.translate("sponsor_users.process_request.send_email")}
          />
          <Divider />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.sponsor_assignment")}
          </Typography>
          <MuiFormikRadioGroup
            name="sponsor_type"
            options={[
              {
                value: "existing",
                label: T.translate(
                  "sponsor_users.process_request.assign_to_existing"
                )
              },
              {
                value: "new",
                label: T.translate(
                  "sponsor_users.process_request.assign_to_new"
                )
              }
            ]}
          />
          <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
            <Grid2 size={6}>Sponsor DDL</Grid2>
            <Grid2 size={6}>Company DDL</Grid2>
          </Grid2>
          <Divider />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.show_details")}
          </Typography>
          <InputLabel htmlFor="tier">
            {T.translate("sponsor_users.process_request.tier")}
          </InputLabel>
          <MuiFormikSelect name="tier">
            {sponsorships.map((tier) => (
              <MenuItem value={tier.id}>{tier.name}</MenuItem>
            ))}
          </MuiFormikSelect>
          <Divider />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.access")}
          </Typography>
          <MuiFormikCheckboxGroup name="access_rights" options={userGroups} />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("sponsor_forms.form_template_popup.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default ProcessRequestForm;
