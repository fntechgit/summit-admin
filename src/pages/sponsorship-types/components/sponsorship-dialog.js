import React, { useState } from "react";
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
  Grid2
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelectV2 from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select-v2";
import useScrollToError from "../../../hooks/useScrollToError";
import { requiredStringValidation } from "../../../utils/yup";

const SIZE_OPTIONS_DDL = [
  { label: "Small", value: "Small" },
  { label: "Medium", value: "Medium" },
  { label: "Large", value: "Large" },
  { label: "Big", value: "Big" }
];

const SponsorshipDialog = ({ entity: initialEntity, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      name: initialEntity?.name ?? "",
      label: initialEntity?.label ?? "",
      size: initialEntity?.size ?? "",
      order: initialEntity?.order ?? 0
    },
    validationSchema: yup.object().shape({
      name: requiredStringValidation()
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      onSave(values)
        .then(() => onClose())
        .finally(() => setIsSaving(false));
    }
  });

  useScrollToError(formik);

  const handleClose = () => {
    if (isSaving) return;
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
    <Dialog
      open
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {title}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ mr: 1 }}
          aria-label="close"
          disabled={isSaving}
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
                  fullWidth
                  required
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
                  fullWidth
                />
              </Grid2>
              <Grid2 size={6} sx={{ mt: 2 }}>
                <InputLabel htmlFor="size">
                  {T.translate("edit_sponsorship.size")}
                </InputLabel>
                <Box>
                  <MuiFormikSelectV2
                    name="size"
                    placeholder={T.translate(
                      "edit_sponsorship.placeholders.select_size"
                    )}
                    margin="none"
                    isClearable
                    options={SIZE_OPTIONS_DDL}
                  />
                </Box>
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSaving}
            >
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
