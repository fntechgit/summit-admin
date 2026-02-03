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
  Grid2,
  FormHelperText
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UploadInputV2 } from "openstack-uicore-foundation/lib/components";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY
} from "../../../utils/constants";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";
import MuiFormikPriceField from "../../../components/mui/formik-inputs/mui-formik-pricefield";
import useScrollToError from "../../../hooks/useScrollToError";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import {
  decimalValidation,
  requiredStringValidation,
  positiveNumberValidation,
  formMetafieldsValidation
} from "../../../utils/yup";
import AdditionalInputList from "../../../components/mui/formik-inputs/additional-input/additional-input-list";
import MuiFormikQuantityField from "../../../components/mui/formik-inputs/mui-formik-quantity-field";

const SponsorItemDialog = ({
  open,
  onClose,
  onSave,
  onImageDeleted,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  entity: initialEntity
}) => {
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
              values: []
            }
          ],
      images: initialEntity?.images ?? []
    },
    validationSchema: yup.object().shape({
      code: requiredStringValidation(),
      name: requiredStringValidation(),
      description: requiredStringValidation(),
      images: yup.array(),
      early_bird_rate: decimalValidation(),
      standard_rate: decimalValidation(),
      onsite_rate: decimalValidation(),
      default_quantity: positiveNumberValidation(),
      quantity_limit_per_sponsor: positiveNumberValidation(),
      quantity_limit_per_show: positiveNumberValidation(),
      meta_fields: formMetafieldsValidation()
    }),
    onSubmit: (values) => onSave(values)
  });

  const mediaType = {
    max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
    max_uploads_qty: MAX_INVENTORY_IMAGES_UPLOAD_QTY,
    type: {
      allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS
    }
  };

  useScrollToError(formik);

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
        {initialEntity.id
          ? T.translate("edit_inventory_item.edit_item")
          : T.translate("edit_inventory_item.new_item")}
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
                <MuiFormikPriceField
                  variant="outlined"
                  name="early_bird_rate"
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="standard_rate">
                  {T.translate("edit_inventory_item.standard_rate")}
                </InputLabel>
                <MuiFormikPriceField
                  variant="outlined"
                  name="standard_rate"
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="onsite_rate">
                  {T.translate("edit_inventory_item.onsite_rate")}
                </InputLabel>
                <MuiFormikPriceField
                  variant="outlined"
                  name="onsite_rate"
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
                <MuiFormikQuantityField
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
                <MuiFormikQuantityField
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
                <MuiFormikQuantityField
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
              <AdditionalInputList
                entityId={initialEntity.id}
                name="meta_fields"
                onDelete={onMetaFieldTypeDeleted}
                onDeleteValue={onMetaFieldTypeValueDeleted}
              />
            </Box>

            <Grid2
              container
              spacing={2}
              sx={{ alignItems: "start", px: 3, py: 1 }}
            >
              <Grid2 size={12}>
                <InputLabel htmlFor="image" id="images">
                  {T.translate("edit_inventory_item.images")}
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
