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
  getUserGroups,
  updateSponsorUser
} from "../../../../actions/sponsor-users-actions";
import { MAX_PER_PAGE } from "../../../../utils/constants";
import SponsorUserForm from "./sponsor-user-form";

const EditUserPopup = ({
  user,
  currentSummit,
  userGroups,
  onClose,
  getUserGroups,
  updateSponsorUser
}) => {
  useEffect(() => {
    getUserGroups(1, MAX_PER_PAGE);
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleSave = (values) => {
    updateSponsorUser(values);
  };

  return (
    <Dialog open={!!user} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", p: 2 }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_users.edit_user.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <SponsorUserForm
        user={user}
        userGroups={userGroups}
        summit={currentSummit}
        onSubmit={handleSave}
      />
    </Dialog>
  );
};

EditUserPopup.propTypes = {
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorUsersListState, currentSummitState }) => ({
  userGroups: sponsorUsersListState.userGroups,
  currentSummit: currentSummitState.currentSummit
});

export default connect(mapStateToProps, {
  getUserGroups,
  updateSponsorUser
})(EditUserPopup);
