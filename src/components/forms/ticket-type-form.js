/**
 * Copyright 2019 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import moment from "moment-timezone";
import {
  Box,
  Button,
  Divider,
  Grid2,
  InputLabel,
  MenuItem
} from "@mui/material";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import MuiFormikPriceField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/price-field";
import MuiFormikQuantityField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/quantity-field";
import MuiFormikDatetimepicker from "../mui/formik-inputs/mui-formik-datetimepicker";
import InfoTooltip from "../mui/info-tooltip";
import useScrollToError from "../../hooks/useScrollToError";
import { requiredStringValidation } from "../../utils/yup";
import { TEXT_MAX_LENGTH_255 } from "../../utils/constants";

const DATE_FIELDS = ["sales_start_date", "sales_end_date"];

const dateValidation = () =>
  yup
    .mixed()
    .nullable()
    .test(
      "valid-date",
      T.translate("validation.date"),
      (value) => value == null || (moment.isMoment(value) && value.isValid())
    );

const validationSchema = yup.object().shape({
  name: requiredStringValidation(),
  sales_start_date: dateValidation(),
  sales_end_date: dateValidation()
});

const buildInitialValues = (entity, timezone) => {
  const values = {
    ...entity,
    name: entity.name ?? "",
    external_id: entity.external_id || "",
    badge_type_id: entity.badge_type_id || "",
    description: entity.description ?? "",
    currency: entity.currency || "",
    audience: entity.audience || "",
    allows_to_delegate: !!entity.allows_to_delegate,
    allows_to_reassign: !!entity.allows_to_reassign
  };
  DATE_FIELDS.forEach((field) => {
    values[field] = entity[field]
      ? epochToMomentTimeZone(entity[field], timezone)
      : null;
  });
  return values;
};

const renderOptionLabel = (options, placeholder) => (selected) =>
  selected ? (
    options.find((op) => op.value === selected)?.label
  ) : (
    <span style={{ color: "#aaa" }}>{placeholder}</span>
  );

const CHECKBOX_WITH_INFO_SX = {
  display: "flex",
  alignItems: "center",
  "& .MuiFormControl-root": { width: "auto" }
};

const TicketTypeForm = ({ entity, errors, currentSummit, onSubmit }) => {
  const handleSubmit = (values) => {
    const normalized = { ...values };
    // 0 clears the date, see normalizeEntity in ticket-actions
    DATE_FIELDS.forEach((field) => {
      normalized[field] = values[field] ? values[field].unix() : 0;
    });
    return onSubmit(normalized);
  };

  const formik = useFormik({
    initialValues: buildInitialValues(entity, currentSummit.time_zone_id),
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit
  });

  useScrollToError(formik);

  // the picker never blurs into formik, so touch on change to surface an
  // invalid date as soon as it is typed instead of only after a submit
  const handleDateChange = (field) => (value) => {
    formik.setFieldTouched(field, true, false);
    formik.setFieldValue(field, value);
  };

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      formik.setErrors(errors);
      formik.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        false
      );
    }
  }, [errors]);

  const currencyOptions = currentSummit.supported_currencies.map((i) => ({
    label: i,
    value: i
  }));

  const badgeTypeOptions = (currentSummit.badge_types || []).map((bt) => ({
    label: bt.name,
    value: bt.id
  }));

  const audienceOptions = [
    { label: "With Invitation", value: "WithInvitation" },
    { label: "Without Invitation", value: "WithoutInvitation" },
    { label: "All", value: "All" },
    // Additive audience added with the domain-authorized promo code feature.
    // See sds/promo-codes-for-early-registration-access-summit-admin.md.
    {
      label: T.translate("edit_ticket_type.audience_with_promo_code"),
      value: "WithPromoCode"
    }
  ];

  const badgeTypePlaceholder = T.translate(
    "edit_ticket_type.placeholders.select_badge_type"
  );
  const audiencePlaceholder = T.translate(
    "edit_ticket_type.placeholders.select_audience"
  );

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="name">
              {T.translate("edit_ticket_type.name")} *
            </InputLabel>
            <MuiFormikTextField
              id="name"
              name="name"
              size="small"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="external_id">
              {T.translate("edit_ticket_type.external_id")}
            </InputLabel>
            <MuiFormikTextField
              id="external_id"
              name="external_id"
              size="small"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="badge_type_id">
              {T.translate("edit_ticket_type.badge_type_id")}
            </InputLabel>
            <MuiFormikSelect
              name="badge_type_id"
              size="small"
              placeholder={badgeTypePlaceholder}
              renderValue={renderOptionLabel(
                badgeTypeOptions,
                badgeTypePlaceholder
              )}
            >
              {badgeTypeOptions.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <InputLabel htmlFor="description">
              {T.translate("edit_ticket_type.description")}
            </InputLabel>
            <MuiFormikTextField
              id="description"
              name="description"
              multiline
              rows={4}
              margin="none"
              maxLength={TEXT_MAX_LENGTH_255}
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="audience">
              {T.translate("edit_ticket_type.audience")}
              {formik.values.audience === "WithPromoCode" && (
                <InfoTooltip
                  title={T.translate(
                    "edit_ticket_type.info_audience_with_promo_code"
                  )}
                />
              )}
            </InputLabel>
            <MuiFormikSelect
              name="audience"
              size="small"
              placeholder={audiencePlaceholder}
              renderValue={renderOptionLabel(
                audienceOptions,
                audiencePlaceholder
              )}
            >
              {audienceOptions.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="cost">
              {T.translate("edit_ticket_type.cost")}
            </InputLabel>
            <MuiFormikPriceField
              id="cost"
              name="cost"
              size="small"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="currency">
              {T.translate("edit_ticket_type.currency")}
            </InputLabel>
            <MuiFormikSelect
              name="currency"
              size="small"
              placeholder={T.translate(
                "edit_ticket_type.placeholders.select_currency"
              )}
            >
              {currencyOptions.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
          <Grid2
            size={{ xs: 12, md: 4 }}
            sx={{ display: "flex", alignItems: "flex-end" }}
          >
            <Box sx={CHECKBOX_WITH_INFO_SX}>
              <MuiFormikCheckbox
                name="allows_to_delegate"
                margin="none"
                label={T.translate("edit_ticket_type.allows_to_delegate")}
              />
              <InfoTooltip
                title={T.translate("edit_ticket_type.allows_to_delegate_info")}
              />
            </Box>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="quantity_2_sell">
              {T.translate("edit_ticket_type.quantity_to_sell")}
            </InputLabel>
            <MuiFormikQuantityField
              id="quantity_2_sell"
              name="quantity_2_sell"
              size="small"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="max_quantity_per_order">
              {T.translate("edit_ticket_type.max_quantity_to_sell_per_order")}
            </InputLabel>
            <MuiFormikQuantityField
              id="max_quantity_per_order"
              name="max_quantity_per_order"
              size="small"
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2
            size={{ xs: 12, md: 4 }}
            sx={{ display: "flex", alignItems: "flex-end" }}
          >
            <Box sx={CHECKBOX_WITH_INFO_SX}>
              <MuiFormikCheckbox
                name="allows_to_reassign"
                margin="none"
                label={T.translate("edit_ticket_type.allows_to_reassign")}
              />
              <InfoTooltip
                title={T.translate("edit_ticket_type.allows_to_reassign_info")}
              />
            </Box>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel>
              {T.translate("edit_ticket_type.sales_start_date")}
            </InputLabel>
            <MuiFormikDatetimepicker
              name="sales_start_date"
              onChange={handleDateChange("sales_start_date")}
              timezone={currentSummit.time_zone_id}
              format="YYYY-MM-DD HH:mm"
              ampm={false}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel>
              {T.translate("edit_ticket_type.sales_end_date")}
            </InputLabel>
            <MuiFormikDatetimepicker
              name="sales_end_date"
              onChange={handleDateChange("sales_end_date")}
              timezone={currentSummit.time_zone_id}
              format="YYYY-MM-DD HH:mm"
              ampm={false}
            />
          </Grid2>
        </Grid2>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            type="submit"
            disabled={formik.isSubmitting}
          >
            {T.translate("general.save")}
          </Button>
        </Box>
      </Box>
    </FormikProvider>
  );
};

TicketTypeForm.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.number
  }).isRequired,
  errors: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  currentSummit: PropTypes.shape({
    time_zone_id: PropTypes.string,
    supported_currencies: PropTypes.arrayOf(PropTypes.string),
    badge_types: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  onSubmit: PropTypes.func.isRequired
};

TicketTypeForm.defaultProps = {
  errors: {}
};

export default TicketTypeForm;
