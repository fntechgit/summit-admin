/**
 * Copyright 2019 OpenStack Foundation
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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";

const RegistrationCompaniesImportDialog = ({ onClose, onImport }) => {
  const [importFile, setImportFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleImportCompanies = () => {
    if (isSaving || !importFile) return;
    setIsSaving(true);

    const formData = new FormData();
    formData.append("file", importFile);

    onImport(formData)
      .then(() => onClose())
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  return (
    <Dialog open onClose={handleClose} disableEscapeKeyDown={isSaving}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {T.translate("registration_companies.import_companies")}
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={isSaving}
          aria-label="close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className="row">
          <div className="col-md-12">
            Format must be as described using
            <br />
            column name
            <br />
            description of column content values
            <br />
            <br />
            <b>name</b>
            <br />
            company names
            <br />
          </div>
          <div className="col-md-12 invitation-import-upload-wrapper">
            <UploadInput
              value={importFile && importFile.name}
              handleUpload={(file) => setImportFile(file)}
              handleRemove={() => setImportFile(null)}
              className="dropzone col-md-6"
              multiple={false}
              accept=".csv"
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          disabled={!importFile || isSaving}
          onClick={handleImportCompanies}
        >
          {T.translate("registration_companies.ingest")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RegistrationCompaniesImportDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired
};

export default RegistrationCompaniesImportDialog;
