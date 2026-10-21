import React from "react";
import T from "i18n-react";
import { Grid2 } from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import LabelWithInfo from "../label-with-info";

const MaxPerAccountInput = () => (
  <Grid2 size={4}>
    <LabelWithInfo
      htmlFor="quantity_per_account"
      label={T.translate("edit_promocode.quantity_per_account")}
      info={T.translate("edit_promocode.info.quantity_per_account")}
    />
    <MuiFormikTextField
      name="quantity_per_account"
      type="number"
      margin="none"
      fullWidth
      slotProps={{ htmlInput: { min: 0 } }}
      helperText={T.translate(
        "edit_promocode.captions.quantity_per_account_unlimited"
      )}
    />
  </Grid2>
);

export default MaxPerAccountInput;
