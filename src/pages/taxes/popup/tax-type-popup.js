import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import TaxTypeForm from "../../../components/forms/tax-type-form";

const TaxTypePopup = ({
  onClose,
  entity,
  currentSummit,
  onSave,
  onTicketLink,
  onTicketUnLink
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const title = entity?.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = (values) => {
    if (isSaving) return;
    setIsSaving(true);
    onSave(values)
      .then(() => onClose())
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.8rem">
          {title} {T.translate("edit_tax_type.tax_type")}
        </Typography>
        <IconButton size="small" onClick={handleClose} disabled={isSaving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <TaxTypeForm
          entity={entity}
          currentSummit={currentSummit}
          onTicketLink={onTicketLink}
          onTicketUnLink={onTicketUnLink}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      </DialogContent>
    </Dialog>
  );
};

TaxTypePopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  entity: PropTypes.shape({ id: PropTypes.number }).isRequired,
  currentSummit: PropTypes.shape({}).isRequired,
  onSave: PropTypes.func.isRequired,
  onTicketLink: PropTypes.func.isRequired,
  onTicketUnLink: PropTypes.func.isRequired
};

export default TaxTypePopup;
