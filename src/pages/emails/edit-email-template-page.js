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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Box from "@mui/material/Box";
import EmailTemplateForm from "../../components/forms/email-template-form";
import EmailTemplateJsonDialog from "./email-template-json-dialog";
import AddNewButton from "../../components/buttons/add-new-button";
import {
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients,
  renderEmailTemplate,
  updateTemplateJsonData
} from "../../actions/email-actions";

const EditEmailTemplatePage = ({
  match,
  entity,
  templateLoading,
  errors,
  clients,
  preview,
  render_errors: renderErrors,
  json_data: templateJsonData,
  getEmailTemplate: fetchEmailTemplate,
  resetTemplateForm: resetForm,
  saveEmailTemplate: saveTemplate,
  getAllClients: fetchAllClients,
  renderEmailTemplate: renderTemplate,
  updateTemplateJsonData: updateJsonData
}) => {
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [entityReady, setEntityReady] = useState(false);

  useEffect(() => {
    fetchAllClients();
  }, []);

  useEffect(() => {
    let active = true;
    setEntityReady(false);
    const templateId = match.params.template_id;
    const loadEntity = templateId
      ? fetchEmailTemplate(templateId)
      : resetForm();

    Promise.resolve(loadEntity)
      .catch(() => {})
      .finally(() => {
        if (active) setEntityReady(true);
      });

    return () => {
      active = false;
    };
  }, [match.params.template_id]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.identifier : T.translate("general.new");

  const handleJsonUpdate = (parsedJSON) =>
    updateJsonData(parsedJSON).then(() => setShowJsonDialog(false));

  return (
    <Box
      className="edit-template-page"
      sx={{ backgroundColor: "white", padding: "2vh 2vw", margin: "2vh 2vw" }}
    >
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("emails.email_template")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {entityReady ? (
        <>
          <EmailTemplateForm
            entity={entity}
            clients={clients}
            errors={errors}
            onSubmit={saveTemplate}
            onRender={() => setShowJsonDialog(true)}
            preview={preview}
            renderErrors={renderErrors}
            templateLoading={templateLoading}
            templateJsonData={templateJsonData}
            renderEmailTemplate={renderTemplate}
          />

          <EmailTemplateJsonDialog
            open={showJsonDialog}
            jsonData={templateJsonData}
            renderErrors={renderErrors}
            onUpdate={handleJsonUpdate}
            onClose={() => setShowJsonDialog(false)}
          />
        </>
      ) : (
        <div>{T.translate("emails.loading_template")}</div>
      )}
    </Box>
  );
};

const mapStateToProps = ({ emailTemplateState }) => ({
  ...emailTemplateState
});

export default connect(mapStateToProps, {
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients,
  renderEmailTemplate,
  updateTemplateJsonData
})(EditEmailTemplatePage);
