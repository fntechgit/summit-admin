import React, { useEffect } from "react";
import { connect } from "react-redux";
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
  Box,
  MenuItem,
  Tooltip,
  InputAdornment
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikTextField from "../../mui/formik-inputs/mui-formik-textfield";
import MuiFormikSelect from "../../mui/formik-inputs/mui-formik-select";
import FormikTextEditor from "../../inputs/formik-text-editor";
import MuiFormikCheckbox from "../../mui/formik-inputs/mui-formik-checkbox";

const AddSponsorExtraQuestionPopup = ({
  extraQuestion,
  summit,
  open,
  onClose,
  onSubmit,
  allClasses,
  shouldHideMandatory = false,
  shouldHideAllowedFeatures = false
}) => {
  const formik = useFormik({
    initialValues: {
      id: extraQuestion?.id,
      name: extraQuestion?.name,
      label: extraQuestion?.label,
      type: extraQuestion?.type,
      mandatory: extraQuestion?.mandatory || false,
      placeholder: extraQuestion?.placeholder,
      values: extraQuestion?.values || []
    },
    validationSchema: yup.object({
      id: yup.number(),
      name: yup.string().required(),
      label: yup.string().required(),
      type: yup.string().required(),
      mandatory: yup.boolean(),
      placeholder: yup.string(),
      values: yup.array().of(
        yup.object().shape({
          value: yup.string().required(),
          label: yup.string().required(),
          is_default: yup.boolean()
        })
      )
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

  const handleAddValue = () => {
    const newValue = {
      value: "",
      label: "",
      is_default: false
    };

    const updatedValues = [...formik.values.values, newValue];
    formik.setFieldValue("values", updatedValues);
  };

  const handleRemoveValue = async (index) => {
    const valueToRemove = formik.values.values[index];

    if (valueToRemove.id) {
      // TODO: Remove value from db
    }

    const updatedValues = formik.values.values.filter((_, i) => i !== index);
    formik.setFieldValue("values", updatedValues);
  };

  const hideMandatory =
    shouldHideMandatory &&
    (formik.values.type === "CheckBox" ||
      (formik.values.type === "CheckBoxList" &&
        formik.values?.values?.length <= 1));

  const shouldShowField = (field) => {
    const { type } = formik.values;
    if (!type) return false;
    const entity_type = allClasses.find((c) => c.type == type);
    return entity_type?.hasOwnProperty(field) && entity_type[field];
  };

  const question_class_ddl = allClasses.map((c) => ({
    label: c.type.split(/(?=[A-Z])/).join(" "),
    value: c.type
  }));

  const badge_features_ddl =
    summit && summit.badge_features && summit.badge_features.length > 0
      ? summit.badge_features.map((f) => ({
          label: f.name,
          value: f.id
        }))
      : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_sponsor.add_extra_question")}
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
                <InputLabel htmlFor="type">
                  {T.translate("edit_sponsor.question_type")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikSelect
                    name="type"
                    formik={formik}
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <span style={{ color: "#00000061" }}>
                            {T.translate(
                              "edit_sponsor.placeholders.select_type"
                            )}
                          </span>
                        );
                      }
                      const selectedOption = question_class_ddl.find(
                        (t) => t.value === selected
                      );
                      return selectedOption?.value || selected;
                    }}
                  >
                    {question_class_ddl.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </MuiFormikSelect>
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={2}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="name">
                  {T.translate("edit_sponsor.question_id")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="name"
                    formik={formik}
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
            </Grid2>
            <Divider />
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2
                container
                spacing={2}
                size={12}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="label">
                  {T.translate("edit_sponsor.visible_question")}
                </InputLabel>
                <Box width="100%">
                  <FormikTextEditor
                    name="label"
                    formik={formik}
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
            </Grid2>
            {shouldShowField("values") && formik.values.id !== 0 && (
              <Grid2 container spacing={2} size={12}>
                <InputLabel htmlFor="values" sx={{ px: 2, pt: 2 }}>
                  {T.translate("question_form.values")}
                </InputLabel>
                <Box sx={{ width: "100%" }}>
                  {formik.values.values.map((valueItem, index) => (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 2,
                        py: 0,
                        px: 2
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <MuiFormikTextField
                          name={`values[${index}].value`}
                          label="Value"
                          formik={formik}
                          fullWidth
                          margin="none"
                          placeholder="Enter value"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => handleRemoveValue(index)}
                                  edge="end"
                                  sx={{
                                    color: "#666"
                                  }}
                                  disableRipple
                                >
                                  <CloseIcon />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                  <Button
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={handleAddValue}
                    sx={{
                      color: "#666",
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 400,
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: "#2196F3"
                      },
                      mb: 2
                    }}
                  >
                    {T.translate("edit_sponsor.add_value")}
                  </Button>
                </Box>
              </Grid2>
            )}
            <Divider />
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              {!hideMandatory && (
                <Grid2
                  container
                  spacing={2}
                  size={6}
                  sx={{ alignItems: "baseline" }}
                >
                  <Box width="100%">
                    <MuiFormikCheckbox
                      name="mandatory"
                      formik={formik}
                      fullWidth
                      margin="none"
                      label={T.translate("edit_sponsor.mandatory")}
                    />
                  </Box>
                </Grid2>
              )}
              {!shouldHideAllowedFeatures && badge_features_ddl.length >= 0 && (
                <Grid2
                  container
                  spacing={2}
                  size={6}
                  sx={{ alignItems: "baseline" }}
                >
                  <Grid2
                    container
                    spacing={2}
                    size={12}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <InputLabel htmlFor="type">
                      {T.translate("edit_sponsor.allowed_badge_features_types")}
                    </InputLabel>
                    <Tooltip
                      title={T.translate(
                        "edit_sponsor.allowed_badge_features_types_info"
                      )}
                      placement="top"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            fontFamily: "Roboto",
                            fontWeight: 400,
                            fontSize: "1.2rem",
                            lineHeight: "1.6rem",
                            letterSpacing: "0%",
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "182px",
                            whiteSpace: "normal",
                            wordWrap: "break-word",
                            padding: "4px 8px"
                          }
                        }
                      }}
                    >
                      <IconButton size="small" disableRipple>
                        <InfoIcon
                          sx={{
                            width: 20,
                            height: 20,
                            "&:hover": {
                              color: "#2196F3"
                            }
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Grid2>
                  <Box width="100%">
                    <MuiFormikSelect
                      name="allowed_badge_features_types"
                      formik={formik}
                      IconComponent={ExpandMoreIcon}
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <span style={{ color: "#00000061" }}>
                              {T.translate("edit_sponsor.placeholders.select")}
                            </span>
                          );
                        }
                        const selectedOption = badge_features_ddl.find(
                          (t) => t.value === selected
                        );
                        return selectedOption?.value || selected;
                      }}
                    >
                      {badge_features_ddl.map((bf) => (
                        <MenuItem key={bf.value} value={bf.value}>
                          {bf.label}
                        </MenuItem>
                      ))}
                    </MuiFormikSelect>
                  </Box>
                </Grid2>
              )}
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("edit_sponsor.save_extra_question")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

const mapStateToProps = ({ currentSponsorExtraQuestionState }) => ({
  ...currentSponsorExtraQuestionState
});

AddSponsorExtraQuestionPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default connect(mapStateToProps, {})(AddSponsorExtraQuestionPopup);
