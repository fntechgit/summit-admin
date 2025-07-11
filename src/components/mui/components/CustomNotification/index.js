import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Snackbar, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CustomNotificationContext from "./Context";
import { NOTIFICATION_TIMEOUT } from "../../../../utils/constants";

const CustomNotification = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [msgData, setMsgData] = useState({});
  const successMessage = (msg) =>
    setMsgData({ message: msg, severity: "success" });
  const errorMessage = (msg) =>
    setMsgData({ message: msg, severity: "warning" });
  const messageContext = useMemo(() => ({ successMessage, errorMessage }), []);

  const onClose = () => {
    setOpen(false);
    setTimeout(() => setMsgData({}), NOTIFICATION_TIMEOUT);
  };

  useEffect(() => {
    if (msgData.message) {
      setOpen(true);
    }
  }, [msgData]);

  return (
    <CustomNotificationContext.Provider value={messageContext}>
      <Snackbar
        open={open}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={NOTIFICATION_TIMEOUT}
      >
        <Alert
          onClose={onClose}
          severity={msgData.severity}
          variant="filled"
          sx={{ width: "100%", backgroundColor: `${msgData.severity}.light` }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />
          }}
        >
          <Typography variant="body1">{msgData.message}</Typography>
        </Alert>
      </Snackbar>
      {children}
    </CustomNotificationContext.Provider>
  );
};

CustomNotification.propTypes = {
  children: PropTypes.node
};

export default CustomNotification;
