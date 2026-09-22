/**
 * Copyright 2020 OpenStack Foundation
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
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import Typography from "@mui/material/Typography";
import { Grid2 } from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import useScrollToError from "../../../hooks/useScrollToError";
import EmailTemplateInput from "../../inputs/email-template-input";
import TemplateSchemaTree from "./template-schema-tree";
import CopyClipboard from "../../buttons/copy-clipboard";

const EmailFlowEventForm = ({ entity }) => {
  const formik = useFormikContext();
  const { values, setFieldValue } = formik;

  useScrollToError(formik, true);

  const handleTemplateChange = (ev) => {
    setFieldValue(ev.target.id, ev.target.value);
  };

  return (
    <Box>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Typography variant="label">
            {T.translate("edit_email_flow_event.flow_name")}
          </Typography>
          {entity.flow_name}
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Typography variant="label">
            {T.translate("edit_email_flow_event.event_type")}
          </Typography>
          <Box sx={{ overflowWrap: "break-word" }}>
            {entity.event_type_name}
          </Box>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <FormLabel htmlFor="email_template_identifier">
            {T.translate("edit_email_flow_event.email_template_identifier")} *
            {values.email_template_identifier && (
              <>
                &nbsp;&nbsp;
                <a
                  href={`/app/emails/templates/${values.email_template_identifier}`}
                >
                  see template
                </a>
                &nbsp;&nbsp;
                <CopyClipboard
                  text={values.email_template_identifier}
                  tooltipText={T.translate(
                    "edit_email_flow_event.copy_email_template"
                  )}
                />
              </>
            )}
          </FormLabel>
          <EmailTemplateInput
            id="email_template_identifier"
            value={values.email_template_identifier}
            placeholder={T.translate(
              "edit_email_flow_event.placeholders.select_template"
            )}
            onChange={handleTemplateChange}
            plainValue
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <FormLabel htmlFor="recipients">
            {T.translate("edit_email_flow_event.recipient")}
          </FormLabel>
          <MuiFormikTextField
            name="recipients"
            margin="none"
            fullWidth
            size="small"
          />
        </Grid2>
        <Grid2 size={12}>
          <Typography variant="label">
            {T.translate("edit_email_flow_event.variables")}
          </Typography>
          <TemplateSchemaTree templateSchema={entity.template_schema} />
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default EmailFlowEventForm;
