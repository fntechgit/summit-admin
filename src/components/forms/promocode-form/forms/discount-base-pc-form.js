import React from "react";
import T from "i18n-react";
import { useFormikContext } from "formik";
import { Grid2, InputLabel, Typography } from "@mui/material";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import BasePCForm from "./base-pc-form";
import { DiscountTicketTable } from "../../../tables/dicount-ticket-table";

const DiscountBasePCForm = (props) => {
  const { entity, summit } = props;
  const { values, setFieldValue } = useFormikContext();
  const currencySymbol = summit.default_ticket_type_currency_symbol || "$";

  const handleApplyToAllChange = (ev) => {
    const { checked } = ev.target;
    setFieldValue("apply_to_all_tix", checked);
    if (!checked) {
      setFieldValue("amount", 0);
      setFieldValue("rate", 0);
    }
  };

  return (
    <>
      <BasePCForm {...props} />

      <Grid2 size={12}>
        <InputLabel>
          {T.translate("edit_promocode.apply_to_all_tix_discounts")}
        </InputLabel>
        <MuiFormikCheckbox
          name="apply_to_all_tix"
          label={T.translate("edit_promocode.apply_to_all_tix")}
          margin="none"
          onChange={handleApplyToAllChange}
        />
        <Typography variant="body2" color="text.secondary">
          {T.translate("edit_promocode.apply_to_all_tix_helper")}
        </Typography>
      </Grid2>
      {values.apply_to_all_tix && (
        <>
          <Grid2 size={4}>
            <InputLabel htmlFor="amount">
              {T.translate("edit_promocode.amount")} ({currencySymbol}) *
            </InputLabel>
            <MuiFormikTextField
              name="amount"
              type="number"
              margin="none"
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
              disabled={values.rate > 0}
            />
          </Grid2>
          <Grid2
            size={2}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Typography fontWeight="bold">
              {T.translate("edit_promocode.or")}
            </Typography>
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="rate">
              {T.translate("edit_promocode.rate")} (% discount) *
            </InputLabel>
            <MuiFormikTextField
              name="rate"
              type="number"
              margin="none"
              fullWidth
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              disabled={values.amount > 0}
            />
          </Grid2>
        </>
      )}
      {!values.apply_to_all_tix && (
        <Grid2 size={12}>
          {entity.id !== 0 ? (
            <DiscountTicketTable
              ownerId={entity.id}
              data={entity.ticket_types_rules}
              ticketTypes={summit.ticket_types}
            />
          ) : (
            <Typography>
              {T.translate("edit_promocode.save_before_ticket_rates")}
            </Typography>
          )}
        </Grid2>
      )}
    </>
  );
};

export default DiscountBasePCForm;
