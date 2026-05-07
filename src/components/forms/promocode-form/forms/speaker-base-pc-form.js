import React from "react";
import T from "i18n-react";
import SpeakerInput from "openstack-uicore-foundation/lib/components/inputs/speaker-input";
import EmailRedeemForm from "./email-redeem-form";
import AutoApplyCheckbox from "./auto-apply-checkbox";

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

export default SpeakerBasePCForm;
