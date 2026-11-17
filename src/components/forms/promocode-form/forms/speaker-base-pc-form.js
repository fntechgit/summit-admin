import React from "react";
import T from "i18n-react";
import { Grid2, InputLabel } from "@mui/material";
import { querySpeakersRaw } from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiFormikAsyncAutocomplete from "../../../mui/formik-inputs/mui-formik-async-select";
import EmailRedeemForm from "./email-redeem-form";
import AutoApplyCheckbox from "./auto-apply-checkbox";

export const formatSpeakerOption = (speaker) => ({
  value: speaker.id,
  label: `${speaker.first_name} ${speaker.last_name} (${speaker.email})`,
  raw: speaker
});

const SpeakerBasePCForm = ({ entity, summit, onSendEmail }) => (
  <>
    <Grid2 size={6}>
      <InputLabel htmlFor="speaker">
        {T.translate("general.speaker")}
      </InputLabel>
      <MuiFormikAsyncAutocomplete
        name="speaker"
        queryFunction={(input, callback) =>
          querySpeakersRaw(summit.id, input, callback)
        }
        formatOption={formatSpeakerOption}
      />
    </Grid2>
    <Grid2 size={6} />
    <Grid2 size={12}>
      <AutoApplyCheckbox />
    </Grid2>
    <EmailRedeemForm entity={entity} onSendEmail={onSendEmail} />
  </>
);

export default SpeakerBasePCForm;
