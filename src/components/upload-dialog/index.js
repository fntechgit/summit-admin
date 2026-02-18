import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import PropTypes from "prop-types";
import UploadInputV2 from "openstack-uicore-foundation/lib/components/inputs/upload-input-v2";
import T from "i18n-react/dist/i18n-react";
import CloseIcon from "@mui/icons-material/Close";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DialogActions from "@mui/material/DialogActions";

const MAX_PAGE_MODULE_UPLOAD_QTY = 1;

const CurrentFile = ({ file, onRemove }) => (
  <Box sx={{ display: "flex", flexDirection: "row" }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40
      }}
    >
      <NoteAddIcon sx={{ mr: 1 }} color="primary" />
    </Box>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {file.filename}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {file.size} {T.translate("upload_input.complete")}
      </Typography>
    </Box>
    <IconButton aria-label="delete" onClick={onRemove}>
      <DeleteIcon />
    </IconButton>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40
      }}
    >
      <CheckCircleIcon color="success" sx={{ ml: 1 }} />
    </Box>
  </Box>
);

const UploadDialog = ({
  name,
  value,
  open,
  fileMeta,
  maxFiles = MAX_PAGE_MODULE_UPLOAD_QTY,
  onClose,
  onUpload,
  onRemove
}) => {
  const [uploadedFile, setUploadedFile] = useState(null);

  const mediaType = {
    id: name,
    max_size: fileMeta.max_file_size,
    max_uploads_qty: maxFiles,
    type: {
      allowed_extensions: fileMeta?.allowed_extensions?.split(",") || []
    }
  };

  const handleUpload = () => {
    onUpload(uploadedFile);
  };

  const handleRemove = () => {
    onRemove();
  };

  const canAddMore = () => (value?.length || 0) < maxFiles;

  const getInputValue = () =>
    value?.length > 0
      ? value.map((file) => ({
          ...file,
          filename:
            file.file_name ?? file.filename ?? file.file_path ?? file.file_url
        }))
      : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {T.translate("edit_sponsor.mu_tab.upload_input.upload_file")}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500]
        })}
      >
        <CloseIcon />
      </IconButton>
      <Divider />
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {fileMeta.name}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {fileMeta.description}
        </Typography>
        {value ? (
          <>
            <Divider sx={{ marginLeft: -2, marginRight: -2, mb: 2 }} />
            <CurrentFile file={value} onRemove={handleRemove} />
          </>
        ) : (
          <UploadInputV2
            id={`media_upload_${name}`}
            name={name}
            onUploadComplete={setUploadedFile}
            value={getInputValue()}
            mediaType={mediaType}
            onRemove={() => setUploadedFile(null)}
            postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
            djsConfig={{ withCredentials: true }}
            maxFiles={maxFiles}
            canAdd={canAddMore()}
            parallelChunkUploads
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleUpload}
          fullWidth
          disabled={!uploadedFile}
          variant="contained"
        >
          {T.translate("edit_sponsor.mu_tab.upload_input.upload_file")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default UploadDialog;
