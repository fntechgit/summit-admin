import React, { useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Divider,
  Grid2,
  Typography,
  InputLabel,
  Box
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";

const EditBadgeScanPopup = ({ badgeScan, open, onClose, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      attendee_full_name: badgeScan.attendee_full_name,
      attendee_company: badgeScan.attendee_company,
      notes: badgeScan.notes
    },
    validationSchema: yup.object({
      attendee_full_name: yup.string().required(),
      attendee_company: yup.string().required(),
      notes: yup.string()
    }),
    onSubmit,
    enableReinitialize: true
  });

  // SCROLL TO ERROR
  useScrollToError(formik);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  useEffect(() => {
    if (Object.keys(formik.errors).length > 0) {
      console.log("Validation errors:", formik.errors);
    }
  }, [formik.errors]);

  useEffect(() => {
    if (Object.keys(formik.values).length > 0) {
      console.log("Validation values:", formik.values);
    }
  }, [formik.values]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_badge_scan.edit_badge_scan")}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
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
          <DialogContent sx={{ p: 1 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2
                container
                spacing={2}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="attendee_full_name">
                  {T.translate("edit_badge_scan.attendee_name")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="attendee_full_name"
                    formik={formik}
                    disabled
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={2}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="attendee_company">
                  {T.translate("edit_badge_scan.attendee_company")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="attendee_company"
                    formik={formik}
                    disabled
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={2}
                size={12}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="notes">
                  {T.translate("edit_badge_scan.notes")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="notes"
                    formik={formik}
                    multiline
                    rows={4}
                    maxLength={500}
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("edit_badge_scan.add_tier")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

EditBadgeScanPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default EditBadgeScanPopup;
