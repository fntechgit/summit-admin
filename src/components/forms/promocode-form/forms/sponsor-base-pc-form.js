import React from "react";
import T from "i18n-react";
import { Grid2, InputLabel } from "@mui/material";
import MuiSponsorInput from "openstack-uicore-foundation/lib/components/mui/formik-inputs/sponsor-input";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";

const SponsorBasePCForm = ({ summit }) => (
  <>
    <Grid2 size={6}>
      <InputLabel htmlFor="sponsor">
        {T.translate("edit_promocode.sponsor")} *
      </InputLabel>
      <MuiSponsorInput id="sponsor" name="sponsor" summitId={summit.id} />
    </Grid2>
    <Grid2 size={6}>
      <InputLabel htmlFor="contact_email">
        {T.translate("edit_promocode.contact_email")} *
      </InputLabel>
      <MuiFormikTextField name="contact_email" margin="none" fullWidth />
    </Grid2>
  </>
);

export default SponsorBasePCForm;
