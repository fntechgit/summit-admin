import React, { useEffect } from "react";
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
  updateFormTemplate
}) => {
  useEffect(() => {
    getSponsorships(1, MAX_PER_PAGE);
  }, []);

  const handleClose = () => {
    // clear form from reducer
    resetFormTemplate();
    onClose();
  };

  const handleOnSave = (values) => {
    const save = values.id ? updateFormTemplate : saveFormTemplate;

    save(values).finally(() => {
      handleClose();
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_forms.form_template_popup.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormTemplateForm
        initialValues={formTemplate}
        sponsorships={sponsorships}
        summitTZ={summitTZ}
        onSubmit={handleOnSave}
      />
    </Dialog>
  );
};

FormTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
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
