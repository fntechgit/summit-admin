import React, { useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";

const TagsDialog = ({ open, onClose, onSave, initialData }) => {
  const formik = useFormik({
    initialValues: {
      tag: initialData?.tag || ""
    },
    validationSchema: yup.object({
      tag: yup.string().trim().required(T.translate("edit_tag.name_required"))
    }),
    enableReinitialize: true,
    onSubmit: (values) => {
      onSave({ ...initialData, tag: values.tag.trim() });
    }
  });

  useEffect(() => {
    if (open) {
      formik.resetForm({
        values: {
          tag: initialData?.tag || ""
        }
      });
    }
  }, [open, initialData?.id, initialData?.tag]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {initialData?.id
          ? `${T.translate("general.edit")} ${T.translate("edit_tag.tag")}`
          : `${T.translate("general.add")} ${T.translate("edit_tag.tag")}`}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={T.translate("edit_tag.name")}
              type="text"
              fullWidth
              name="tag"
              value={formik.values.tag}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.tag && !!formik.errors.tag}
              helperText={formik.touched.tag ? formik.errors.tag : ""}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>
              {T.translate("general.cancel")}
            </Button>
            <Button type="submit" variant="contained">
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

export default TagsDialog;
