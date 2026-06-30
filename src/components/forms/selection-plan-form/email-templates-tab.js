/**
 * Copyright 2017 OpenStack Foundation
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

import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import EmailTemplateInput from "../../inputs/email-template-input";

const EmailTemplatesTab = ({ hidden }) => {
  const { values, setFieldValue } = useFormikContext();

  const handleChange = (ev) => setFieldValue(ev.target.id, ev.target.value);

  return (
    <div role="tabpanel" id="tabpanel-email_templates" hidden={hidden}>
      <Box sx={{ pt: 2 }}>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.creator_notification_email_template"
              )}
            </label>
            <EmailTemplateInput
              id="presentation_creator_notification_email_template"
              value={values.presentation_creator_notification_email_template}
              placeholder={T.translate(
                "edit_selection_plan.placeholders.creator_notification_email_select_template"
              )}
              onChange={handleChange}
              isClearable
              plainValue
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.moderator_notification_email_template"
              )}
            </label>
            <EmailTemplateInput
              id="presentation_moderator_notification_email_template"
              value={values.presentation_moderator_notification_email_template}
              placeholder={T.translate(
                "edit_selection_plan.placeholders.moderator_notification_email_select_template"
              )}
              onChange={handleChange}
              isClearable
              plainValue
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.speaker_notification_email_template"
              )}
            </label>
            <EmailTemplateInput
              id="presentation_speaker_notification_email_template"
              value={values.presentation_speaker_notification_email_template}
              placeholder={T.translate(
                "edit_selection_plan.placeholders.speaker_notification_email_select_template"
              )}
              onChange={handleChange}
              isClearable
              plainValue
            />
          </Grid2>
        </Grid2>
      </Box>
    </div>
  );
};

EmailTemplatesTab.propTypes = {
  hidden: PropTypes.bool.isRequired
};

export default EmailTemplatesTab;
