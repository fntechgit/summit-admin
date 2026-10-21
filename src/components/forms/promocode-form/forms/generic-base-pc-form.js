import React from "react";
import T from "i18n-react";
import { Grid2, InputLabel } from "@mui/material";
import { queryTicketTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiFormikAsyncAutocomplete from "../../../mui/formik-inputs/mui-formik-async-select";
import BasePCForm from "./base-pc-form";

const TICKET_TYPES_LIMIT = 100;

const GenericBasePCForm = (props) => {
  const { summit } = props;
  return (
    <>
      <BasePCForm {...props} />
      <Grid2 size={6}>
        <InputLabel htmlFor="allowed_ticket_types">
          {T.translate("edit_promocode.allowed_ticket_types")}
        </InputLabel>
        <MuiFormikAsyncAutocomplete
          name="allowed_ticket_types"
          isMulti
          defaultOptions
          placeholder={T.translate(
            "edit_promocode.placeholders.select_ticket_types"
          )}
          queryFunction={(input, callback) =>
            queryTicketTypes(
              summit.id,
              { name: input },
              callback,
              "v2",
              TICKET_TYPES_LIMIT
            )
          }
          formatOption={(tt) => ({ value: tt.id, label: tt.name })}
          formatSelectedValue={(s) => ({ value: s.value, label: s.label })}
        />
      </Grid2>
    </>
  );
};

export default GenericBasePCForm;
