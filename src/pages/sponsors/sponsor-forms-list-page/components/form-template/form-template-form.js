import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid2,
  InputLabel,
  Typography
} from "@mui/material";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import T from "i18n-react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import {
  addIssAfterDateFieldValidator,
  formMetafieldsValidation,
  opensAtValidation,
  requiredHTMLValidation,
  requiredStringValidation
} from "../../../../../utils/yup";
import DropdownCheckbox from "../../../../../components/mui/dropdown-checkbox";
import MuiFormikTextField from "../../../../../components/mui/formik-inputs/mui-formik-textfield";
import MuiFormikDatepicker from "../../../../../components/mui/formik-inputs/mui-formik-datepicker";
import AdditionalInputList from "../../../../../components/mui/formik-inputs/additional-input/additional-input-list";
import useScrollToError from "../../../../../hooks/useScrollToError";
import FormikTextEditor from "../../../../../components/inputs/formik-text-editor";

const buildInitialValues = (data, summitTZ) => {
  const { opens_at, expires_at } = data;
  const normalized = { ...data };
  normalized.opens_at = opens_at
    ? epochToMomentTimeZone(opens_at, summitTZ)
    : null;
  normalized.expires_at = expires_at
    ? epochToMomentTimeZone(expires_at, summitTZ)
    : null;

  return normalized;
};

addIssAfterDateFieldValidator();

const FormTemplateForm = ({
  initialValues,
  sponsorships,
  summitTZ,
  onSubmit
}) => {
  const formik = useFormik({
    initialValues: buildInitialValues(initialValues, summitTZ),
    validationSchema: yup.object({
      code: requiredStringValidation(),
      instructions: requiredHTMLValidation(),
      opens_at: opensAtValidation(),
      expires_at: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required"))
        .isAfterDateField(
          yup.ref("opens_at"),
          T.translate("validation.after", {
            field1: T.translate("sponsor_forms.form_template_popup.expires_at"),
            field2: T.translate("sponsor_forms.form_template_popup.opens_at")
          })
        ),
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
                label={T.translate("sponsor_forms.form_template_popup.code")}
                fullWidth
                required
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikTextField
                name="name"
                label={T.translate("sponsor_forms.form_template_popup.name")}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <DropdownCheckbox
                name="sponsorship_types"
                allName="apply_to_all_types"
                label={T.translate(
                  "sponsor_forms.form_template_popup.sponsorship"
                )}
                allLabel={T.translate(
                  "sponsor_forms.form_template_popup.all_tiers"
                )}
                value={formik.values.sponsorship_types}
                options={sponsorships.items}
                onChange={formik.handleChange}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikDatepicker
                name="opens_at"
                required
                label={T.translate(
                  "sponsor_forms.form_template_popup.opens_at"
                )}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikDatepicker
                required
                name="expires_at"
                label={T.translate(
                  "sponsor_forms.form_template_popup.expires_at"
                )}
              />
            </Grid2>
            <Grid2 size={12}>
              <InputLabel htmlFor="instructions">
                {T.translate("sponsor_forms.form_template_popup.instructions")}{" "}
                *
              </InputLabel>
              <FormikTextEditor
                name="instructions"
                options={{ zIndex: 9999999 }}
              />
            </Grid2>
          </Grid2>
          <Typography variant="h6" sx={{ ml: "26px", mt: "20px" }}>
            {T.translate("sponsor_forms.form_template_popup.additional_fields")}
          </Typography>
          <Box sx={{ px: 3 }}>
            <AdditionalInputList name="meta_fields" />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("sponsor_forms.form_template_popup.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default FormTemplateForm;
