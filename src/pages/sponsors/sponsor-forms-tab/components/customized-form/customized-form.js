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
  requiredStringValidation
} from "../../../../../utils/yup";
import MuiFormikTextField from "../../../../../components/mui/formik-inputs/mui-formik-textfield";
import MuiFormikDatepicker from "../../../../../components/mui/formik-inputs/mui-formik-datepicker";
import AdditionalInputList from "../../../../../components/mui/formik-inputs/additional-input/additional-input-list";
import useScrollToError from "../../../../../hooks/useScrollToError";
import FormikTextEditor from "../../../../../components/inputs/formik-text-editor";
import { querySponsorAddons } from "../../../../../actions/sponsor-actions";
import MuiFormikSelectGroup from "../../../../../components/mui/formik-inputs/mui-formik-select-group";

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

const CustomizedForm = ({
  initialValues,
  sponsor,
  summitId,
  summitTZ,
  onSubmit
}) => {
  const sponsorships = sponsor.sponsorships_collection.sponsorships.map(
    (e) => e.id
  );

  const formik = useFormik(
    {
      initialValues: buildInitialValues(initialValues, summitTZ),
      validationSchema: yup.object().shape({
        code: requiredStringValidation(),
        instructions: requiredStringValidation(),
        opens_at: opensAtValidation(),
        expires_at: yup
          .date(T.translate("validation.date"))
          .required(T.translate("validation.required"))
          .isAfterDateField(
            yup.ref("opens_at"),
            T.translate("validation.after", {
              field1: T.translate(
                "edit_sponsor.forms_tab.customized_form.expires_at"
              ),
              field2: T.translate(
                "edit_sponsor.forms_tab.customized_form.opens_at"
              )
            })
          ),
        meta_fields: formMetafieldsValidation()
      }),
      onSubmit,
      enableReinitialize: true
    },
    [initialValues]
  );

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
                label={T.translate(
                  "edit_sponsor.forms_tab.customized_form.code"
                )}
                fullWidth
                required
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikTextField
                name="name"
                label={T.translate(
                  "edit_sponsor.forms_tab.customized_form.name"
                )}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4} sx={{ pt: "16px" }}>
              <MuiFormikSelectGroup
                name="allowed_add_ons"
                queryFunction={querySponsorAddons}
                // params for function, except input
                queryParams={[summitId, sponsor.id, sponsorships]}
                showSelectAll
                getGroupId={(addon) => addon.sponsorship.type.id}
                getGroupLabel={(addon) => addon.sponsorship.type.type.name}
                placeholder={T.translate(
                  "edit_sponsor.placeholders.select_add_ons"
                )}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikDatepicker
                name="opens_at"
                label={T.translate(
                  "edit_sponsor.forms_tab.customized_form.opens_at"
                )}
              />
            </Grid2>
            <Grid2 size={4}>
              <MuiFormikDatepicker
                name="expires_at"
                label={T.translate(
                  "edit_sponsor.forms_tab.customized_form.expires_at"
                )}
              />
            </Grid2>
            <Grid2 size={12}>
              <InputLabel htmlFor="instructions">
                {T.translate(
                  "edit_sponsor.forms_tab.customized_form.instructions"
                )}{" "}
                *
              </InputLabel>
              <FormikTextEditor name="instructions" />
            </Grid2>
          </Grid2>
          <Typography variant="h6" sx={{ ml: "26px", mt: "20px" }}>
            {T.translate(
              "edit_sponsor.forms_tab.customized_form.additional_fields"
            )}
          </Typography>
          <Box sx={{ px: 3 }}>
            <AdditionalInputList name="meta_fields" />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button type="submit" fullWidth variant="contained">
            {T.translate("edit_sponsor.forms_tab.customized_form.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default CustomizedForm;
