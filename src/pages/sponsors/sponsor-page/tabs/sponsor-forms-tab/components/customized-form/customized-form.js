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
import AdditionalInputList from "openstack-uicore-foundation/lib/components/mui/formik-inputs/additional-input-list";
import MuiFormikDatepicker from "openstack-uicore-foundation/lib/components/mui/formik-inputs/datepicker";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelectGroup from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select-group";
import {
  addIssAfterDateFieldValidator,
  formMetafieldsValidation,
  requiredStringValidation,
  requiredHTMLValidation
} from "../../../../../../../utils/yup";
import useScrollToError from "../../../../../../../hooks/useScrollToError";
import FormikTextEditor from "../../../../../../../components/inputs/formik-text-editor";
import { querySponsorAddons } from "../../../../../../../actions/sponsor-actions";

const buildInitialValues = (data, summitTZ) => {
  const { opens_at, expires_at } = data;
  const normalized = { ...data };
  normalized.opens_at = opens_at
    ? epochToMomentTimeZone(opens_at, summitTZ)
    : null;
  normalized.expires_at = expires_at
    ? epochToMomentTimeZone(expires_at, summitTZ)
    : null;

  normalized.allowed_add_ons = data.apply_to_all_add_ons
    ? ["all"]
    : data.allowed_add_ons;

  return normalized;
};

addIssAfterDateFieldValidator();

const CustomizedForm = ({
  initialValues,
  sponsor,
  summitId,
  summitTZ,
  isSaving = false,
  onSubmit
}) => {
  const sponsorshipIds = sponsor.sponsorships?.map((e) => e.id) || [];

  const formik = useFormik(
    {
      initialValues: buildInitialValues(initialValues, summitTZ),
      validationSchema: yup.object().shape(
        {
          name: requiredStringValidation(),
          code: requiredStringValidation(),
          instructions: requiredHTMLValidation(),
          opens_at: yup
            .date(T.translate("validation.date"))
            .nullable()
            .when("expires_at", {
              is: (val) => !!val,
              then: (schema) =>
                schema.required(T.translate("validation.required")),
              otherwise: (schema) => schema.nullable()
            }),
          expires_at: yup
            .date(T.translate("validation.date"))
            .nullable()
            .when("opens_at", {
              is: (val) => !!val,
              then: (schema) =>
                schema
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
              otherwise: (schema) => schema.nullable()
            }),
          meta_fields: formMetafieldsValidation()
        },
        [["opens_at", "expires_at"]]
      ),
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
                required
              />
            </Grid2>
            <Grid2 size={4} sx={{ pt: "16px" }}>
              <MuiFormikSelectGroup
                name="allowed_add_ons"
                queryFunction={querySponsorAddons}
                // params for function, except input
                queryParams={[summitId, sponsor.id, sponsorshipIds]}
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
          <Button
            type="submit"
            disabled={isSaving}
            fullWidth
            variant="contained"
          >
            {T.translate("edit_sponsor.forms_tab.customized_form.save")}
          </Button>
        </DialogActions>
      </Box>
    </FormikProvider>
  );
};

export default CustomizedForm;
