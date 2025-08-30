import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Alert, Snackbar, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import SnackbarNotificationContext from "./Context";
import { NOTIFICATION_TIMEOUT } from "../../../../utils/constants";
import { clearSnackbarMessage } from "../../../../actions/base-actions";

/*
 This component works in two ways:
 - useSnackbarMessage hook that returns successMessage and errorMessage methods to trigger the snackbar.
 - snackbarErrorHandler and snackbarSuccessHandler actions from base-actions that change the base reducer
 */

const SnackbarNotification = ({
  children,
  snackbarMessage,
  clearSnackbarMessage
}) => {
  const [open, setOpen] = useState(false);
  const [msgData, setMsgData] = useState({});
  // this two methods are for on-demand messaging
  const successMessage = (msg) => setMsgData({ html: msg, type: "success" });
  const errorMessage = (msg) => setMsgData({ html: msg, type: "warning" });
  const messageContext = useMemo(() => ({ successMessage, errorMessage }), []);

  const clearMessage = () => {
    setMsgData({});
    clearSnackbarMessage();
  };

  const onClose = () => {
    setOpen(false);
    setTimeout(clearMessage, NOTIFICATION_TIMEOUT);
  };

  useEffect(() => {
    if (msgData.html) {
      setOpen(true);
    }
  }, [msgData]);

  // when snackbarMessage changes in base-reducer, we trigger the snackbar
  useEffect(() => {
    if (snackbarMessage?.html) {
      setMsgData(snackbarMessage);
    }
  }, [snackbarMessage]);

  return (
    <SnackbarNotificationContext.Provider value={messageContext}>
      <Snackbar
        open={open}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={NOTIFICATION_TIMEOUT}
      >
        <Alert
          onClose={onClose}
          severity={msgData.type}
          variant="filled"
          sx={{ width: "100%", backgroundColor: `${msgData.type}.light` }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />
          }}
        >
          <Typography
            variant="body1"
            component="div"
            dangerouslySetInnerHTML={{ __html: msgData.html }}
          />
        </Alert>
      </Snackbar>
      {children}
    </SnackbarNotificationContext.Provider>
  );
};

SnackbarNotification.propTypes = {
  children: PropTypes.node,
  snackbarMessage: PropTypes.object
};

const mapStateToProps = ({ baseState }) => ({
  snackbarMessage: baseState.snackbarMessage
});

export default connect(mapStateToProps, { clearSnackbarMessage })(
  SnackbarNotification
);
