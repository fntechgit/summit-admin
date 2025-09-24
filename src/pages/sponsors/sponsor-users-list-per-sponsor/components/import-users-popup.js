import React, { useEffect, useState } from "react";
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
import CheckBoxList from "../../../../components/mui/checkbox-list";
import SummitsDropdown from "../../../../components/mui/summits-dropdown";
import {
  fetchSponsorUsersBySummit,
  importSponsorUsers
} from "../../../../actions/sponsor-users-actions";

const ImportUsersPopup = ({
  open,
  currentSummit,
  sponsorId,
  companyId,
  onClose,
  importSponsorUsers
}) => {
  const [selectedSummit, setSelectedSummit] = useState(null);
  const [userOptions, setUserOptions] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (selectedSummit) {
      fetchSponsorUsersBySummit(selectedSummit, companyId, 1).then(
        (userData) => {
          setUserOptions(userData);
          setSelectedUsers([]);
        }
      );
    }
  }, [selectedSummit]);

  const handleLoadMoreUsers = () => {
    if (userOptions.current_page < userOptions.last_page) {
      fetchSponsorUsersBySummit(
        selectedSummit,
        companyId,
        userOptions.current_page + 1
      ).then((userData) => {
        setUserOptions((value) => ({
          ...userData,
          data: [...value.data, ...userData.data]
        }));
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleImport = async () => {
    importSponsorUsers(
      sponsorId,
      companyId,
      selectedSummit,
      selectedUsers
    ).then(() => {
      onClose();
    });
  };

  const handleSelectOnChange = (items, all = false) => {
    if (all) {
      setSelectedUsers("all");
    } else {
      setSelectedUsers(items);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", p: 2 }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_users.import_users.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2 }}>
        <SummitsDropdown
          onChange={setSelectedSummit}
          excludeSummitIds={[currentSummit.id]}
        />
        {selectedSummit && userOptions && (
          <>
            <Typography
              variant="body1"
              gutterBottom
              sx={{ color: "text.secondary", mt: 2 }}
            >
              {T.translate("sponsor_users.import_users.select_users")}
            </Typography>
            <Card variant="outlined">
              <CheckBoxList
                items={userOptions.data.map((it) => ({
                  id: it.id,
                  name:
                    it.first_name && it.last_name
                      ? `${it.first_name} ${it.last_name}`
                      : it.email
                }))}
                onChange={handleSelectOnChange}
                label={T.translate(
                  "sponsor_users.import_users.select_all_users"
                )}
                loadMoreData={handleLoadMoreUsers}
                boxHeight="200px"
              />
            </Card>
          </>
        )}
      </DialogContent>
      <Divider sx={{ margin: "10px 0px 20px 0px" }} />
      <DialogActions>
        <Button
          fullWidth
          variant="contained"
          onClick={handleImport}
          disabled={selectedUsers.length === 0}
        >
          {T.translate("sponsor_users.import_users.import_users")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ImportUsersPopup.propTypes = {
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorUsersListState, currentSummitState }) => ({
  userGroups: sponsorUsersListState.userGroups,
  currentSummit: currentSummitState.currentSummit
});

export default connect(mapStateToProps, {
  importSponsorUsers
})(ImportUsersPopup);
