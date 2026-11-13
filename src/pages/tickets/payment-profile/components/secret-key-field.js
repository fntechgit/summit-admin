import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, InputLabel, Typography } from "@mui/material";
import { useFormikContext } from "formik";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import InfoTooltip from "./info-tooltip";

const SecretKeyField = ({ name, label, isSet, required }) => {
  const { setFieldValue } = useFormikContext();
  const [isReplacing, setIsReplacing] = useState(false);

  const handleToggleReplace = () => {
    if (isReplacing) setFieldValue(name, "");
    setIsReplacing(!isReplacing);
  };

  return (
    <>
      <InputLabel htmlFor={name}>
        {label}
        <InfoTooltip
          title={T.translate("edit_payment_profile.info_stripe_keys")}
        />
      </InputLabel>
      {(!isSet || isReplacing) && (
        <MuiFormikTextField
          name={name}
          type="password"
          autoComplete="new-password"
          required={required}
          fullWidth
          variant="outlined"
        />
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {T.translate(
            isSet
              ? "edit_payment_profile.secret_key_set"
              : "edit_payment_profile.secret_key_not_set"
          )}
        </Typography>
        {isSet && (
          <Button size="small" onClick={handleToggleReplace}>
            {T.translate(
              isReplacing ? "general.cancel" : "edit_payment_profile.replace"
            )}
          </Button>
        )}
      </Box>
    </>
  );
};

SecretKeyField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isSet: PropTypes.bool,
  required: PropTypes.bool
};

SecretKeyField.defaultProps = {
  isSet: false,
  required: false
};

export default SecretKeyField;
