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
import SponsorshipsBySummitSelectMUI from "../../inputs/sponsorship-summit-select-mui";
import MuiFormikTextField from "../../inputs/mui-formik-textfield";

const AddTierPopup = ({ company, open, onClose, onSubmit, summitId }) => {
  const formik = useFormik({
    initialValues: {
      company: company.name,
      sponsorships: []
    },
    validationSchema: yup.object({
      company: yup.object().shape({
        id: yup.number().required(),
        name: yup.string().required(),
        sponsorships: yup
          .array()
          .of(
            yup.object().shape({
              type_id: yup.number().required("Type ID is required")
            })
          )
          .min(1, "At least one sponsorship is required")
      })
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_sponsor.add_tier")}
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
                size={12}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="company">
                  {T.translate("edit_sponsor.company")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="company"
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
                <InputLabel htmlFor="sponsorships">
                  {T.translate("edit_sponsor.tiers")}
                </InputLabel>
                <SponsorshipsBySummitSelectMUI
                  name="sponsorships"
                  formik={formik}
                  summitId={summitId}
                  isMulti
                  placeholder={T.translate("edit_sponsor.placeholders.select")}
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={
                !formik.values.company ||
                formik.values.sponsorships.length === 0
              }
            >
              {T.translate("edit_sponsor.add_sponsor")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

AddTierPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  summitId: PropTypes.number.isRequired
};

export default AddTierPopup;
