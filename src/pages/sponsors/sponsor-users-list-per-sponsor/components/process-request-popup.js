import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  approveSponsorUserRequest,
  denySponsorUserRequest
} from "../../../../actions/sponsor-users-actions";
import CheckBoxList from "../../../../components/mui/checkbox-list";
import showConfirmDialog from "../../../../components/mui/showConfirmDialog";

const ProcessRequestPopup = ({
  open,
  sponsorId,
  companyId,
  requests,
  onClose,
  approveSponsorUserRequest,
  denySponsorUserRequest
}) => {
  const [selected, setSelected] = useState([]);

  const handleClose = () => {
    onClose();
  };

  const handleAdmit = async () => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate(
        "sponsor_users.process_request.admit_confirmation_title"
      ),
      text: T.translate("sponsor_users.process_request.admit_confirmation_body")
    });

    if (isConfirmed) {
      approveSponsorUserRequest(selected, sponsorId, companyId).then(() => {
        handleClose();
      });
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate(
        "sponsor_users.process_request.delete_confirmation_title"
      ),
      text: T.translate(
        "sponsor_users.process_request.delete_confirmation_body"
      )
    });

    if (isConfirmed) {
      denySponsorUserRequest(selected, companyId).then(() => {
        handleClose();
      });
    }
  };

  const handleSelectOnChange = (items, all = false) => {
    if (all) {
      setSelected(requests.items.map((it) => it.id));
    } else {
      setSelected(items);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
      <DialogContent sx={{ p: 2 }}>
        <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
          {requests.totalCount} {T.translate("sponsor_users.access_request")}
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ color: "text.secondary" }}
        >
          {T.translate("sponsor_users.process_request.select_users")}
        </Typography>
        <Card variant="outlined">
          <CheckBoxList
            items={requests.items.map((it) => ({
              id: it.id,
              name: it.requester_first_name
            }))}
            onChange={handleSelectOnChange}
            allItemsLabel={T.translate(
              "sponsor_users.process_request.select_all_users"
            )}
            boxHeight="200px"
          />
        </Card>
      </DialogContent>
      <Divider sx={{ margin: "10px 0px 20px 0px" }} />
      <DialogActions>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleDelete}
        >
          {T.translate("sponsor_users.process_request.dismiss_users")}
        </Button>
        <Button fullWidth variant="contained" onClick={handleAdmit}>
          {T.translate("sponsor_users.process_request.admit_users")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ProcessRequestPopup.propTypes = {
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  approveSponsorUserRequest,
  denySponsorUserRequest
})(ProcessRequestPopup);
