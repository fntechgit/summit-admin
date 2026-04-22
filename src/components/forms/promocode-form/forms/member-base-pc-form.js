import React from "react";
import T from "i18n-react";
import OwnerInput from "../../../inputs/owner-input";
import EmailRedeemForm from "./email-redeem-form";

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
        <div className="form-check abc-checkbox">
          <input
            type="checkbox"
            id="auto_apply"
            checked={!!props.entity.auto_apply}
            onChange={props.handleChange}
            className="form-check-input"
          />
          <label className="form-check-label" htmlFor="auto_apply">
            {T.translate("edit_promocode.auto_apply")}&nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("edit_promocode.info.auto_apply")}
            />
          </label>
        </div>
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
