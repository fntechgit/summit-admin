import React from "react";
import T from "i18n-react";
import { Button, Checkbox, FormControlLabel, Grid2 } from "@mui/material";

// email_sent and redeemed are server-side state, shown read-only from the saved promo code
const EmailRedeemForm = ({ entity, onSendEmail }) => (
  <>
    <Grid2 size={3}>
      <FormControlLabel
        control={<Checkbox checked={!!entity.email_sent} disabled />}
        label={T.translate("edit_promocode.email_sent")}
      />
    </Grid2>
    <Grid2 size={3}>
      <FormControlLabel
        control={<Checkbox checked={!!entity.redeemed} disabled />}
        label={T.translate("edit_promocode.redeemed")}
      />
    </Grid2>
    <Grid2 size={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
      {entity.id !== 0 && (
        <Button variant="outlined" onClick={() => onSendEmail(entity.id)}>
          {T.translate("edit_promocode.send_email")}
        </Button>
      )}
    </Grid2>
  </>
);

export default EmailRedeemForm;
