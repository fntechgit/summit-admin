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
  Grid2
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import useScrollToError from "../../../hooks/useScrollToError";
import { requiredStringValidation } from "../../../utils/yup";

const MediaFileTypeDialog = ({ entity: initialEntity, onClose, onSave }) => {
  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      name: initialEntity?.name ?? "",
      description: initialEntity?.description ?? "",
      allowed_extensions: Array.isArray(initialEntity?.allowed_extensions)
        ? initialEntity.allowed_extensions.join(",")
        : initialEntity?.allowed_extensions ?? ""
    },
    validationSchema: yup.object().shape({
      name: requiredStringValidation()
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      Promise.resolve(onSave(values))
        .then(() => {
          onClose();
        })
        .catch(() => {
          // keep dialog open on save error to preserve user input
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  });

  useScrollToError(formik);

  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    formik.resetForm();
    onClose();
  };

  const title = initialEntity?.id
    ? `${T.translate("general.edit")} ${T.translate(
        "media_file_type.media_file_type"
      )}`
    : `${T.translate("general.add")} ${T.translate(
        "media_file_type.media_file_type"
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
          disabled={isSaving}
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
                  {T.translate("media_file_type.name")} *
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
              <Grid2 size={12} sx={{ mt: 2 }}>
                <InputLabel htmlFor="description">
                  {T.translate("media_file_type.description")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="description"
                  id="description"
                  margin="none"
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid2>
              <Grid2 size={12} sx={{ mt: 2 }}>
                <InputLabel htmlFor="allowed_extensions">
                  {T.translate("media_file_type.allowed_extensions_input")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="allowed_extensions"
                  id="allowed_extensions"
                  margin="none"
                  fullWidth
                  multiline
                  rows={2}
                />
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

MediaFileTypeDialog.propTypes = {
  entity: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default MediaFileTypeDialog;
