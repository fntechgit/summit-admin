import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SponsorFormItemForm from "./sponsor-form-item-form";

const SponsorFormItemPopup = ({ item, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate(
            `sponsor_form_item_list.edit_item.${item?.id ? "edit" : "new"}`
          )}
        </Typography>
        <IconButton
          size="large"
          sx={{ p: 0 }}
          onClick={handleClose}
          disabled={isSaving}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <SponsorFormItemForm
        initialValues={item}
        onSubmit={handleOnSave}
        isSaving={isSaving}
      />
    </Dialog>
  );
};

SponsorFormItemPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  item: PropTypes.object
};

export default SponsorFormItemPopup;
