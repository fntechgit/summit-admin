import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  FormLabel,
  Grid2,
  InputLabel,
  Typography
} from "@mui/material";
import T from "i18n-react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import { UploadInputV3 } from "openstack-uicore-foundation/lib/components";
import {
  addIssAfterDateFieldValidator,
  nullableDecimalValidation,
  formMetafieldsValidation,
  positiveNumberValidation,
  requiredHTMLValidation,
  requiredStringValidation
} from "../../../../utils/yup";
import MuiFormikTextField from "../../../../components/mui/formik-inputs/mui-formik-textfield";
import AdditionalInputList from "../../../../components/mui/formik-inputs/additional-input/additional-input-list";
import useScrollToError from "../../../../hooks/useScrollToError";
import ItemPriceTiers from "../../../../components/mui/formik-inputs/item-price-tiers";
import FormikTextEditor from "../../../../components/inputs/formik-text-editor";
import MuiFormikQuantityField from "../../../../components/mui/formik-inputs/mui-formik-quantity-field";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY
} from "../../../../utils/constants";

const buildInitialValues = (data) => ({ ...data });

addIssAfterDateFieldValidator();

const SponsorFormItemForm = ({ initialValues, onSubmit }) => {
  const formik = useFormik({
    initialValues: buildInitialValues(initialValues),
    validationSchema: yup.object({
      code: requiredStringValidation(),
      name: requiredStringValidation(),
      description: requiredHTMLValidation(),
      early_bird_rate: nullableDecimalValidation(),
      standard_rate: nullableDecimalValidation(),
      onsite_rate: nullableDecimalValidation(),
      default_quantity: positiveNumberValidation().required(
        T.translate("validation.required")
      ),
      quantity_limit_per_sponsor: positiveNumberValidation(),
      quantity_limit_per_show: positiveNumberValidation(),
      meta_fields: formMetafieldsValidation()
    }),
    onSubmit,
    enableReinitialize: true
  });

  // SCROLL TO ERROR
  useScrollToError(formik);

  return (
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
              <MuiFormikTextField
                name="code"
                label={T.translate("sponsor_form_item_list.edit_item.code")}
                fullWidth
                required
              />
            </Grid2>
            <Grid2 size={8}>
              <MuiFormikTextField
                name="name"
                label={T.translate("sponsor_form_item_list.edit_item.name")}
                fullWidth
                required
              />
            </Grid2>
            <Grid2 size={12}>
              <InputLabel htmlFor="description">
                {T.translate("sponsor_form_item_list.edit_item.description")} *
              </InputLabel>
              <FormikTextEditor
                name="description"
                options={{ zIndex: 9999999 }}
              />
            </Grid2>
            <ItemPriceTiers />
            <Grid2 size={4}>
              <MuiFormikQuantityField
                name="quantity_limit_per_show"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.quantity_limit_per_show"
                )}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikQuantityField
                name="quantity_limit_per_sponsor"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.quantity_limit_per_sponsor"
                )}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikQuantityField
                name="default_quantity"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.default_quantity"
                )}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                required
              />
            </Grid2>
          </Grid2>
          <Grid2 size={12}>
            <Box sx={{ px: 3, my: "10px" }}>
              <Typography variant="h5">
                {T.translate(
                  "sponsor_form_item_list.edit_item.additional_fields"
                )}
              </Typography>
              <AdditionalInputList name="meta_fields" />
            </Box>
          </Grid2>
          <Grid2 size={12}>
            <Box sx={{ px: 3, my: "10px" }}>
              <FormLabel>
                {T.translate("sponsor_form_item_list.edit_item.images")}
              </FormLabel>
              <UploadInputV3
                id="item-image-upload"
                value={formik.values.images || []}
                onRemove={(file) => {
                  const newImages = (formik.values.images || []).filter(
                    (img) => img.filename !== file.name
                  );
                  formik.setFieldValue("images", newImages);
                }}
                postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
                mediaType={{
                  type: { allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS },
                  max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE
                }}
                onUploadComplete={(response) => {
                  if (response && response.file) {
                    const newImages = [
                      ...(formik.values.images || []),
                      response.file
                    ];
                    formik.setFieldValue("images", newImages);
                  }
                }}
                maxFiles={MAX_INVENTORY_IMAGES_UPLOAD_QTY}
              />
            </Box>
          </Grid2>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("sponsor_form_item_list.edit_item.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default SponsorFormItemForm;
