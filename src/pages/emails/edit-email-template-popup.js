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
import { Modal } from "react-bootstrap";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { sublimeInit } from "@uiw/codemirror-theme-sublime";
import EmailTemplateForm from "../../components/forms/email-template-form";
import { DECIMAL_DIGITS } from "../../utils/constants";

import "../../styles/edit-email-template-page.less";

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
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonData, setJsonData] = useState(templateJsonData);
  const [jsonPreview, setJsonPreview] = useState(templateJsonData);

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

  const handlePreview = () => {
    setJsonPreview(JSON.stringify(jsonData, null, DECIMAL_DIGITS));
    setShowJsonModal(true);
  };

  const handleJsonChange = (value) => {
    setJsonPreview(value);
  };

  const handleJsonModalClose = () => {
    let parsedJSON;
    try {
      parsedJSON = JSON.parse(jsonPreview);
    } catch {
      return;
    }
    updateTemplateJsonData(parsedJSON).then(() => {
      setShowJsonModal(false);
      setJsonData(parsedJSON);
    });
  };

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
          onRender={handlePreview}
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

      <Modal
        className="preview-email-template-modal"
        show={showJsonModal}
        onHide={() => setShowJsonModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{T.translate("emails.sample_data")}</Modal.Title>
          <span>{T.translate("emails.sample_data_legend")}</span>
        </Modal.Header>
        <Modal.Body style={{ overflow: "auto", maxHeight: "75vh" }}>
          {renderErrors?.length > 0 && (
            <div className="row">
              <div className="col-md-12 error">{renderErrors}</div>
            </div>
          )}
          <div className="row">
            <div className="col-md-12">
              <label>
                {" "}
                JSON{" "}
                <a
                  href="https://jsonformatter.curiousconcept.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  format
                </a>
              </label>
              <CodeMirror
                id="json_preview"
                value={jsonPreview}
                onChange={(value) => handleJsonChange(value)}
                theme={sublimeInit({
                  settings: {
                    caret: "#c6c6c6",
                    fontFamily: "monospace"
                  }
                })}
                extensions={[json()]}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={handleJsonModalClose}>
            {T.translate("emails.update")}
          </button>
        </Modal.Footer>
      </Modal>
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
