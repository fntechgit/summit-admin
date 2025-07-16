import React from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  MenuItem,
  InputLabel,
  Box,
  IconButton,
  Divider,
  Grid2
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik, FormikProvider, FieldArray } from "formik";
import * as yup from "yup";
import showConfirmDialog from "../../../components/mui/components/showConfirmDialog";
import MetaFieldValues from "./meta-field-values";
import MuiFormikTextField from "../../../components/inputs/mui-formik-textfield";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import MuiFormikSelect from "../../../components/inputs/mui-formik-select";
import MuiFormikCheckbox from "../../../components/inputs/mui-formik-checkbox";
import useScrollToError from "../../../hooks/useScrollToError";

const FormTemplateDialog = ({
  open,
  onClose,
  onSave,
  toDuplicate = false,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  entity: initialEntity
}) => {
  const METAFIELD_TYPES = [
    "CheckBox",
    "CheckBoxList",
    "ComboBox",
    "RadioButtonList",
    "Text",
    "TextArea",
    "Quantity",
    "DateTime",
    "Time"
  ];

  const formik = useFormik({
    initialValues: {
      ...initialEntity,
      meta_fields: initialEntity?.meta_fields?.length
        ? initialEntity.meta_fields
        : [
            {
              name: "",
              type: "Text",
              is_required: false,
              minimum_quantity: 0,
              maximum_quantity: 0,
              values: []
            }
          ]
    },
    validationSchema: yup.object().shape({
      code: yup.string().required(T.translate("validation.required")),
      name: yup.string().required(T.translate("validation.required")),
      instructions: yup.string().required(T.translate("validation.required")),
      meta_fields: yup.array().of(
        yup.object().shape({
          name: yup
            .string()
            .trim()
            .required(T.translate("validation.required")),
          type: yup
            .string()
            .oneOf(METAFIELD_TYPES)
            .required(T.translate("validation.required")),
          is_required: yup.boolean(),
          minimum_quantity: yup.number().optional(),
          maximum_quantity: yup.number().optional(),
          values: yup.array().of(
            yup.object().shape({
              value: yup
                .string()
                .trim()
                .required(T.translate("validation.required")),
              is_default: yup.boolean(),
              name: yup.string().required(T.translate("validation.required"))
            })
          )
        })
      )
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

  const fieldTypesWithOptions = ["CheckBoxList", "ComboBox", "RadioButtonList"];

  useScrollToError(formik);

  const handleRemoveFieldType = async (fieldType, index, removeFormik) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_form_template.delete_meta_field_warning")} ${
        fieldType.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (!isConfirmed) return;

    if (fieldType.id) {
      onMetaFieldTypeDeleted(initialEntity.id, fieldType.id).then(() =>
        removeFormik(index)
      );
    } else {
      removeFormik(index);
    }
  };

  const handleAddValue = (index) => {
    const newFields = [...formik.values.meta_fields];
    newFields[index].values.push({ value: "", is_default: false });
    formik.setFieldValue("meta_fields", newFields);
  };

  const handleRemoveValue = async (
    metaField,
    metaFieldValue,
    valueIndex,
    fieldIndex
  ) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("meta_field_values_list.delete_value_warning")} ${
        metaFieldValue.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const removeValueFromFields = () => {
        const newFields = [...formik.values.meta_fields];
        newFields[fieldIndex].values = newFields[fieldIndex].values.filter(
          (_, index) => index !== valueIndex
        );
        formik.setFieldValue("meta_fields", newFields);
      };
      if (metaField.id && metaFieldValue.id) {
        if (onMetaFieldTypeDeleted) {
          onMetaFieldTypeValueDeleted(
            initialEntity.id,
            metaField.id,
            metaFieldValue.id
          ).then(() => {
            removeValueFromFields();
          });
        }
      } else {
        removeValueFromFields();
      }
    }
  };

  const handleFieldValueChange = (fieldIndex, valueIndex, key, value) => {
    const newFields = [...formik.values.meta_fields];
    newFields[fieldIndex].values[valueIndex][key] = value;
    formik.setFieldValue("meta_fields", newFields);
  };

  const buildFieldName = (base, index, field) => `${base}[${index}].${field}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Edit Item
        <IconButton size="small" onClick={() => onClose()} sx={{ mr: 1 }}>
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
                <FormikTextEditor name="instructions" />
              </Grid2>
            </Grid2>

            <Divider />
            <DialogTitle sx={{ p: 3 }}>
              {T.translate("edit_form_template.meta_fields")}
            </DialogTitle>

            <Box sx={{ px: 3 }}>
              <FieldArray name="meta_fields">
                {({ push, remove }) => (
                  <>
                    {formik.values.meta_fields.map((field, fieldIndex) => (
                      <Grid2
                        container
                        spacing={2}
                        sx={{ alignItems: "center" }}
                        key={field}
                      >
                        <Grid2 size={11}>
                          <Box
                            sx={{
                              border: "1px solid #0000001F",
                              borderRadius: "4px",
                              p: 2,
                              my: 2
                            }}
                          >
                            <Grid2
                              container
                              spacing={2}
                              sx={{ alignItems: "start" }}
                            >
                              <Grid2 size={4}>
                                <InputLabel htmlFor="fieldTitle">
                                  {T.translate(
                                    "edit_form_template.meta_field_title"
                                  )}
                                </InputLabel>
                                <MuiFormikTextField
                                  name={buildFieldName(
                                    "meta_fields",
                                    fieldIndex,
                                    "name"
                                  )}
                                  margin="none"
                                  formik={formik}
                                  fullWidth
                                />
                              </Grid2>
                              <Grid2 size={4}>
                                <InputLabel htmlFor="fieldType">
                                  {T.translate(
                                    "edit_form_template.meta_field_type"
                                  )}
                                </InputLabel>
                                <MuiFormikSelect
                                  formik={formik}
                                  name={buildFieldName(
                                    "meta_fields",
                                    fieldIndex,
                                    "type"
                                  )}
                                >
                                  {METAFIELD_TYPES.map((field_type) => (
                                    <MenuItem value={field_type}>
                                      {field_type}
                                    </MenuItem>
                                  ))}
                                </MuiFormikSelect>
                              </Grid2>
                              <Grid2 size={4} sx={{ alignSelf: "end" }}>
                                <MuiFormikCheckbox
                                  formik={formik}
                                  name={buildFieldName(
                                    "meta_fields",
                                    fieldIndex,
                                    "is_required"
                                  )}
                                  label={T.translate(
                                    "edit_form_template.meta_field_required"
                                  )}
                                />
                              </Grid2>
                            </Grid2>
                            {fieldTypesWithOptions.includes(field.type) && (
                              <>
                                <Divider sx={{ mt: 2 }} />
                                <MetaFieldValues
                                  field={field}
                                  fieldIndex={fieldIndex}
                                  formik={formik}
                                  handleFieldValueChange={
                                    handleFieldValueChange
                                  }
                                  handleRemoveValue={handleRemoveValue}
                                  handleAddValue={handleAddValue}
                                />
                              </>
                            )}
                            {field.type === "Quantity" && (
                              <Grid2
                                container
                                spacing={2}
                                sx={{ alignItems: "end", my: 2 }}
                              >
                                <Grid2 size={4}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center"
                                    }}
                                  >
                                    <MuiFormikTextField
                                      formik={formik}
                                      name={buildFieldName(
                                        "meta_fields",
                                        fieldIndex,
                                        "minimum_quantity"
                                      )}
                                      placeholder={T.translate(
                                        "edit_form_template.placeholders.meta_field_minimum_quantity"
                                      )}
                                      type="number"
                                      fullWidth
                                    />
                                  </Box>
                                </Grid2>
                                <Grid2 size={4}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center"
                                    }}
                                  >
                                    <MuiFormikTextField
                                      formik={formik}
                                      name={buildFieldName(
                                        "meta_fields",
                                        fieldIndex,
                                        "maximum_quantity"
                                      )}
                                      placeholder={T.translate(
                                        "edit_form_template.placeholders.meta_field_maximum_quantity"
                                      )}
                                      type="number"
                                      fullWidth
                                    />
                                  </Box>
                                </Grid2>
                              </Grid2>
                            )}
                          </Box>
                        </Grid2>
                        <Grid2 size={1}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 1
                            }}
                          >
                            <Button
                              variant="outlined"
                              aria-label="delete"
                              sx={{
                                width: 40,
                                height: 40,
                                minWidth: "auto",
                                borderRadius: "50%",
                                padding: 0
                              }}
                              onClick={() =>
                                handleRemoveFieldType(
                                  formik.values.meta_fields[fieldIndex],
                                  fieldIndex,
                                  remove
                                )
                              }
                            >
                              <DeleteIcon />
                            </Button>
                            <Button
                              variant="contained"
                              aria-label="add"
                              sx={{
                                width: 40,
                                height: 40,
                                minWidth: "auto",
                                borderRadius: "50%",
                                padding: 0
                              }}
                              onClick={() =>
                                push({
                                  name: "",
                                  type: "Text",
                                  is_required: false,
                                  values: [],
                                  minimum_quantity: 0,
                                  maximum_quantity: 0
                                })
                              }
                            >
                              <AddIcon />
                            </Button>
                          </Box>
                        </Grid2>
                      </Grid2>
                    ))}
                  </>
                )}
              </FieldArray>
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
