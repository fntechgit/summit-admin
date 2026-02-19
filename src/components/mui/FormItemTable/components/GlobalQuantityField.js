import React, { useEffect } from "react";
import { useField } from "formik";
import MuiFormikTextField from "../../formik-inputs/mui-formik-textfield";

const GlobalQuantityField = ({ row, extraColumns, value }) => {
  const name = `i-${row.form_item_id}-c-global-f-quantity`;
  // eslint-disable-next-line
  const [field, meta, helpers] = useField(name);

  // using readOnly since formik won't validate disabled fields
  const isReadOnly =
    extraColumns.filter((eq) => eq.type === "Quantity").length > 0;

  useEffect(() => {
    helpers.setValue(value);
    helpers.setTouched(true);
  }, [value]);

  return (
    <MuiFormikTextField
      name={name}
      fullWidth
      size="small"
      type="number"
      slotProps={{
        input: {
          readOnly: isReadOnly,
          min: 0,
          ...(row.quantity_limit_per_sponsor
            ? { max: row.quantity_limit_per_sponsor }
            : {})
        }
      }}
      sx={
        isReadOnly
          ? {
              "& .MuiInputBase-root": {
                backgroundColor: "action.disabledBackground",
                color: "text.disabled",
                pointerEvents: "none"
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "action.disabled"
              }
            }
          : {}
      }
    />
  );
};

export default GlobalQuantityField;
