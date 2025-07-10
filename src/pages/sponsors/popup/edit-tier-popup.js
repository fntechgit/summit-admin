import React, { useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { useFormik } from "formik";
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
  MenuItem,
  InputLabel,
  Box
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import SponsorshipTypeInputMUI from "../../../components/inputs/sponsorship-input-mui";
import MuiFormikTextField from "../../../components/inputs/mui-formik-textfield";
import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikSelect from "../../../components/inputs/mui-formik-select";
import MuiFormikCheckbox from "../../../components/inputs/mui-formik-checkbox";

const EditTierDialog = ({ open, onClose, onSubmit, entity: initialEntity }) => {
  const formik = useFormik({
    initialValues: initialEntity,
    validationSchema: yup.object({
      id: yup.number().typeError(T.translate("validation.number")),
      type: yup
        .object({
          id: yup
            .number()
            .typeError(T.translate("validation.number"))
            .required(T.translate("validation.required")),
          name: yup.string().required()
        })
        .required(T.translate("validation.required")),
      widget_title: yup.string(T.translate("validation.string")),
      lobby_template: yup.string(T.translate("validation.string")),
      expo_hall_template: yup.string(T.translate("validation.string")),
      event_page_template: yup.string(T.translate("validation.string")),
      sponsor_page_template: yup.string(T.translate("validation.string")),
      sponsor_page_use_disqus_widget: yup.bool(
        T.translate("validation.boolean")
      ),
      should_display_on_expo_hall_page: yup.bool(
        T.translate("validation.boolean")
      ),
      sponsor_page_use_schedule_widget: yup.bool(
        T.translate("validation.boolean")
      ),
      sponsor_page_use_banner_widget: yup.bool(
        T.translate("validation.boolean")
      ),
      sponsor_page_use_live_event_widget: yup.bool(
        T.translate("validation.boolean")
      ),
      should_display_on_lobby_page: yup.bool(T.translate("validation.boolean"))
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

  const lobby_template_ddl = [
    { label: "Big Images", value: "big-images" },
    { label: "Small Images", value: "small-images" },
    { label: "Horizontal Images", value: "horizontal-images" },
    { label: "Carousel", value: "carousel" }
  ];

  const expo_hall_template_ddl = [
    { label: "Big Images", value: "big-images" },
    { label: "Medium Images", value: "medium-images" },
    { label: "Small Images", value: "small-images" }
  ];

  const sponsor_page_template_ddl = [
    { label: "Big Header", value: "big-header" },
    { label: "Small Header", value: "small-header" }
  ];

  const event_page_template_ddl = [
    { label: "Big Images", value: "big-images" },
    { label: "Small Images", value: "small-images" },
    { label: "Horizontal Images", value: "horizontal-images" }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {`${initialEntity.id ? "Edit" : "Add"} ${T.translate(
            "edit_summit_sponsorship.sponsorship"
          )}`}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <DialogContent sx={{ p: 0 }}>
          <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
            <Grid2
              container
              spacing={2}
              size={12}
              sx={{ alignItems: "baseline" }}
            >
              <Grid2
                container
                spacing={0}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="type">
                  {T.translate("edit_summit_sponsorship.sponsorship_type")}
                </InputLabel>
                <Box width="100%">
                  <SponsorshipTypeInputMUI
                    name="type"
                    formik={formik}
                    placeholder={T.translate(
                      "edit_sponsor.placeholders.sponsorship_type"
                    )}
                  />
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="widget_title">
                  {T.translate("edit_summit_sponsorship.widget_title")}
                </InputLabel>
                <MuiFormikTextField
                  formik={formik}
                  name="widget_title"
                  variant="outlined"
                  margin="none"
                  placeholder={T.translate(
                    "edit_summit_sponsorship.placeholders.widget_title"
                  )}
                  fullWidth
                />
              </Grid2>
            </Grid2>
            <Grid2
              container
              spacing={2}
              size={12}
              sx={{ alignItems: "baseline" }}
            >
              <Grid2
                container
                spacing={0}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="lobby_template">
                  {T.translate("edit_summit_sponsorship.lobby_template")}
                </InputLabel>
                <MuiFormikSelect
                  name="lobby_template"
                  formik={formik}
                  IconComponent={ExpandMoreIcon}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#00000061" }}>
                          {T.translate(
                            "edit_summit_sponsorship.placeholders.select_lobby_template"
                          )}
                        </span>
                      );
                    }
                    const selectedOption = lobby_template_ddl.find(
                      (t) => t.value === selected
                    );
                    return selectedOption?.label || selected;
                  }}
                >
                  {lobby_template_ddl.map((lobby_template) => (
                    <MenuItem
                      key={lobby_template.value}
                      value={lobby_template.value}
                    >
                      {lobby_template.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="expo_hall_template">
                  {T.translate("edit_summit_sponsorship.expo_hall_template")}
                </InputLabel>
                <MuiFormikSelect
                  name="expo_hall_template"
                  formik={formik}
                  IconComponent={ExpandMoreIcon}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#00000061" }}>
                          {T.translate(
                            "edit_summit_sponsorship.placeholders.select_expo_hall_template"
                          )}
                        </span>
                      );
                    }
                    const selectedOption = expo_hall_template_ddl.find(
                      (t) => t.value === selected
                    );
                    return selectedOption?.label || selected;
                  }}
                >
                  {expo_hall_template_ddl.map((expo_hall_template) => (
                    <MenuItem value={expo_hall_template.value}>
                      {expo_hall_template.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
            </Grid2>
            <Grid2
              container
              spacing={2}
              size={12}
              sx={{ alignItems: "baseline" }}
            >
              <Grid2
                container
                spacing={0}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="event_page_template">
                  {T.translate("edit_summit_sponsorship.event_page_template")}
                </InputLabel>
                <MuiFormikSelect
                  name="event_page_template"
                  formik={formik}
                  IconComponent={ExpandMoreIcon}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#00000061" }}>
                          {T.translate(
                            "edit_summit_sponsorship.placeholders.select_event_page_template"
                          )}
                        </span>
                      );
                    }
                    const selectedOption = event_page_template_ddl.find(
                      (t) => t.value === selected
                    );
                    return selectedOption?.label || selected;
                  }}
                >
                  {event_page_template_ddl.map((event_page_template) => (
                    <MenuItem value={event_page_template.value}>
                      {event_page_template.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="sponsor_page_template">
                  {T.translate("edit_summit_sponsorship.sponsor_page_template")}
                </InputLabel>
                <MuiFormikSelect
                  name="sponsor_page_template"
                  formik={formik}
                  IconComponent={ExpandMoreIcon}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#00000061" }}>
                          {T.translate(
                            "edit_summit_sponsorship.placeholders.select_sponsor_page_template"
                          )}
                        </span>
                      );
                    }
                    const selectedOption = sponsor_page_template_ddl.find(
                      (t) => t.value === selected
                    );
                    return selectedOption?.label || selected;
                  }}
                >
                  {sponsor_page_template_ddl.map((sponsor_page_template) => (
                    <MenuItem value={sponsor_page_template.value}>
                      {sponsor_page_template.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
            </Grid2>
            <Grid2
              container
              spacing={2}
              mt={3}
              size={12}
              sx={{ alignItems: "baseline" }}
            >
              <Grid2
                container
                spacing={0}
                size={4}
                sx={{ alignItems: "baseline" }}
              >
                <MuiFormikCheckbox
                  name="sponsor_page_use_disqus_widget"
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_disqus_widget"
                  )}
                  formik={formik}
                />
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={4}
                sx={{ alignItems: "baseline" }}
              >
                <MuiFormikCheckbox
                  name="should_display_on_expo_hall_page"
                  label={T.translate(
                    "edit_summit_sponsorship.should_display_on_expo_hall_page"
                  )}
                  formik={formik}
                />
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={4}
                sx={{ alignItems: "baseline" }}
              >
                <MuiFormikCheckbox
                  name="sponsor_page_use_schedule_widget"
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_schedule_widget"
                  )}
                  formik={formik}
                />
              </Grid2>
            </Grid2>
            <Grid2
              container
              spacing={2}
              mb={1}
              size={12}
              sx={{ alignItems: "baseline" }}
            >
              <Grid2
                container
                spacing={0}
                size={4}
                sx={{ alignItems: "baseline" }}
              >
                <MuiFormikCheckbox
                  name="sponsor_page_use_banner_widget"
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_banner_widget"
                  )}
                  formik={formik}
                />
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={4}
                sx={{ alignItems: "baseline" }}
              >
                <MuiFormikCheckbox
                  name="sponsor_page_use_live_event_widget"
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_live_event_widget"
                  )}
                  formik={formik}
                />
              </Grid2>
              <Grid2
                container
                spacing={0}
                size={4}
                sx={{ alignItems: "baseline" }}
              >
                <MuiFormikCheckbox
                  name="should_display_on_lobby_page"
                  label={T.translate(
                    "edit_summit_sponsorship.should_display_on_lobby_page"
                  )}
                  formik={formik}
                />
              </Grid2>
            </Grid2>
          </Grid2>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ py: 2 }}>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("edit_summit_sponsorship.save")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

EditTierDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default EditTierDialog;
