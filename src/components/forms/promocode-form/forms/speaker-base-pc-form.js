import React from "react";
import T from "i18n-react";
import SpeakerInput from "openstack-uicore-foundation/lib/components/inputs/speaker-input";
import EmailRedeemForm from "./email-redeem-form";

const SpeakerBasePCForm = (props) => (
  <>
    <div className="row form-group">
      <div className="col-md-6">
        <label> {T.translate("general.speaker")} </label>
        <SpeakerInput
          id="speaker"
          value={props.entity.speaker}
          onChange={props.handleChange}
          summitId={props.summit.id}
          error={props.hasErrors("speaker_id")}
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

export default SpeakerBasePCForm;
