import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid2,
  InputLabel,
  Typography
} from "@mui/material";
import T from "i18n-react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import MuiFormikTextField from "../../../../components/mui/formik-inputs/mui-formik-textfield";
import useScrollToError from "../../../../hooks/useScrollToError";
import MuiFormikRadioGroup from "../../../../components/mui/formik-inputs/mui-formik-radio-group";
import MuiFormikCheckboxGroup from "../../../../components/mui/formik-inputs/mui-formik-checkbox-group";
import CompanyInputMUI from "../../../../components/mui/formik-inputs/company-input-mui";
import MuiSponsorInput from "../../../../components/mui/formik-inputs/mui-sponsor-input";
import { titleCase } from "../../../../utils/methods";
import MuiFormikSwitch from "../../../../components/mui/formik-inputs/mui-formik-switch";
import SponsorshipsBySummitSelectMUI from "../../../../components/mui/formik-inputs/sponsorship-summit-select-mui";
import { SPONSOR_USER_ASSIGNMENT_TYPE } from "../../../../utils/constants";

const buildInitialValues = (data) => {
  const normalized = { ...data };

  normalized.name = data.requester_first_name;
  normalized.email = data.requester_email;
  normalized.company = { id: data.company_id ?? 0, name: data.company_name };
  normalized.tiers = [];
  normalized.access_rights = [];
  normalized.send_email = true;

  normalized.sponsor_type = SPONSOR_USER_ASSIGNMENT_TYPE.NEW;
  if (data.company_id !== 0 && data.sponsor)
    normalized.sponsor_type = SPONSOR_USER_ASSIGNMENT_TYPE.EXISTING;
  else if (data.company_name)
    normalized.sponsor_type = SPONSOR_USER_ASSIGNMENT_TYPE.NEW;

  return normalized;
};

const ProcessRequestForm = ({ request, userGroups, summit, onSubmit }) => {
  const formik = useFormik({
    initialValues: buildInitialValues(request),
    validationSchema: yup.object({
      sponsor_type: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      sponsor: yup
        .object()
        .nullable()
        .when("sponsor_type", {
          is: SPONSOR_USER_ASSIGNMENT_TYPE.EXISTING,
          then: (schema) =>
            schema.required(T.translate("validation.required")).shape({
              id: yup.number().required(),
              name: yup.string().required()
            }),
          otherwise: (schema) => schema.notRequired()
        }),
      company: yup
        .object()
        .nullable()
        .when("sponsor_type", {
          is: SPONSOR_USER_ASSIGNMENT_TYPE.NEW,
          then: (schema) =>
            schema.required(T.translate("validation.required")).shape({
              id: yup
                .number()
                .min(0, T.translate("validation.required"))
                .required(),
              name: yup.string().required()
            }),
          otherwise: (schema) => schema.notRequired()
        }),
      tiers: yup
        .array()
        .of(
          yup.object().shape({
            id: yup.number().required(),
            name: yup.string().required()
          })
        )
        .when("sponsor_type", {
          is: SPONSOR_USER_ASSIGNMENT_TYPE.NEW,
          then: (schema) =>
            schema
              .min(1, T.translate("validation.required", { count: 1 }))
              .required(T.translate("validation.required")),
          otherwise: (schema) => schema.notRequired()
        })
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
          <Typography variant="h6" gutterBottom>
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
          <Typography variant="h6" gutterBottom>
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
          <MuiFormikSwitch
            name="send_email"
            label={T.translate("sponsor_users.process_request.send_email")}
          />
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          <Typography variant="h6" gutterBottom>
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
                value: SPONSOR_USER_ASSIGNMENT_TYPE.EXISTING,
                label: T.translate(
                  "sponsor_users.process_request.assign_to_existing"
                )
              },
              {
                value: SPONSOR_USER_ASSIGNMENT_TYPE.NEW,
                label: T.translate(
                  "sponsor_users.process_request.assign_to_new"
                )
              }
            ]}
          />
          <Grid2 container spacing={2} size={12}>
            <Grid2 size={6}>
              <MuiSponsorInput
                name="sponsor"
                disabled={
                  formik.values.sponsor_type ===
                  SPONSOR_USER_ASSIGNMENT_TYPE.NEW
                }
                summitId={summit.id}
                placeholder={T.translate(
                  "sponsor_users.process_request.select_sponsor"
                )}
              />
            </Grid2>
            <Grid2 size={6}>
              <CompanyInputMUI
                name="company"
                disabled={
                  formik.values.sponsor_type ===
                  SPONSOR_USER_ASSIGNMENT_TYPE.EXISTING
                }
                placeholder={T.translate(
                  "sponsor_users.process_request.select_company"
                )}
                allowCreate
              />
            </Grid2>
          </Grid2>
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          {formik.values.sponsor_type === SPONSOR_USER_ASSIGNMENT_TYPE.NEW && (
            <>
              <Typography variant="h6" gutterBottom>
                {T.translate("sponsor_users.process_request.show_details")}
              </Typography>
              <InputLabel htmlFor="tiers">
                {T.translate("sponsor_users.process_request.tiers")}
              </InputLabel>
              <SponsorshipsBySummitSelectMUI
                name="tiers"
                summitId={summit.id}
                isMulti
                placeholder={T.translate(
                  "sponsor_users.process_request.select_tier"
                )}
              />
              <Divider sx={{ margin: "10px -16px 20px -16px" }} />
            </>
          )}
          <Typography variant="h6" gutterBottom>
            {T.translate("sponsor_users.process_request.access")}
          </Typography>
          <MuiFormikCheckboxGroup
            name="access_rights"
            options={userGroups.map((ug) => ({
              value: ug.id,
              label: titleCase(ug.name)
            }))}
          />
        </DialogContent>
        <Divider sx={{ margin: "10px 0px 20px 0px" }} />
        <DialogActions>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("sponsor_users.process_request.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default ProcessRequestForm;
