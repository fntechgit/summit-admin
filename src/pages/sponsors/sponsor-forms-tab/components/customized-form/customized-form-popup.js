import React from "react";
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
  resetSponsorCustomizedForm,
  saveSponsorCustomizedForm,
  updateSponsorCustomizedForm
} from "../../../../../actions/sponsor-forms-actions";
import CustomizedForm from "./customized-form";

const CustomizedFormPopup = ({
  entity,
  sponsor,
  summitId,
  summitTZ,
  open,
  onClose,
  resetSponsorCustomizedForm,
  saveSponsorCustomizedForm,
  updateSponsorCustomizedForm
}) => {
  const handleClose = () => {
    // clear form from reducer
    resetSponsorCustomizedForm();
    onClose();
  };

  const handleOnSave = (values) => {
    const save = values.id
      ? updateSponsorCustomizedForm
      : saveSponsorCustomizedForm;

    console.log(values);

    save(values).finally(() => {
      handleClose();
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("edit_sponsor.forms_tab.customized_form.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <CustomizedForm
        initialValues={entity}
        sponsor={sponsor}
        summitId={summitId}
        summitTZ={summitTZ}
        onSubmit={handleOnSave}
      />
    </Dialog>
  );
};

CustomizedFormPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
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
  saveSponsorCustomizedForm,
  updateSponsorCustomizedForm
})(CustomizedFormPopup);
