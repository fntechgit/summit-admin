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
import { addIssAfterDateFieldValidator } from "../../../../utils/yup";
import MuiFormikTextField from "../../../../components/mui/formik-inputs/mui-formik-textfield";
import AdditionalInputList from "../../components/additional-input-list";
import useScrollToError from "../../../../hooks/useScrollToError";
import MuiFormikUpload from "../../../../components/mui/formik-inputs/mui-formik-upload";
import MuiFormikPriceField from "../../../../components/mui/formik-inputs/mui-formik-pricefield";
import FormikTextEditor from "../../../../components/inputs/formik-text-editor";

const buildInitialValues = (data) => {
  const normalized = { ...data };
  return normalized;
};

addIssAfterDateFieldValidator();

const ItemForm = ({ initialValues, onSubmit }) => {
  const formik = useFormik({
    initialValues: buildInitialValues(initialValues),
    validationSchema: yup.object({
      code: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      name: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      description: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      early_bird_rate: yup
        .number(T.translate("validation.number"))
        .required(T.translate("validation.required")),
      standard_rate: yup
        .number(T.translate("validation.number"))
        .required(T.translate("validation.required")),
      onsite_rate: yup
        .number(T.translate("validation.number"))
        .required(T.translate("validation.required")),
      default_quantity: yup
        .number(T.translate("validation.number"))
        .required(T.translate("validation.required"))
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
            <Grid2 size={4}>
              <MuiFormikPriceField
                name="early_bird_rate"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.early_bird_rate"
                )}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikPriceField
                name="standard_rate"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.standard_rate"
                )}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikPriceField
                name="onsite_rate"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.onsite_rate"
                )}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikTextField
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
              <MuiFormikTextField
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
              <MuiFormikTextField
                name="default_quantity"
                label={T.translate(
                  "sponsor_form_item_list.edit_item.default_quantity"
                )}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
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
              <MuiFormikUpload id="item-image-upload" name="images" />
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

export default ItemForm;
