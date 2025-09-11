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
  processUserRequest,
  getUserGroups
} from "../../../../actions/sponsor-users-actions";
import { MAX_PER_PAGE } from "../../../../utils/constants";
import ProcessRequestForm from "./process-request-form";

const ProcessRequestPopup = ({request, currentSummit, userGroups, onClose, getUserGroups}) => {
  useEffect(() => {
    getUserGroups(1, MAX_PER_PAGE);
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleProcess = (values) => {
    console.log("SAVE: ", values);
  };

  return (
    <Dialog open={!!request} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", p: 2 }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_users.process_request.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <ProcessRequestForm
        request={request}
        userGroups={userGroups}
        summit={currentSummit}
        onSubmit={handleProcess}
      />
    </Dialog>
  );
};

ProcessRequestPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorFormsListState, currentSummitState }) => ({
  userGroups: sponsorFormsListState.userGroups,
  currentSummit: currentSummitState.currentSummit
});

export default connect(mapStateToProps, {
  processUserRequest,
  getUserGroups
})(ProcessRequestPopup);
