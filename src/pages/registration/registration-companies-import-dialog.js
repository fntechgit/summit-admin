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
import { Box, Typography } from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";

const RegistrationCompaniesImportDialog = ({ onClose, onImport }) => {
  const [importFile, setImportFile] = useState(null);

  const handleImportCompanies = () => {
    const formData = new FormData();
    formData.append("file", importFile);
    return onImport(formData).then(() => onClose());
  };

  return (
    <CustomDialog
      title={T.translate("registration_companies.import_companies")}
      open
      onClose={onClose}
      primaryAction={{
        label: T.translate("registration_companies.ingest"),
        onClick: handleImportCompanies,
        disabled: !importFile
      }}
    >
      <Typography variant="body2" sx={{ mb: 2 }}>
        {T.translate("registration_companies.import_format")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          name
        </Typography>
        <Typography variant="body2">
          {T.translate("registration_companies.import_format_name")}
        </Typography>
      </Box>
      <UploadInput
        value={importFile && importFile.name}
        handleUpload={(file) => setImportFile(file)}
        handleRemove={() => setImportFile(null)}
        className="dropzone"
        multiple={false}
        accept=".csv"
      />
    </CustomDialog>
  );
};

RegistrationCompaniesImportDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired
};

export default RegistrationCompaniesImportDialog;
