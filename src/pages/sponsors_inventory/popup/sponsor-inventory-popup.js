import React from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { FieldArray, FormikProvider, useFormik } from "formik";
import * as yup from "yup";
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
  Grid2,
  FormHelperText
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { UploadInputV2 } from "openstack-uicore-foundation/lib/components";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY,
  METAFIELD_TYPES
} from "../../../utils/constants";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import MetaFieldValues from "./meta-field-values";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";
import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikSelect from "../../../components/mui/formik-inputs/mui-formik-select";
import MuiFormikCheckbox from "../../../components/mui/formik-inputs/mui-formik-checkbox";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";

const SponsorItemDialog = ({
  open,
  onClose,
  onSave,
  onImageDeleted,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  entity: initialEntity
}) => {
  const numberValidation = () =>
    yup.number().typeError(T.translate("validation.number"));

  const decimalValidation = () =>
    yup
      .number()
      .typeError(T.translate("validation.number"))
      .min(0, T.translate("validation.number_positive"))
      .test("max-decimals", T.translate("validation.two_decimals"), (value) => {
        if (value === undefined || value === null) return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      });

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
          ],
      images: initialEntity?.images ?? []
    },
    validationSchema: yup.object().shape({
      code: yup.string().required(T.translate("validation.required")),
      name: yup.string().required(T.translate("validation.required")),
      description: yup.string().required(T.translate("validation.required")),
      images: yup.array().min(1, T.translate("validation.required")),
      early_bird_rate: decimalValidation(),
      standard_rate: decimalValidation(),
      onsite_rate: decimalValidation(),
      default_quantity: numberValidation()
        .integer(T.translate("validation.integer"))
        .min(0, T.translate("validation.number_positive")),
      quantity_limit_per_sponsor: numberValidation()
        .integer(T.translate("validation.integer"))
        .min(0, T.translate("validation.number_positive")),
      quantity_limit_per_show: numberValidation()
        .integer(T.translate("validation.integer"))
        .min(0, T.translate("validation.number_positive")),
      meta_fields: yup.array().of(
        yup.object().shape({
          name: yup.string().trim(),
          type: yup.string().oneOf(METAFIELD_TYPES),
          is_required: yup.boolean(),
          minimum_quantity: yup.number().optional(),
          maximum_quantity: yup.number().optional(),
          values: yup.array().of(
            yup.object().shape({
              value: yup.string().trim(),
              is_default: yup.boolean(),
              name: yup.string()
            })
          )
        })
      )
    }),
    enableReinitialize: true,
    onSubmit: (values) => onSave(values)
  });

  const fieldTypesWithOptions = ["CheckBoxList", "ComboBox", "RadioButtonList"];

  const mediaType = {
    max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
    max_uploads_qty: MAX_INVENTORY_IMAGES_UPLOAD_QTY,
    type: {
      allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS
    }
  };

  useScrollToError(formik);

  const handleRemoveFieldType = async (fieldType, index, removeFormik) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_inventory_item.delete_meta_field_warning")} ${
        fieldType.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (!isConfirmed) return;

    const removeOrResetField = () => {
      if (formik.values.meta_fields.length === 1) {
        formik.setFieldValue("meta_fields", [
          {
            name: "",
            type: "Text",
            is_required: false,
            minimum_quantity: 0,
            maximum_quantity: 0,
            values: []
          }
        ]);
      } else {
        removeFormik(index);
      }
    };

    if (fieldType.id) {
      onMetaFieldTypeDeleted(initialEntity.id, fieldType.id)
        .then(() => removeOrResetField())
        .catch((err) => console.log("Error at delete field from API", err));
    } else {
      removeOrResetField();
    }
  };

  const buildFieldName = (base, index, field) => `${base}[${index}].${field}`;

  const handleImageUploadComplete = (response) => {
    if (response) {
      const image = {
        file_path: `${response.path}${response.name}`,
        filename: response.name
      };
      formik.setFieldValue("images", [...formik.values.images, image]);
      formik.setFieldTouched("images", true);
    }
  };

  const handleRemoveImage = (imageFile) => {
    const updated = formik.values.images.filter(
      (i) => i.filename !== imageFile.name
    );
    formik.setFieldValue("images", updated);
    if (onImageDeleted && initialEntity.id && imageFile.id) {
      onImageDeleted(initialEntity.id, imageFile.id);
    }
  };

  const getMediaInputValue = () =>
    initialEntity.images?.length > 0
      ? initialEntity.images.map((img) => ({
          ...img,
          filename: img.filename ?? img.file_path ?? img.file_url
        }))
      : [];

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
        <IconButton size="small" onClick={handleClose} sx={{ mr: 1 }}>
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
                  {T.translate("edit_inventory_item.code")} *
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
                  {T.translate("edit_inventory_item.name")} *
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
                <InputLabel htmlFor="description">
                  {T.translate("edit_inventory_item.description")} *
                </InputLabel>
                <FormikTextEditor
                  name="description"
                  options={{ zIndex: 9999999 }}
                />
              </Grid2>
            </Grid2>

            <Divider />

            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={4}>
                <InputLabel htmlFor="early_bird_rate">
                  {T.translate("edit_inventory_item.early_bird_rate")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="early_bird_rate"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="standard_rate">
                  {T.translate("edit_inventory_item.standard_rate")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="standard_rate"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="onsite_rate">
                  {T.translate("edit_inventory_item.onsite_rate")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="onsite_rate"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
            </Grid2>
            <Divider />
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={4}>
                <InputLabel htmlFor="default_quantity">
                  {T.translate("edit_inventory_item.default_quantity")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="default_quantity"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="quantity_limit_per_sponsor">
                  {T.translate(
                    "edit_inventory_item.quantity_limit_per_sponsor"
                  )}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="quantity_limit_per_sponsor"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="quantity_limit_per_show">
                  {T.translate("edit_inventory_item.quantity_limit_per_show")}
                </InputLabel>
                <MuiFormikTextField
                  variant="outlined"
                  name="quantity_limit_per_show"
                  formik={formik}
                  fullWidth
                />
              </Grid2>
            </Grid2>

            <Divider />
            <DialogTitle sx={{ p: 3 }}>
              {T.translate("edit_inventory_item.meta_fields")}
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
                                    "edit_inventory_item.meta_field_title"
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
                                    "edit_inventory_item.meta_field_type"
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
                                    "edit_inventory_item.meta_field_required"
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
                                  initialEntity={initialEntity}
                                  onMetaFieldTypeValueDeleted={
                                    onMetaFieldTypeValueDeleted
                                  }
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
                                        "edit_inventory_item.placeholders.meta_field_minimum_quantity"
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
                                        "edit_inventory_item.placeholders.meta_field_maximum_quantity"
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

            <Grid2
              container
              spacing={2}
              sx={{ alignItems: "start", px: 3, py: 1 }}
            >
              <Grid2 size={12}>
                <InputLabel htmlFor="image" id="images">
                  {T.translate("edit_inventory_item.images")} *
                </InputLabel>
                {formik.touched.images && formik.errors.images && (
                  <FormHelperText error>{formik.errors.images}</FormHelperText>
                )}
                <UploadInputV2
                  id="image-upload"
                  name="image"
                  onUploadComplete={handleImageUploadComplete}
                  value={getMediaInputValue()}
                  mediaType={mediaType}
                  onRemove={handleRemoveImage}
                  postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
                  djsConfig={{ withCredentials: true }}
                  maxFiles={mediaType.max_uploads_qty}
                  canAdd={
                    mediaType.is_editable ||
                    (initialEntity.images?.length || 0) <
                      mediaType.max_uploads_qty
                  }
                  parallelChunkUploads
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("edit_inventory_item.save_changes")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

SponsorItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  entity: PropTypes.object
};

export default SponsorItemDialog;
