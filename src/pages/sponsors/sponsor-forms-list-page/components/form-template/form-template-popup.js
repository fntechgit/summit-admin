import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  TextField,
  Typography
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import {
  getSponsorships,
  saveFormTemplate,
  deleteFormTemplateAddtlField,
  deleteFormTemplateAddtlFieldValue
} from "../../../../../actions/sponsor-forms-actions";
import { hasErrors } from "../../../../../utils/methods";
import AdditionalInput from "./additional-input";
import { MAX_PER_PAGE } from "../../../../../utils/constants";
import DropdownCheckbox from "../../../../../components/mui/components/dropdown-checkbox";
import FormTemplateForm from "./form-template-form";

const DEFAULT_ENTITY = {
  code: "",
  name: "",
  sponsorships: [],
  apply_to: null,
  opens_at: null,
  expires_at: null,
  instructions: "",
  meta_fields: [
    {
      name: "",
      type: "Text",
      required: false,
      values: []
    }
  ]
};

const FormTemplatePopup = ({
  errors: initialErrors,
                             summitTZ,
  sponsorships,
  open,
  onClose,
  getSponsorships,
  saveFormTemplate,
  deleteFormTemplateAddtlField,
  deleteFormTemplateAddtlFieldValue
}) => {
  const [errors, setErrors] = useState(initialErrors || {});
  const [entity, setEntity] = useState(DEFAULT_ENTITY);

  useEffect(() => {
    getSponsorships(1, MAX_PER_PAGE);
  }, []);

  const handleClose = () => {
    setEntity(DEFAULT_ENTITY);
    onClose();
  };

  const handleOnSave = () => {
    saveFormTemplate(entity)
      .finally(() => {
        handleClose();
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntity({ ...entity, [name]: value });
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
          data={entity}
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
