import React from "react";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";

const PageTemplatePopup = ({ pageTemplate, open, onClose, onSave }) => {
  const handleClose = () => {
    onClose();
  };

  const handleAddInfo = () => {
    console.log("ADD INFO");
  };

  const handleAddDocument = () => {
    console.log("ADD DOCUMENT");
  };

  const handleAddMedia = () => {
    console.log("ADD MEDIA");
  };

  const formik = useFormik({
    initialValues: {
      ...pageTemplate
    },
    validationSchema: yup.object().shape({
      code: yup.string().required(T.translate("validation.required")),
      name: yup.string().required(T.translate("validation.required"))
    }),
    enableReinitialize: true,
    onSubmit: (values) => {
      onSave(values);
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("page_template_list.page_crud.title")}
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
          <DialogContent sx={{ p: 0 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2 spacing={2} size={4}>
                <MuiFormikTextField
                  name="code"
                  label={T.translate("page_template_list.code")}
                  fullWidth
                />
              </Grid2>
              <Grid2 spacing={2} size={8}>
                <MuiFormikTextField
                  name="name"
                  label={T.translate("page_template_list.name")}
                  fullWidth
                />
              </Grid2>
            </Grid2>
            <Divider gutterBottom />
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2 spacing={2} size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAddInfo()}
                  startIcon={<AddIcon />}
                >
                  {T.translate("page_template_list.page_crud.add_info")}
                </Button>
              </Grid2>
              <Grid2 spacing={2} size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAddDocument()}
                  startIcon={<AddIcon />}
                >
                  {T.translate("page_template_list.page_crud.add_doc")}
                </Button>
              </Grid2>
              <Grid2 spacing={2} size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAddMedia()}
                  startIcon={<AddIcon />}
                >
                  {T.translate("page_template_list.page_crud.add_media")}
                </Button>
              </Grid2>
            </Grid2>
            <Divider gutterBottom />
            <Typography
              variant="body2"
              component="div"
              color="text.secondary"
              sx={{ m: 2 }}
            >
              {T.translate("page_template_list.page_crud.no_modules")}
            </Typography>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("page_template_list.page_crud.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

PageTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ currentPageTemplateState }) => ({
  ...currentPageTemplateState
});

export default connect(mapStateToProps, {})(PageTemplatePopup);
