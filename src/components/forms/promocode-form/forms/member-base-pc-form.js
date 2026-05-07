import React from "react";
import OwnerInput from "../../../inputs/owner-input";
import EmailRedeemForm from "./email-redeem-form";
import AutoApplyCheckbox from "./auto-apply-checkbox";

const MemberBasePCForm = (props) => (
  <>
    <div className="row form-group">
      <div className="col-md-12">
        <OwnerInput
          id="owner"
          owner={props.entity.owner}
          onChange={props.handleChange}
          errors={{
            email: props.hasErrors("email"),
            first_name: props.hasErrors("first_name"),
            last_name: props.hasErrors("last_name")
          }}
        />
      </div>
    </div>
    <div className="row form-group">
      <div className="col-md-12">
        <AutoApplyCheckbox
          entity={props.entity}
          handleChange={props.handleChange}
        />
      </div>
    </div>
    <EmailRedeemForm
      entity={props.entity}
      handleChange={props.handleChange}
      handleSendEmail={props.handleSendEmail}
    />
  </>
);

export default MemberBasePCForm;
