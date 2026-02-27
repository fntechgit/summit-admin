/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

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
