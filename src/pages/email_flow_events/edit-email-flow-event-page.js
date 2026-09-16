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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EmailFlowEventForm from "../../components/forms/email-flow-event-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getEmailFlowEvent,
  resetEmailFlowEventForm,
  saveEmailFlowEvent
} from "../../actions/email-flows-events-actions";
import { validateEmail } from "../../utils/methods";
import "../../styles/edit-email-flow-event-page.less";
import AddNewButton from "../../components/buttons/add-new-button";

export const buildValues = (entity) => ({
  id: entity?.id ?? 0,
  email_template_identifier: entity?.email_template_identifier ?? "",
  recipients: (entity?.recipients ?? []).join(",")
});

export const validationSchema = yup.object().shape({
  recipients: yup
    .string()
    .test("valid-emails", "Invalid email", function validateRecipients(value) {
      if (!value) return true;
      const emails = value.split(",").map((email) => email.trim());
      const invalidEmail = emails.find((email) => !validateEmail(email));
      if (invalidEmail) {
        return this.createError({
          message: `email ${invalidEmail} is not valid`
        });
      }
      return true;
    })
});

const EditEmailFlowEventPage = ({
  currentSummit,
  entity,
  errors,
  match,
  getEmailFlowEvent,
  resetEmailFlowEventForm,
  saveEmailFlowEvent
}) => {
  const eventId = match.params.event_id;

  useEffect(() => {
    if (eventId) {
      getEmailFlowEvent(eventId);
    } else {
      resetEmailFlowEventForm();
    }
  }, [eventId]);

  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit: (values) => {
      const normalizedValues = {
        ...values,
        recipients: values.recipients
          ? values.recipients.split(",").map((email) => email.trim())
          : []
      };
      return saveEmailFlowEvent(normalizedValues).catch(() => {});
    }
  });

  useEffect(() => {
    formik.resetForm({ values: buildValues(entity) });
  }, [entity.id]);

  useEffect(() => {
    const errorFields = Object.keys(errors || {});
    formik.setErrors(errorFields.length > 0 ? errors : {});
  }, [errors]);

  const title = T.translate("general.edit");
  const breadcrumb = entity.id ? entity.flow_name : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {entity.flow_name}{" "}
        {T.translate("edit_email_flow_event.email_flow_event")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <EmailFlowEventForm entity={entity} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={formik.isSubmitting}
              >
                {T.translate("general.save")}
              </Button>
            </Box>
          </Box>
        </FormikProvider>
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  emailFLowEventState,
  baseState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  loading: baseState.loading,
  ...emailFLowEventState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEmailFlowEvent,
  resetEmailFlowEventForm,
  saveEmailFlowEvent
})(EditEmailFlowEventPage);
