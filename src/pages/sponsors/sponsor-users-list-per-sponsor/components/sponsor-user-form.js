import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid2,
  Typography
} from "@mui/material";
import T from "i18n-react";
import { FormikProvider, useFormik } from "formik";
import MuiFormikTextField from "../../../../components/mui/formik-inputs/mui-formik-textfield";
import useScrollToError from "../../../../hooks/useScrollToError";
import MuiFormikCheckboxGroup from "../../../../components/mui/formik-inputs/mui-formik-checkbox-group";
import { titleCase } from "../../../../utils/methods";
import MuiFormikSwitch from "../../../../components/mui/formik-inputs/mui-formik-switch";

const buildInitialValues = (data) => {
  const normalized = { ...data };
  normalized.sponsor = data.sponsors_str[0];
  normalized.access_rights = data.access_rights_id;
  return normalized;
};

const SponsorUserForm = ({ user, userGroups, onSubmit }) => {
  const formik = useFormik({
    initialValues: buildInitialValues(user),
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
          <Grid2 container spacing={2} size={12}>
            <Grid2 size={6}>
              <MuiFormikTextField
                name="first_name"
                disabled
                label={T.translate("sponsor_users.edit_user.name")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={6}>
              <MuiFormikTextField
                name="email"
                disabled
                label={T.translate("sponsor_users.edit_user.email")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={6}>
              <MuiFormikTextField
                name="sponsor"
                disabled
                label={T.translate("sponsor_users.edit_user.sponsor")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={6}>
              <MuiFormikSwitch
                name="is_active"
                label={T.translate("sponsor_users.edit_user.active")}
              />
            </Grid2>
          </Grid2>
          <Divider sx={{ margin: "10px -16px 20px -16px" }} />
          <Typography variant="h6" gutterBottom>
            {T.translate("sponsor_users.edit_user.access")}
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
            {T.translate("sponsor_users.edit_user.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default SponsorUserForm;
