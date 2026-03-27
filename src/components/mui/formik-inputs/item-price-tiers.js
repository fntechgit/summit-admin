import React from "react";
import T from "i18n-react";
import { useFormikContext } from "formik";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid2,
  InputLabel,
  TextField
} from "@mui/material";
import MuiFormikPriceField from "./mui-formik-pricefield";
import { RATE_FIELDS, isRateEnabled } from "../../../utils/rate-helpers";

const TIERS = [
  { field: RATE_FIELDS.EARLY_BIRD, label: "price_tiers.early_bird_rate" },
  { field: RATE_FIELDS.STANDARD, label: "price_tiers.standard_rate" },
  { field: RATE_FIELDS.ONSITE, label: "price_tiers.onsite_rate" }
];

const ItemPriceTiers = ({ readOnly = false }) => {
  const { values, setFieldValue } = useFormikContext();

  const enabled = {
    [RATE_FIELDS.EARLY_BIRD]: isRateEnabled(values[RATE_FIELDS.EARLY_BIRD]),
    [RATE_FIELDS.STANDARD]: isRateEnabled(values[RATE_FIELDS.STANDARD]),
    [RATE_FIELDS.ONSITE]: isRateEnabled(values[RATE_FIELDS.ONSITE])
  };

  const handleToggle = (field, checked) => {
    setFieldValue(field, checked ? null : 0);
  };

  return (
    <Grid2 container spacing={2} size={12}>
      {TIERS.map(({ field, label }) => {
        const isEnabled = enabled[field];
        return (
          <Grid2 key={field} size={4}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <InputLabel htmlFor={field}>{T.translate(label)}</InputLabel>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!isEnabled}
                    onChange={(ev) => handleToggle(field, ev.target.checked)}
                    size="small"
                    disabled={readOnly}
                    inputProps={{
                      "aria-label": `${T.translate(label)} ${T.translate(
                        "price_tiers.not_available"
                      )}`
                    }}
                  />
                }
                label={T.translate("price_tiers.not_available")}
              />
            </Box>
            <Box>
              {isEnabled ? (
                <MuiFormikPriceField
                  name={field}
                  fullWidth
                  disabled={readOnly}
                />
              ) : (
                <TextField
                  disabled
                  value={T.translate("price_tiers.not_available")}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
              )}
            </Box>
          </Grid2>
        );
      })}
    </Grid2>
  );
};

export default ItemPriceTiers;
