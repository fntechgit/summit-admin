import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { FieldArray, FormikProvider, useFormik } from "formik";
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
  Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikTextField from "../../mui/formik-inputs/mui-formik-textfield";
import MuiFormikSelect from "../../mui/formik-inputs/mui-formik-select";
import FormikTextEditor from "../../inputs/formik-text-editor";
import MuiFormikCheckbox from "../../mui/formik-inputs/mui-formik-checkbox";
import DragAndDropList from "../../mui/dnd-list";
import {
  deleteSponsorExtraQuestionValue,
  updateSponsorExtraQuestionValueOrder
} from "../../../actions/sponsor-actions";

const AddSponsorExtraQuestionPopup = ({
  entity: extraQuestion,
  summit,
  open,
  onClose,
  onSubmit,
  allClasses,
  deleteSponsorExtraQuestionValue,
  updateSponsorExtraQuestionValueOrder
}) => {
  const formik = useFormik({
    initialValues: {
      id: extraQuestion?.id,
      name: extraQuestion?.name,
      label: extraQuestion?.label,
      type: extraQuestion?.type,
      mandatory: extraQuestion?.mandatory || false,
      placeholder: extraQuestion?.placeholder,
      max_selected_values: extraQuestion?.max_selected_values,
      values: (extraQuestion?.values || []).map((value) => ({
        ...value,
        _shouldSave: false
      }))
    },
    validationSchema: yup.object({
      id: yup.number(),
      name: yup.string().required(T.translate("validation.required")),
      label: yup.string().required(T.translate("validation.required")),
      type: yup.string().required(T.translate("validation.required")),
      mandatory: yup.boolean(),
      placeholder: yup.string(),
      max_selected_values: yup.number(),
      values: yup.array().of(
        yup.object().shape({
          value: yup.string().required(T.translate("validation.required")),
          label: yup.string().required(T.translate("validation.required")),
          is_default: yup.boolean(),
          order: yup.number(),
          _shouldSave: yup.boolean()
        })
      )
    }),
    onSubmit: (values) => {
      const valuesToSave = values.values
        .filter((v) => v._shouldSave)
        .map(({ _shouldSave, ...rest }) => rest);
      const updatedValues = {
        ...values,
        values: values.values.map(({ _shouldSave, ...rest }) => rest),
        valuesToSave
      };
      onSubmit(updatedValues);
    },
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

  const handleValueChange = (index, field, value) => {
    if (field === "is_default" && value === true) {
      const updatedValues = formik.values.values.map((v, i) => {
        // new selected option
        if (i === index) {
          return {
            ...v,
            is_default: true,
            _shouldSave: true
          };
        }

        // uncheck previous marked option
        if (i !== index && v.is_default === true) {
          return {
            ...v,
            is_default: false
          };
        }
        return v;
      });

      formik.setFieldValue("values", updatedValues);
      return;
    }

    const currentValue = formik.values.values[index];
    const fieldName = `values[${index}].${field}`;

    formik.setFieldValue(fieldName, value);

    if (currentValue.id) {
      formik.setFieldValue(`values[${index}]._shouldSave`, true);
    }
  };

  const hideMandatory =
    formik.values.type === "CheckBox" ||
    (formik.values.type === "CheckBoxList" &&
      formik.values?.values?.length <= 1);

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

  const handleReorder = (newValues, result) => {
    if (result.source.index === result.destination.index) {
      return;
    }

    formik.setFieldValue("values", newValues);

    const movedItem = newValues[result.destination.index];

    if (movedItem.id) {
      updateSponsorExtraQuestionValueOrder(
        newValues,
        movedItem.id,
        movedItem.order
      );
    }
  };

  const areExtraQuestionsIncomplete = () => {
    if (formik.errors.values) return true;
    return formik.values.values.some(
      (eq) => eq.name?.trim() === "" || eq.label?.trim() === ""
    );
  };

  const renderValueItem = (valueItem, index, provided, snapshot, remove) => (
    <Grid2
      container
      spacing={2}
      sx={{
        mb: 1,
        px: 2,
        background: snapshot.isDragging ? "#f5f5f5" : "inherit",
        borderRadius: snapshot.isDragging ? "4px" : "0",
        transition: "background 0.2s ease"
      }}
      size={12}
    >
      <Grid2 size={4.5}>
        <MuiFormikTextField
          name={`values[${index}].value`}
          formik={formik}
          fullWidth
          margin="none"
          placeholder={T.translate("edit_sponsor.hidden_value")}
          onChange={(e) => handleValueChange(index, "value", e.target.value)}
        />
      </Grid2>
      <Grid2 size={4.5}>
        <MuiFormikTextField
          name={`values[${index}].label`}
          formik={formik}
          fullWidth
          margin="none"
          placeholder={T.translate("edit_sponsor.visible_value")}
          onChange={(e) => handleValueChange(index, "label", e.target.value)}
        />
      </Grid2>
      <Grid2
        size={2}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <MuiFormikCheckbox
          name={`values[${index}].is_default`}
          formik={formik}
          fullWidth
          margin="none"
          onChange={(e) =>
            handleValueChange(index, "is_default", e.target.checked)
          }
          label={T.translate("edit_sponsor.is_default")}
        />
      </Grid2>
      <Grid2
        size={0.5}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <IconButton
          onClick={() => {
            const valueToRemove = formik.values.values[index];
            if (valueToRemove.id) {
              deleteSponsorExtraQuestionValue(
                formik.values.id,
                valueToRemove.id
              );
            }
            remove(index);
          }}
        >
          <CloseIcon />
        </IconButton>
      </Grid2>
      <Grid2
        size={0.5}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "grab",
          "&:active": { cursor: "grabbing" }
        }}
      >
        <DragIndicatorIcon sx={{ color: "#666" }} />
      </Grid2>
    </Grid2>
  );

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
          {extraQuestion.id
            ? T.translate("edit_sponsor.edit_extra_question")
            : T.translate("edit_sponsor.add_extra_question")}
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
            <Grid2
              container
              spacing={2}
              size={12}
              sx={{ p: 2, alignItems: "flex-start" }}
            >
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
            {formik.values.type === "CheckBoxList" && (
              <Grid2 container spacing={2} size={6} sx={{ p: 2 }}>
                <Grid2
                  container
                  spacing={2}
                  size={12}
                  sx={{ alignItems: "baseline" }}
                >
                  <InputLabel htmlFor="max_selected_values">
                    {T.translate("edit_sponsor.max_selected_values")}
                  </InputLabel>
                  <Box width="100%">
                    <MuiFormikTextField
                      name="max_selected_values"
                      formik={formik}
                      fullWidth
                      type="number"
                      margin="none"
                    />
                  </Box>
                </Grid2>
              </Grid2>
            )}
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
            {shouldShowField("values") && (
              <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
                <Grid2
                  container
                  spacing={2}
                  sx={{
                    px: 2,
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#555"
                  }}
                  size={12}
                >
                  <Grid2 size={4.5}>
                    {T.translate("edit_sponsor.hidden_value")}
                  </Grid2>
                  <Grid2 size={4.5}>
                    {T.translate("edit_sponsor.visible_value")}
                  </Grid2>
                  <Grid2 size={2} />
                </Grid2>
                <FieldArray name="values">
                  {({ push, remove }) => (
                    <>
                      <Grid2 container spacing={2} size={12}>
                        <DragAndDropList
                          items={formik.values.values.sort(
                            (a, b) => a.order - b.order
                          )}
                          onReorder={handleReorder}
                          renderItem={(valueItem, index, provided, snapshot) =>
                            renderValueItem(
                              valueItem,
                              index,
                              provided,
                              snapshot,
                              remove
                            )
                          }
                          idKey="id"
                          updateOrderKey="order"
                          droppableId="sponsor-extra-question-values"
                        />
                      </Grid2>
                      <Button
                        variant="text"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          push({
                            value: "",
                            label: "",
                            is_default: false,
                            _shouldSave: true
                          })
                        }
                        disabled={areExtraQuestionsIncomplete()}
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
                    </>
                  )}
                </FieldArray>
              </Grid2>
            )}
            <Divider />
            {formik.values.type === "Text" && (
              <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
                <Grid2
                  container
                  spacing={2}
                  size={6}
                  sx={{ alignItems: "baseline" }}
                >
                  <InputLabel htmlFor="placeholder">
                    {T.translate("edit_sponsor.hint")}
                  </InputLabel>
                  <Box width="100%">
                    <MuiFormikTextField
                      name="placeholder"
                      formik={formik}
                      fullWidth
                      margin="none"
                    />
                  </Box>
                </Grid2>
              </Grid2>
            )}
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2
                container
                spacing={2}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                {!hideMandatory && (
                  <Box width="100%">
                    <MuiFormikCheckbox
                      name="mandatory"
                      formik={formik}
                      fullWidth
                      margin="none"
                      label={T.translate("edit_sponsor.mandatory")}
                    />
                  </Box>
                )}
              </Grid2>
              {badge_features_ddl.length > 0 && (
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

export default connect(mapStateToProps, {
  deleteSponsorExtraQuestionValue,
  updateSponsorExtraQuestionValueOrder
})(AddSponsorExtraQuestionPopup);
