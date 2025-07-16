import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import { saveTemplateForm } from "../../../../actions/sponsor-forms-actions";
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
  Select,
  TextField,
  Typography
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { useCustomNotification } from "../../../../components/mui/components/CustomNotification/Context";
import { hasErrors } from "../../../../utils/methods";
import AdditionalInput from "./additional-input";

const DEFAULT_ENTITY = {
  code: "",
  name: "",
  apply_to: null,
  opens_at: null,
  expires_at: null,
  instructions: "",
  meta_fields: [
    {
      name: "",
      type: "Text",
      required: false,
      minimum_quantity: "",
      maximum_quantity: "",
      values: []
    }
  ]
};

const FormTemplatePopup = ({
  entity: initialEntity,
  errors: initialErrors,
  open,
  onClose,
  saveTemplateForm
}) => {
  const { successMessage, errorMessage } = useCustomNotification();
  const [errors, setErrors] = useState(initialErrors || {});
  const [entity, setEntity] = useState(DEFAULT_ENTITY);

  const handleClose = () => {
    setEntity(DEFAULT_ENTITY);
    onClose();
  };

  const handleOnSave = () => {
    saveTemplateForm(entity)
      .then(() => {
        successMessage(
          T.translate("sponsor_forms.global_template_popup.success")
        );
        handleClose();
      })
      .catch(() => {
        errorMessage(T.translate("sponsor_forms.global_template_popup.error"));
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
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={4}>
            <TextField
              variant="outlined"
              name="code"
              label={T.translate("sponsor_forms.form_template_popup.code")}
              required
              value={entity.code}
              error={!!errors.code}
              helperText={errors.code}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <TextField
              variant="outlined"
              name="name"
              label={T.translate("sponsor_forms.form_template_popup.name")}
              required
              value={entity.name}
              error={!!errors.name}
              helperText={errors.name}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <Select
              name="sponsorship"
              label={T.translate(
                "sponsor_forms.form_template_popup.sponsorship"
              )}
              required
              onSelect={handleChange}
            />
          </Grid2>
          <Grid2 size={4}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                value={entity.opens_at}
                onChange={(value) =>
                  handleChange({ target: { name: "opens_at", value } })
                }
                slotProps={{
                  textField: {
                    name: "opens_at",
                    fullWidth: true,
                    margin: "normal",
                    label: T.translate(
                      "sponsor_forms.form_template_popup.opens_at"
                    ),
                    error: !!errors.opens_at,
                    helperText: errors.opens_at
                  }
                }}
              />
            </LocalizationProvider>
          </Grid2>
          <Grid2 size={4}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                value={entity.expires_at}
                onChange={(value) =>
                  handleChange({ target: { name: "expires_at", value } })
                }
                slotProps={{
                  textField: {
                    name: "expires_at",
                    fullWidth: true,
                    margin: "normal",
                    label: T.translate(
                      "sponsor_forms.form_template_popup.opens_at"
                    ),
                    error: !!errors.expires_at,
                    helperText: errors.expires_at
                  }
                }}
              />
            </LocalizationProvider>
          </Grid2>
          <Grid2 size={12}>
            <TextField
              name="instructions"
              label={T.translate(
                "sponsor_forms.form_template_popup.instructions"
              )}
              required
              fullWidth
              minRows={3}
              value={entity.instructions}
              error={hasErrors("instructions", errors)}
              helperText={errors.instructions}
              onChange={handleChange}
            />
          </Grid2>
        </Grid2>
        <Typography variant="h5" sx={{ ml: "26px", mt: "20px" }}>
          {T.translate("sponsor_forms.form_template_popup.additional_fields")}
        </Typography>
        <Box sx={{ px: 3 }}>
          {entity.meta_fields.map((field, fieldIndex) => (
            <AdditionalInput
              entity={entity}
              field={field}
              fieldIdx={fieldIndex}
              setEntity={setEntity}
              onMetaFieldDelete={console.log}
            />
          ))}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          onClick={handleOnSave}
          disabled={false}
          fullWidth
          variant="contained"
        >
          {T.translate("sponsor_forms.form_template_popup.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FormTemplatePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  saveTemplateForm
})(FormTemplatePopup);
