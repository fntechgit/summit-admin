import React from "react";
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
import CustomAlert from "../../../../components/mui/custom-alert";
import MuiFormikTextField from "../../../../components/mui/formik-inputs/mui-formik-textfield";
import { sendSponsorUserInvite } from "../../../../actions/sponsor-users-actions";

const NewUserPopup = ({ open, onClose, sendSponsorUserInvite }) => {
  const handleClose = () => {
    onClose();
  };

  const handleOnSave = (values) => {
    sendSponsorUserInvite(values.email).finally(() => {
      handleClose();
    });
  };

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: yup.object({
      email: yup
        .string(T.translate("validation.string"))
        .email(T.translate("validation.email"))
        .required(T.translate("validation.required"))
    }),
    onSubmit: handleOnSave,
    enableReinitialize: true
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_users.new_user.add_user")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
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
            <Button type="submit" fullWidth variant="contained">
              {T.translate("sponsor_users.new_user.invite")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

NewUserPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sendSponsorUserInvite: PropTypes.func.isRequired
};

export default connect(() => {}, {
  sendSponsorUserInvite
})(NewUserPopup);
