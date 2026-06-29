import React, { useState } from "react";
import { connect } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AdminAccessForm from "../../components/forms/admin-access-form";

const AdminAccessFormPopup = ({ entity, errors, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSave = (adminAccessEntity) => {
    if (isSaving) return;
    setIsSaving(true);
    onSave(adminAccessEntity)
      .then(() => onClose())
      .catch(() => {})
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "flex-end", pb: 0 }}>
        <IconButton onClick={handleClose} disabled={isSaving} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <AdminAccessForm
          entity={entity}
          errors={errors}
          onSubmit={handleSave}
          isSaving={isSaving}
        />
      </DialogContent>
    </Dialog>
  );
};

const mapStateToProps = ({ adminAccessState }) => ({
  entity: adminAccessState.entity,
  errors: adminAccessState.errors
});

export default connect(mapStateToProps)(AdminAccessFormPopup);
