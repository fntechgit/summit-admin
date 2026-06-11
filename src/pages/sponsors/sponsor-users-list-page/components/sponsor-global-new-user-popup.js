import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import MuiSponsorInput from "openstack-uicore-foundation/lib/components/mui/formik-inputs/sponsor-input";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import CustomAlert from "../../../../components/mui/custom-alert";
import {
  sendSponsorUserInvite,
  getSponsorUsers
} from "../../../../actions/sponsor-users-actions";

const SponsorGlobalNewUserPopup = ({
  onClose,
  summitId,
  sendSponsorUserInvite,
  getSponsorUsers
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleOnSave = (values) => {
    if (isSaving) return;
    setIsSaving(true);
    sendSponsorUserInvite(values.email, values.sponsor.id)
      .then(() => {
        getSponsorUsers();
        handleClose();
      })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const formik = useFormik({
    initialValues: { sponsor: { id: "", name: "" }, email: "" },
    validationSchema: yup.object({
      sponsor: yup.object({
        id: yup.string().required(T.translate("validation.required"))
      }),
      email: yup
        .string(T.translate("validation.string"))
        .email(T.translate("validation.email"))
        .required(T.translate("validation.required"))
    }),
    onSubmit: handleOnSave,
    validateOnBlur: false,
    enableReinitialize: true
  });

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_users.new_user.add_user")}
        </Typography>
        <IconButton
          size="large"
          sx={{ p: 0 }}
          onClick={handleClose}
          disabled={isSaving}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent sx={{ p: 2 }}>
            <MuiSponsorInput
              name="sponsor"
              summitId={summitId}
              placeholder={T.translate(
                "sponsor_users.process_request.select_sponsor"
              )}
            />
            <MuiFormikTextField
              name="email"
              label={T.translate("sponsor_users.new_user.email")}
              fullWidth
              required
            />
            <CustomAlert
              message={T.translate("sponsor_users.new_user.alert")}
            />
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSaving}
            >
              {T.translate("sponsor_users.new_user.invite")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

SponsorGlobalNewUserPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  sendSponsorUserInvite: PropTypes.func.isRequired,
  summitId: PropTypes.number.isRequired
};

export default connect(() => {}, {
  sendSponsorUserInvite,
  getSponsorUsers
})(SponsorGlobalNewUserPopup);
