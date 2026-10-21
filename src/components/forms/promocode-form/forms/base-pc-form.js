import React, { useEffect } from "react";
import T from "i18n-react";
import { useFormikContext } from "formik";
import { Grid2, InputLabel, MenuItem, TextField } from "@mui/material";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import MuiFormikDatepicker from "openstack-uicore-foundation/lib/components/mui/formik-inputs/datepicker";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import { isDomainAuthorizedClass } from "./domain-authorized/utils";
import MaxPerAccountInput from "./domain-authorized/MaxPerAccountInput";
import LabelWithInfo from "./label-with-info";

const NOTES_MAX_LENGTH = 2048;

const QTY_FROM_ASSIGNMENTS_CLASSES = [
  "SPEAKERS_PROMO_CODE",
  "SPEAKERS_DISCOUNT_CODE",
  "PRE_PAID_PROMO_CODE",
  "PRE_PAID_DISCOUNT_CODE"
];

const BasePCForm = ({ entity, summit }) => {
  const { values, setFieldValue } = useFormikContext();
  const qtyAvailableDisabled = QTY_FROM_ASSIGNMENTS_CLASSES.includes(
    values.class_name
  );
  const isDomainAuthorized = isDomainAuthorizedClass(values.class_name);

  // speaker assignments update the quantity in redux, outside the form
  useEffect(() => {
    if (qtyAvailableDisabled) {
      setFieldValue("quantity_available", entity.quantity_available ?? 0);
    }
  }, [entity.quantity_available]);

  const badgeFeatureName = (id) =>
    summit.badge_features.find((f) => f.id === id)?.name ?? id;

  return (
    <>
      <Grid2 size={4}>
        <LabelWithInfo
          htmlFor="quantity_available"
          label={T.translate("edit_promocode.quantity_available")}
          info={T.translate("edit_promocode.info.quantity_available")}
        />
        <MuiFormikTextField
          name="quantity_available"
          type="number"
          margin="none"
          fullWidth
          disabled={qtyAvailableDisabled}
        />
      </Grid2>
      <Grid2 size={4}>
        <InputLabel htmlFor="quantity_used">
          {T.translate("edit_promocode.quantity_used")}
        </InputLabel>
        <TextField
          id="quantity_used"
          type="number"
          value={entity.quantity_used || 0}
          fullWidth
          disabled
        />
      </Grid2>
      {isDomainAuthorized ? <MaxPerAccountInput /> : <Grid2 size={4} />}

      <Grid2 size={4}>
        <InputLabel htmlFor="valid_since_date">
          {T.translate("edit_promocode.valid_from_date")} (00:00 hrs)
        </InputLabel>
        <MuiFormikDatepicker
          name="valid_since_date"
          timezone={summit.time_zone_id}
        />
      </Grid2>
      <Grid2 size={4}>
        <InputLabel htmlFor="valid_until_date">
          {T.translate("edit_promocode.valid_until_date")} (00:00 hrs)
        </InputLabel>
        <MuiFormikDatepicker
          name="valid_until_date"
          timezone={summit.time_zone_id}
        />
      </Grid2>
      <Grid2 size={4} />

      <Grid2 size={12}>
        <InputLabel htmlFor="badge_features">
          {T.translate("edit_promocode.badge_features")}
        </InputLabel>
        <MuiFormikCheckbox
          name="badge_features_apply_to_all_tix_retroactively"
          label={T.translate(
            "edit_promocode.badge_features_apply_to_all_tix_retroactively"
          )}
          margin="none"
        />
        <MuiFormikSelect
          name="badge_features"
          multiple
          placeholder={T.translate(
            "edit_promocode.placeholders.select_badge_features"
          )}
          renderValue={(selected) =>
            selected.length ? (
              selected.map(badgeFeatureName).join(", ")
            ) : (
              <span style={{ color: "#aaa" }}>
                {T.translate(
                  "edit_promocode.placeholders.select_badge_features"
                )}
              </span>
            )
          }
        >
          {summit.badge_features.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {f.name}
            </MenuItem>
          ))}
        </MuiFormikSelect>
      </Grid2>

      <Grid2 size={12}>
        <InputLabel htmlFor="notes">
          {T.translate("edit_promocode.notes")}
        </InputLabel>
        <MuiFormikTextField
          name="notes"
          margin="none"
          fullWidth
          multiline
          rows={3}
          maxLength={NOTES_MAX_LENGTH}
        />
      </Grid2>
    </>
  );
};

export default BasePCForm;
