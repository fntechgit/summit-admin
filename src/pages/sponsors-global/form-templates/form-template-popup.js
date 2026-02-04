import React from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
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
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import AdditionalInputList from "../../../components/mui/formik-inputs/additional-input/additional-input-list";
import useScrollToError from "../../../hooks/useScrollToError";
import {
  formMetafieldsValidation,
  requiredStringValidation
} from "../../../utils/yup";

const FormTemplateDialog = ({
  open,
  onClose,
  onSave,
  toDuplicate = false,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  entity: initialEntity
}) => {
  const formik = useFormik({
    initialValues: {
      ...initialEntity,
      meta_fields: initialEntity?.meta_fields?.length
        ? initialEntity.meta_fields
        : []
    },
    validationSchema: yup.object().shape({
      code: requiredStringValidation(),
      name: requiredStringValidation(),
      instructions: requiredStringValidation(),
      meta_fields: formMetafieldsValidation()
    }),
    enableReinitialize: true,
    onSubmit: (values) => {
      // remove all ids if is duplicating from existing form template
      const finalValues = {
        ...values,
        id: toDuplicate ? null : values.id,
        meta_fields: values.meta_fields.map((field) => ({
          ...field,
          id: toDuplicate ? null : field.id,
          values: field.values.map((value) => ({
            ...value,
            id: toDuplicate ? null : value.id,
            meta_field_type_id: toDuplicate ? null : value.meta_field_type_id
          }))
        }))
      };
      onSave(finalValues);
    }
  });

  useScrollToError(formik);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Edit Item
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
          <DialogContent sx={{ p: 0 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={4}>
                <InputLabel htmlFor="code">
                  {T.translate("edit_form_template.code")} *
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="code"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={8}>
                <InputLabel htmlFor="name">
                  {T.translate("edit_form_template.name")} *
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="name"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
            </Grid2>
            <Divider />
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={12}>
                <InputLabel htmlFor="instructions">
                  {T.translate("edit_form_template.instructions")} *
                </InputLabel>
                <FormikTextEditor
                  name="instructions"
                  options={{ zIndex: 9999999 }}
                />
              </Grid2>
            </Grid2>

            <Divider />
            <DialogTitle sx={{ p: 3 }}>
              {T.translate("edit_form_template.meta_fields")}
            </DialogTitle>

            <Box sx={{ px: 3 }}>
              <AdditionalInputList
                entityId={initialEntity.id}
                name="meta_fields"
                onDelete={onMetaFieldTypeDeleted}
                onDeleteValue={onMetaFieldTypeValueDeleted}
              />
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {initialEntity.id
                ? T.translate("edit_form_template.save_changes")
                : T.translate("edit_form_template.add_form")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

FormTemplateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  entity: PropTypes.object
};

export default FormTemplateDialog;
