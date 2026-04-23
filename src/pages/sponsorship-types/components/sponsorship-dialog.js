import React from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  InputLabel,
  Box,
  IconButton,
  Divider,
  Grid2,
  MenuItem
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";
import MuiFormikSelect from "../../../components/mui/formik-inputs/mui-formik-select";
import useScrollToError from "../../../hooks/useScrollToError";
import { requiredStringValidation } from "../../../utils/yup";

const SIZE_OPTIONS = ["Small", "Medium", "Large", "Big"];

const SponsorshipDialog = ({ entity: initialEntity, onClose, onSave }) => {
  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      name: initialEntity?.name ?? "",
      label: initialEntity?.label ?? "",
      size: initialEntity?.size ?? "",
      order: initialEntity?.order ?? 0
    },
    enableReinitialize: true,
    validationSchema: yup.object().shape({
      name: requiredStringValidation()
    }),
    onSubmit: (values) => onSave(values)
  });

  useScrollToError(formik);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const title = initialEntity?.id
    ? `${T.translate("general.edit")} ${T.translate(
        "edit_sponsorship.sponsorship"
      )}`
    : `${T.translate("general.add")} ${T.translate(
        "edit_sponsorship.sponsorship"
      )}`;

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {title}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ mr: 1 }}
          aria-label="close"
        >
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
          <DialogContent sx={{ p: 0 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={12}>
                <InputLabel htmlFor="name">
                  {T.translate("edit_sponsorship.name")} *
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="name"
                  id="name"
                  margin="none"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={6} sx={{ mt: 2 }}>
                <InputLabel htmlFor="label">
                  {T.translate("edit_sponsorship.label")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="label"
                  margin="none"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={6} sx={{ mt: 2 }}>
                <InputLabel htmlFor="size">
                  {T.translate("edit_sponsorship.size")}
                </InputLabel>
                <Box>
                  <MuiFormikSelect
                    name="size"
                    placeholder={T.translate(
                      "edit_sponsorship.placeholders.select_size"
                    )}
                    margin="none"
                    isClearable
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </MuiFormikSelect>
                </Box>
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

SponsorshipDialog.propTypes = {
  entity: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default SponsorshipDialog;
