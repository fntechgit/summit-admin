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
  deleteFormTemplateAddtlField,
  deleteFormTemplateAddtlFieldValue,
  getSponsorships,
  saveFormTemplate
} from "../../../../../actions/sponsor-forms-actions";
import { MAX_PER_PAGE } from "../../../../../utils/constants";
import FormTemplateForm from "./form-template-form";

const DEFAULT_ENTITY = {
  code: "",
  name: "",
  sponsorship_type_ids: [],
  opens_at: null,
  expires_at: null,
  instructions: "",
  meta_fields: [
    {
      name: "",
      type: "Text",
      is_required: false,
      values: []
    }
  ]
};

const FormTemplatePopup = ({
  summitTZ,
  sponsorships,
  open,
  onClose,
  getSponsorships,
  saveFormTemplate,
  deleteFormTemplateAddtlField,
  deleteFormTemplateAddtlFieldValue
}) => {
  useEffect(() => {
    getSponsorships(1, MAX_PER_PAGE);
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleOnSave = (values) => {
    saveFormTemplate(values).finally(() => {
      handleClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_forms.form_template_popup.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={() => handleClose()}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormTemplateForm
        initialValues={DEFAULT_ENTITY}
        sponsorships={sponsorships}
        summitTZ={summitTZ}
        onSubmit={handleOnSave}
        onDeleteAddtlField={deleteFormTemplateAddtlField}
        onDeleteAddtlFieldValue={deleteFormTemplateAddtlFieldValue}
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
  summitTZ: currentSummitState.currentSummit.time_zone_id
});

export default connect(mapStateToProps, {
  saveFormTemplate,
  deleteFormTemplateAddtlField,
  deleteFormTemplateAddtlFieldValue,
  getSponsorships
})(FormTemplatePopup);
