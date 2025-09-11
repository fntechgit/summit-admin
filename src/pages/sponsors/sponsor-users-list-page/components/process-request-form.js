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
import MuiFormikCheckboxGroup from "../../../../components/inputs/mui-formik-checkbox-group";
import CompanyInputMUI from "../../../../components/inputs/company-input-mui";
import SponsorshipTypeInputMUI from "../../../../components/inputs/sponsorship-input-mui";
import MuiSponsorInput from "../../../../components/inputs/mui-sponsor-input";

const buildInitialValues = (data) => {
  const normalized = { ...data };
  normalized.name = data.requester_first_name;
  normalized.email = data.requester_email;

  return normalized;
};

const ProcessRequestForm = ({
  request,
  userGroups,
  summit,
  onSubmit
}) => {
  const formik = useFormik({
    initialValues: buildInitialValues(request),
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
            field1: T.translate("sponsor_users.process_request.expires_at"),
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
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.request_details")}
          </Typography>
          <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
            <Grid2 size={6}>
              <Typography variant="body2">
                {T.translate("sponsor_users.process_request.request_time")}
              </Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body1">{request.created}</Typography>
            </Grid2>
          </Grid2>
          <Divider />
          <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
            <Grid2 size={6}>
              <Typography variant="body2">
                {T.translate("sponsor_users.process_request.show")}
              </Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body1">{summit.name}</Typography>
            </Grid2>
          </Grid2>
          <Divider />
          <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
            <Grid2 size={6}>
              <Typography variant="body2">
                {T.translate("sponsor_users.process_request.company")}
              </Typography>
            </Grid2>
            <Grid2 size={6}>
              <Typography variant="body1">{request.company_name}</Typography>
            </Grid2>
          </Grid2>
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.new_user")}
          </Typography>
          <Grid2 container spacing={2} size={12}>
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
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.sponsor_assignment")}
          </Typography>
          <MuiFormikRadioGroup
            name="sponsor_type"
            row
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
              width: "100%"
            }}
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
          <Grid2 container spacing={2} size={12}>
            <Grid2 size={6}>
              <MuiSponsorInput
                name="sponsor_id"
                summitId={summit.id}
                placeholder={T.translate(
                  "sponsor_users.process_request.select_sponsor"
                )}
              />
            </Grid2>
            <Grid2 size={6}>
              <CompanyInputMUI
                name="company_id"
                placeholder={T.translate(
                  "sponsor_users.process_request.select_company"
                )}
              />
            </Grid2>
          </Grid2>
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.show_details")}
          </Typography>
          <InputLabel htmlFor="tier">
            {T.translate("sponsor_users.process_request.tiers")}
          </InputLabel>
          <SponsorshipTypeInputMUI
            name="tier"
            formik={formik}
            placeholder={T.translate(
              "sponsor_users.process_request.select_tier"
            )}
          />
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          <Typography variant="h6">
            {T.translate("sponsor_users.process_request.access")}
          </Typography>
          <MuiFormikCheckboxGroup name="access_rights" options={userGroups.map(ug => ({value: ug.id, label: ug.name}))} />
        </DialogContent>
        <Divider sx={{ margin: "10px 0px 20px 0px" }} />
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
