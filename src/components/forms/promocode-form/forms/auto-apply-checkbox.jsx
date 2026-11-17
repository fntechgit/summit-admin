import React from "react";
import T from "i18n-react";
import { Typography } from "@mui/material";
import CheckboxWithInfo from "./checkbox-with-info";

// Shared `auto_apply` checkbox. The DomainAuthorized form shows it with the caption,
// the Member/Speaker forms without it.
const AutoApplyCheckbox = ({ withCaption = false }) => (
  <>
    <CheckboxWithInfo
      name="auto_apply"
      label={T.translate("edit_promocode.auto_apply")}
      info={T.translate("edit_promocode.info.auto_apply")}
    />
    {withCaption && (
      <Typography variant="body2" color="text.secondary">
        {T.translate("edit_promocode.captions.auto_apply")}
      </Typography>
    )}
  </>
);

export default AutoApplyCheckbox;
