import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid2
} from "@mui/material";
import T from "i18n-react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import MuiFormikTextField from "../../../../../components/mui/formik-inputs/mui-formik-textfield";
import useScrollToError from "../../../../../hooks/useScrollToError";
import AccessRightsList from "./access-rights-lists";
import MuiFormikSwitch from "../../../../../components/mui/formik-inputs/mui-formik-switch";

const buildInitialValues = (data) => {
  const normalized = { ...data };
  normalized.sponsor = data.sponsors_str[0];
  normalized.access_rights = data.access_rights.map((ar) => ({
    id: ar.id,
    sponsor: { id: ar.sponsor.id, name: ar.sponsor.company_name },
    groups: ar.groups.map((g) => g.id)
  }));
  return normalized;
};

const SponsorUserForm = ({ user, summitId, userGroups, onSubmit }) => {
  const formik = useFormik({
    initialValues: buildInitialValues(user),
    onSubmit,
    enableReinitialize: true,
    validationSchema: yup.object().shape({
      id: yup.number(),
      first_name: yup.string(),
      email: yup.string(),
      access_rights: yup.array().of(
        yup.object({
          id: yup.number(),
          sponsor: yup
            .object({
              id: yup
                .number()
                .required(T.translate("sponsor_users.error_misssing_sponsor")),
              name: yup
                .string()
                .required(T.translate("sponsor_users.error_misssing_sponsor"))
            })
            .required(T.translate("sponsor_users.error_misssing_sponsor")),
          groups: yup.array().of(yup.number())
        })
      ),
      is_active: yup.bool(),
      access_rights_str: yup.array().of(yup.string()),
      access_rights_id: yup.array().of(yup.number()),
      sponsors_str: yup.array().of(yup.string()),
      sponsor: yup.string()
    })
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
          <Grid2 container spacing={2} size={12}>
            <Grid2 size={4}>
              <MuiFormikTextField
                name="first_name"
                disabled
                label={T.translate("sponsor_users.edit_user.name")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikTextField
                name="email"
                disabled
                label={T.translate("sponsor_users.edit_user.email")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikSwitch
                name="is_active"
                label={T.translate("sponsor_users.edit_user.active")}
              />
            </Grid2>
            <AccessRightsList
              name="access_rights"
              userGroups={userGroups}
              summitId={summitId}
            />
          </Grid2>
        </DialogContent>
        <Divider sx={{ margin: "10px 0px 20px 0px" }} />
        <DialogActions>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("sponsor_users.edit_user.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default SponsorUserForm;
