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
  getSponsorships,
  resetFormTemplate,
  saveFormTemplate,
  updateFormTemplate
} from "../../../../../actions/sponsor-forms-actions";
import { MAX_PER_PAGE } from "../../../../../utils/constants";
import FormTemplateForm from "./form-template-form";

const FormTemplatePopup = ({
  summitTZ,
  sponsorships,
  formTemplate,
  open,
  onClose,
  getSponsorships,
  resetFormTemplate,
  saveFormTemplate,
  updateFormTemplate,
  edit
}) => {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getSponsorships(1, MAX_PER_PAGE);
  }, []);

  const closePopup = () => {
    resetFormTemplate();
    onClose();
  };

  const handleClose = () => {
    if (isSaving) return;

    closePopup();
  };

  const handleOnSave = (values) => {
    if (isSaving) return;

    const save = values.id ? updateFormTemplate : saveFormTemplate;
    setIsSaving(true);

    save(values)
      .then(() => {
        closePopup();
      })
      .catch(() => {
        // keep dialog open on save error to preserve user input
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isSaving) return;
        handleClose();
      }}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate(
            edit
              ? "sponsor_forms.form_template_popup.title.edit"
              : "sponsor_forms.form_template_popup.title.new"
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
      <FormTemplateForm
        initialValues={formTemplate}
        sponsorships={sponsorships}
        summitTZ={summitTZ}
        isSaving={isSaving}
        onSubmit={handleOnSave}
      />
    </Dialog>
  );
};

FormTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  edit: PropTypes.bool.isRequired
};

const mapStateToProps = ({ sponsorFormsListState, currentSummitState }) => ({
  sponsorships: sponsorFormsListState.sponsorships,
  formTemplate: sponsorFormsListState.formTemplate,
  summitTZ: currentSummitState.currentSummit.time_zone_id
});

export default connect(mapStateToProps, {
  resetFormTemplate,
  saveFormTemplate,
  updateFormTemplate,
  getSponsorships
})(FormTemplatePopup);
