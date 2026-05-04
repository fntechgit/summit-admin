import React, { useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AdminAccessForm from "../../components/forms/admin-access-form";
import { resetAdminAccessForm } from "../../actions/admin-access-actions";

const AdminAccessFormPopup = ({
  entity,
  errors,
  onClose,
  onSave,
  resetAdminAccessForm
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    resetAdminAccessForm();
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
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <span>
          {entity.id ? T.translate("general.edit") : T.translate("general.add")}{" "}
          {T.translate("admin_access.admin_access")}
        </span>
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

export default connect(mapStateToProps, {
  resetAdminAccessForm
})(AdminAccessFormPopup);
