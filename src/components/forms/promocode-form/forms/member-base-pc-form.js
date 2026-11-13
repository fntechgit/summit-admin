import React, { useEffect, useState } from "react";
import T from "i18n-react";
import { useField, useFormikContext } from "formik";
import { Autocomplete, Grid2, InputLabel, TextField } from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import { queryMembers } from "openstack-uicore-foundation/lib/utils/query-actions";
import EmailRedeemForm from "./email-redeem-form";
import AutoApplyCheckbox from "./auto-apply-checkbox";

// the owner doesn't need to be a member: a typed email is kept as is, picking a member also fills the name
const OwnerEmailInput = () => {
  const [field, meta, helpers] = useField("email");
  const { setFieldValue } = useFormikContext();
  const [options, setOptions] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (input) queryMembers(input, setOptions);
  }, [input]);

  const handleChange = (_ev, selected) => {
    if (selected && typeof selected === "object") {
      helpers.setValue(selected.email);
      setFieldValue("first_name", selected.first_name ?? "");
      setFieldValue("last_name", selected.last_name ?? "");
      return;
    }
    helpers.setValue(selected ?? "");
  };

  return (
    <Autocomplete
      id="email"
      freeSolo
      options={options}
      value={field.value}
      onChange={handleChange}
      onInputChange={(_ev, value, reason) => {
        setInput(value);
        if (reason === "input") helpers.setValue(value);
      }}
      filterOptions={(opts) => opts}
      getOptionLabel={(option) => option.email ?? option}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {`${option.first_name} ${option.last_name} (${option.email})`}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          name="email"
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched && meta.error}
        />
      )}
    />
  );
};

const MemberBasePCForm = ({ entity, onSendEmail }) => (
  <>
    <Grid2 size={4}>
      <InputLabel htmlFor="email">
        {T.translate("edit_purchase_order.owner_email")} *
      </InputLabel>
      <OwnerEmailInput />
    </Grid2>
    <Grid2 size={4}>
      <InputLabel htmlFor="first_name">
        {T.translate("edit_purchase_order.owner_first_name")} *
      </InputLabel>
      <MuiFormikTextField name="first_name" margin="none" fullWidth />
    </Grid2>
    <Grid2 size={4}>
      <InputLabel htmlFor="last_name">
        {T.translate("edit_purchase_order.owner_last_name")} *
      </InputLabel>
      <MuiFormikTextField name="last_name" margin="none" fullWidth />
    </Grid2>
    <Grid2 size={12}>
      <AutoApplyCheckbox />
    </Grid2>
    <EmailRedeemForm entity={entity} onSendEmail={onSendEmail} />
  </>
);

export default MemberBasePCForm;
