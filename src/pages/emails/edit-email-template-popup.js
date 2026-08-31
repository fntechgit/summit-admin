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

import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EmailTemplateForm from "../../components/forms/email-template-form";
import EmailTemplateJsonDialog from "./email-template-json-dialog";

const EditEmailTemplatePopup = ({
  entity,
  templateLoading,
  errors,
  clients,
  preview,
  renderErrors,
  templateJsonData,
  renderEmailTemplate,
  updateTemplateJsonData,
  onSave,
  onClose
}) => {
  const formRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [jsonData, setJsonData] = useState(templateJsonData);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleOnSave = (values) => {
    if (isSaving) return;
    setIsSaving(true);

    onSave(values)
      .then(() => onClose())
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const handleFooterSave = () => {
    formRef.current?.submit();
  };

  const handleJsonUpdate = (parsedJSON) =>
    updateTemplateJsonData(parsedJSON).then(() => {
      setJsonData(parsedJSON);
      setShowJsonDialog(false);
    });

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="xl"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {title} {T.translate("emails.email_template")}
        <IconButton onClick={handleClose} disabled={isSaving}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <EmailTemplateForm
          ref={formRef}
          entity={entity}
          clients={clients}
          errors={errors}
          onSubmit={handleOnSave}
          onRender={() => setShowJsonDialog(true)}
          onValidityChange={setIsInvalid}
          preview={preview}
          renderErrors={renderErrors}
          templateLoading={templateLoading}
          templateJsonData={jsonData}
          renderEmailTemplate={renderEmailTemplate}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={handleFooterSave}
          disabled={isSaving || isInvalid}
        >
          {T.translate("general.save")}
        </Button>
      </DialogActions>

      <EmailTemplateJsonDialog
        open={showJsonDialog}
        jsonData={jsonData}
        renderErrors={renderErrors}
        onUpdate={handleJsonUpdate}
        onClose={() => setShowJsonDialog(false)}
      />
    </Dialog>
  );
};

EditEmailTemplatePopup.propTypes = {
  entity: PropTypes.object.isRequired,
  templateLoading: PropTypes.bool,
  errors: PropTypes.object,
  clients: PropTypes.array,
  preview: PropTypes.string,
  renderErrors: PropTypes.array,
  templateJsonData: PropTypes.object,
  renderEmailTemplate: PropTypes.func.isRequired,
  updateTemplateJsonData: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default EditEmailTemplatePopup;
