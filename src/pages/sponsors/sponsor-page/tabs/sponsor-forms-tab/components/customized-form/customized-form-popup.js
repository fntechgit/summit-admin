import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  getSponsorCustomizedForm,
  getSponsorManagedForm,
  upgradeSponsorManagedForm,
  resetSponsorCustomizedForm,
  saveSponsorCustomizedForm,
  updateSponsorCustomizedForm
} from "../../../../../../../actions/sponsor-forms-actions";
import CustomizedForm from "./customized-form";

const CustomizedFormPopup = ({
  formId,
  entity,
  sponsor,
  summitId,
  summitTZ,
  upgradeManaged,
  open,
  onClose,
  onSaved,
  getSponsorCustomizedForm,
  getSponsorManagedForm,
  resetSponsorCustomizedForm,
  upgradeSponsorManagedForm,
  saveSponsorCustomizedForm,
  updateSponsorCustomizedForm
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const closeDialog = () => {
    resetSponsorCustomizedForm();
    onClose();
  };

  const handleClose = () => {
    if (isSaving) return;
    closeDialog();
  };

  const handleOnSave = (values) => {
    if (isSaving) return;

    const save = upgradeManaged
      ? upgradeSponsorManagedForm
      : values.id
      ? updateSponsorCustomizedForm
      : saveSponsorCustomizedForm;
    setIsSaving(true);

    save(values)
      .then(() => {
        if (onSaved) onSaved();
        closeDialog();
      })
      .catch(() => {
        // keep dialog open on save error to preserve user input
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    if (formId) {
      if (upgradeManaged) {
        getSponsorManagedForm(formId);
      } else {
        getSponsorCustomizedForm(formId);
      }
    }
  }, [formId]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("edit_sponsor.forms_tab.customized_form.title")}
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
      <CustomizedForm
        initialValues={entity}
        sponsor={sponsor}
        summitId={summitId}
        summitTZ={summitTZ}
        isSaving={isSaving}
        onSubmit={handleOnSave}
      />
    </Dialog>
  );
};

CustomizedFormPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func
};

const mapStateToProps = ({
  currentSummitState,
  sponsorCustomizedFormState
}) => ({
  summitTZ: currentSummitState.currentSummit.time_zone_id,
  ...sponsorCustomizedFormState
});

export default connect(mapStateToProps, {
  resetSponsorCustomizedForm,
  getSponsorCustomizedForm,
  getSponsorManagedForm,
  upgradeSponsorManagedForm,
  saveSponsorCustomizedForm,
  updateSponsorCustomizedForm
})(CustomizedFormPopup);
