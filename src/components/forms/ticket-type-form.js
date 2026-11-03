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

import React, { useEffect, useRef, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormHelperText,
  Grid2,
  InputLabel,
  TextField,
  Tooltip
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import { hasErrors, scrollToError, shallowEqual } from "../../utils/methods";
import { TEXT_MAX_LENGTH_255 } from "../../utils/constants";

const InfoTooltip = ({ title }) => (
  <Tooltip title={title}>
    <InfoOutlinedIcon
      fontSize="small"
      sx={{ ml: 0.5, verticalAlign: "middle", color: "text.secondary" }}
    />
  </Tooltip>
);

const TicketTypeForm = ({
  entity: propsEntity,
  errors: propsErrors,
  currentSummit,
  isSaving,
  onSubmit
}) => {
  const [entity, setEntity] = useState({ ...propsEntity });
  const [errors, setErrors] = useState(propsErrors);
  const prevEntityRef = useRef(propsEntity);
  const prevErrorsRef = useRef(propsErrors);

  useEffect(() => {
    scrollToError(propsErrors);
  }, [propsErrors]);

  useEffect(() => {
    if (!shallowEqual(prevEntityRef.current, propsEntity)) {
      setEntity({ ...propsEntity });
      setErrors({});
    }
    prevEntityRef.current = propsEntity;
  }, [propsEntity]);

  useEffect(() => {
    if (!shallowEqual(prevErrorsRef.current, propsErrors)) {
      setErrors({ ...propsErrors });
    }
    prevErrorsRef.current = propsErrors;
  }, [propsErrors]);

  const setField = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setEntity((prev) => ({ ...prev, [field]: value }));
  };

  const handleChange = (ev) => {
    const { name, type, checked } = ev.target;
    const value = type === "checkbox" ? checked : ev.target.value;
    setField(name, value);
  };

  const handleDateChange = (field) => (value) => {
    if (value === null) {
      setField(field, 0);
    } else if (value.isValid()) {
      setField(field, value.unix());
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit(entity);
  };

  const fieldError = (field) => {
    const error = hasErrors(field, errors);
    return { error: !!error, helperText: error || undefined };
  };

  const currency_ddl = currentSummit.supported_currencies.map((i) => ({
    label: i,
    value: i
  }));
  const badge_type_ddl = currentSummit.badge_types
    ? currentSummit.badge_types.map((bt) => ({
        label: bt.name,
        value: bt.id
      }))
    : [];

  const audience_ddl = [
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

  const description = entity.description || "";

  return (
    <Box component="form" noValidate>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="name">
            {T.translate("edit_ticket_type.name")} *
          </InputLabel>
          <TextField
            id="name"
            name="name"
            value={entity.name}
            onChange={handleChange}
            size="small"
            fullWidth
            {...fieldError("name")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="external_id">
            {T.translate("edit_ticket_type.external_id")}
          </InputLabel>
          <TextField
            id="external_id"
            name="external_id"
            value={entity.external_id}
            onChange={handleChange}
            size="small"
            fullWidth
            {...fieldError("external_id")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel id="badge_type_id-label" htmlFor="badge_type_id">
            {T.translate("edit_ticket_type.badge_type_id")}
          </InputLabel>
          <MuiDropdown
            id="badge_type_id"
            name="badge_type_id"
            value={entity.badge_type_id || ""}
            onChange={handleChange}
            options={badge_type_ddl}
            placeholder={T.translate(
              "edit_ticket_type.placeholders.select_badge_type"
            )}
            size="small"
            SelectDisplayProps={{ id: "badge_type_id" }}
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 4 }}>
        <Grid2 size={{ xs: 12, md: 8 }}>
          <InputLabel htmlFor="description">
            {T.translate("edit_ticket_type.description")}
          </InputLabel>
          <TextField
            id="description"
            name="description"
            value={description}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            helperText={`${description.length}/${TEXT_MAX_LENGTH_255}`}
            slotProps={{
              htmlInput: { maxLength: TEXT_MAX_LENGTH_255 },
              formHelperText: { sx: { right: 0 } }
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }} sx={{ position: "relative" }}>
          <InputLabel id="audience-label" htmlFor="audience">
            {T.translate("edit_ticket_type.audience")}
            {entity.audience === "WithPromoCode" && (
              <InfoTooltip
                title={T.translate(
                  "edit_ticket_type.info_audience_with_promo_code"
                )}
              />
            )}
          </InputLabel>
          <MuiDropdown
            id="audience"
            name="audience"
            value={entity.audience || ""}
            onChange={handleChange}
            options={audience_ddl}
            placeholder={T.translate(
              "edit_ticket_type.placeholders.select_audience"
            )}
            size="small"
            error={!!hasErrors("audience", errors)}
            SelectDisplayProps={{ id: "audience" }}
          />
          {hasErrors("audience", errors) && (
            <FormHelperText error>
              {hasErrors("audience", errors)}
            </FormHelperText>
          )}
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="cost">
            {T.translate("edit_ticket_type.cost")}
          </InputLabel>
          <TextField
            id="cost"
            name="cost"
            value={entity.cost}
            onChange={handleChange}
            size="small"
            fullWidth
            {...fieldError("cost")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }} sx={{ position: "relative" }}>
          <InputLabel id="currency-label" htmlFor="currency">
            {T.translate("edit_ticket_type.currency")}
          </InputLabel>
          <MuiDropdown
            id="currency"
            name="currency"
            value={entity.currency || ""}
            onChange={handleChange}
            options={currency_ddl}
            placeholder={T.translate(
              "edit_ticket_type.placeholders.select_currency"
            )}
            size="small"
            error={!!hasErrors("currency", errors)}
            SelectDisplayProps={{ id: "currency" }}
          />
          {hasErrors("currency", errors) && (
            <FormHelperText error>
              {hasErrors("currency", errors)}
            </FormHelperText>
          )}
        </Grid2>
        <Grid2
          size={{ xs: 12, md: 4 }}
          sx={{ display: "flex", alignItems: "flex-end" }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="allows_to_delegate"
                  name="allows_to_delegate"
                  checked={!!entity.allows_to_delegate}
                  onChange={handleChange}
                />
              }
              label={T.translate("edit_ticket_type.allows_to_delegate")}
              sx={{ mr: 0, mb: 0 }}
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
          <TextField
            id="quantity_2_sell"
            name="quantity_2_sell"
            type="number"
            value={entity.quantity_2_sell}
            onChange={handleChange}
            size="small"
            fullWidth
            {...fieldError("quantity_2_sell")}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="max_quantity_per_order">
            {T.translate("edit_ticket_type.max_quantity_to_sell_per_order")}
          </InputLabel>
          <TextField
            id="max_quantity_per_order"
            name="max_quantity_per_order"
            type="number"
            value={entity.max_quantity_per_order}
            onChange={handleChange}
            size="small"
            fullWidth
            {...fieldError("max_quantity_per_order")}
          />
        </Grid2>
        <Grid2
          size={{ xs: 12, md: 4 }}
          sx={{ display: "flex", alignItems: "flex-end" }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="allows_to_reassign"
                  name="allows_to_reassign"
                  checked={!!entity.allows_to_reassign}
                  onChange={handleChange}
                />
              }
              label={T.translate("edit_ticket_type.allows_to_reassign")}
              sx={{ mr: 0, mb: 0 }}
            />
            <InfoTooltip
              title={T.translate("edit_ticket_type.allows_to_reassign_info")}
            />
          </Box>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="sales_start_date">
            {T.translate("edit_ticket_type.sales_start_date")}
          </InputLabel>
          <DateTimePicker
            value={
              epochToMomentTimeZone(
                entity.sales_start_date,
                currentSummit.time_zone_id
              ) || null
            }
            onChange={handleDateChange("sales_start_date")}
            timezone={currentSummit.time_zone_id}
            format="YYYY-MM-DD HH:mm"
            ampm={false}
            slotProps={{
              textField: {
                id: "sales_start_date",
                size: "small",
                fullWidth: true
              },
              field: { clearable: true }
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="sales_end_date">
            {T.translate("edit_ticket_type.sales_end_date")}
          </InputLabel>
          <DateTimePicker
            value={
              epochToMomentTimeZone(
                entity.sales_end_date,
                currentSummit.time_zone_id
              ) || null
            }
            onChange={handleDateChange("sales_end_date")}
            timezone={currentSummit.time_zone_id}
            format="YYYY-MM-DD HH:mm"
            ampm={false}
            slotProps={{
              textField: {
                id: "sales_end_date",
                size: "small",
                fullWidth: true
              },
              field: { clearable: true }
            }}
          />
        </Grid2>
      </Grid2>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
          {T.translate("general.save")}
        </Button>
      </Box>
    </Box>
  );
};

export default TicketTypeForm;
