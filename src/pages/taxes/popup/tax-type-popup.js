import React from "react";
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
  open,
  onClose,
  entity,
  errors,
  currentSummit,
  onSubmit,
  onTicketLink,
  onTicketUnLink
}) => {
  const title = entity?.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.8rem">
          {title} {T.translate("edit_tax_type.tax_type")}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <TaxTypeForm
          entity={entity}
          currentSummit={currentSummit}
          errors={errors}
          onTicketLink={onTicketLink}
          onTicketUnLink={onTicketUnLink}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

TaxTypePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
  errors: PropTypes.object,
  currentSummit: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onTicketLink: PropTypes.func.isRequired,
  onTicketUnLink: PropTypes.func.isRequired
};

TaxTypePopup.defaultProps = {
  errors: {}
};

export default TaxTypePopup;
