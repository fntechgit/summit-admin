import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";

const ImportModal = ({
  title,
  children,
  show,
  wrapperClass,
  onHide,
  onIngest
}) => {
  const [importFile, setImportFile] = useState(null);

  const handleImport = () => {
    onIngest(importFile);
    setImportFile(null);
  };

  return (
    <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {title}
        <IconButton aria-label="Close" size="small" onClick={onHide}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className="row">
          <div className="col-md-12" style={{ marginBottom: 20 }}>
            Format must be the following: (Minimal data required)
            <br />
            {children}
          </div>
          <div className={`col-md-12 ${wrapperClass}`}>
            <UploadInput
              value={importFile?.name}
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
          disabled={!importFile}
          variant="contained"
          onClick={handleImport}
        >
          {T.translate("general.ingest")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ImportModal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  show: PropTypes.bool.isRequired,
  wrapperClass: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  onIngest: PropTypes.func.isRequired
};

ImportModal.defaultProps = {
  children: null,
  wrapperClass: ""
};

export default ImportModal;
