import React from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid2,
  Typography
} from "@mui/material";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import T from "i18n-react";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import { addIssAfterDateFieldValidator } from "../../../../../utils/yup";
import DropdownCheckbox from "../../../../../components/mui/components/dropdown-checkbox";
import MuiFormikTextField from "../../../../../components/inputs/mui-formik-textfield";
import MuiFormikDatepicker from "../../../../../components/inputs/mui-formik-datepicker";
import AdditionalInputList from "./additional-input-list";
import useScrollToError from "../../../../../hooks/useScrollToError";

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
  onSubmit,
  onDeleteAddtlField,
  onDeleteAddtlFieldValue
}) => {
  const formik = useFormik({
    initialValues: buildInitialValues(initialValues, summitTZ),
    validationSchema: yup.object({
      code: yup
        .string(T.translate("validation.string"))
        .required(T.translate("validation.required")),
      opens_at: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required")),
      expires_at: yup
        .date(T.translate("validation.date"))
        .required(T.translate("validation.required"))
        .isAfterDateField(
          yup.ref("opens_at"),
          T.translate("validation.after", {
            field1: T.translate("sponsor_forms.form_template_popup.expires_at"),
            field2: T.translate("sponsor_forms.form_template_popup.opens_at")
          })
        )
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
            <Grid2 size={4} sx={{ pt: "16px" }}>
              <DropdownCheckbox
                name="sponsorship_type_ids"
                label={T.translate(
                  "sponsor_forms.form_template_popup.sponsorship"
                )}
                allLabel={T.translate(
                  "sponsor_forms.form_template_popup.all_tiers"
                )}
                value={formik.values.sponsorship_type_ids}
                options={sponsorships.items}
                onChange={formik.handleChange}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikDatepicker
                name="opens_at"
                label={T.translate(
                  "sponsor_forms.form_template_popup.opens_at"
                )}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikDatepicker
                name="expires_at"
                label={T.translate(
                  "sponsor_forms.form_template_popup.expires_at"
                )}
              />
            </Grid2>
            <Grid2 size={12}>
              <MuiFormikTextField
                name="instructions"
                label={T.translate(
                  "sponsor_forms.form_template_popup.instructions"
                )}
                fullWidth
                multiline
                rows={4}
              />
            </Grid2>
          </Grid2>
          <Typography variant="h5" sx={{ ml: "26px", mt: "20px" }}>
            {T.translate("sponsor_forms.form_template_popup.additional_fields")}
          </Typography>
          <Box sx={{ px: 3 }}>
            <AdditionalInputList
              name="meta_fields"
              onDelete={onDeleteAddtlField}
              onDeleteValue={onDeleteAddtlFieldValue}
            />
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
