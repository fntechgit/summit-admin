import React from "react";
import T from "i18n-react";
import { TicketTypesInput } from "openstack-uicore-foundation/lib/components";
import BasePCForm from "./base-pc-form";

const GenericBasePCForm = (props) => (
  <>
    <BasePCForm {...props} />
    <div className="row form-group">
      <div className="col-md-6">
        <label> {T.translate("edit_promocode.allowed_ticket_types")}</label>
        <TicketTypesInput
          id="allowed_ticket_types"
          value={props.entity.allowed_ticket_types}
          onChange={props.handleChange}
          placeholder={T.translate(
            "edit_promocode.placeholders.select_ticket_types"
          )}
          summitId={props.summit.id}
          version="v2"
          defaultOptions
          optionsLimit={100}
          isMulti
        />
      </div>
    </div>
  </>
);

export default GenericBasePCForm;
