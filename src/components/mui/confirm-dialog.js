import React from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography
} from "@mui/material";
import { CheckCircle, Error, Info, Warning } from "@mui/icons-material";

const iconMap = {
  warning: <Warning color="warning" />,
  success: <CheckCircle color="success" />,
  error: <Error color="error" />,
  info: <Info color="info" />
};

const ConfirmDialog = ({
  open,
  title,
  text,
  iconType = "",
  onConfirm,
  onCancel,
  confirmButtonText = "Confirm",
  confirmButtonColor = "primary",
  cancelButtonText = "Cancel",
  cancelButtonColor = "primary"
}) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle sx={{ p: 2 }} component="div">
      <Typography variant="h5">{title}</Typography>
    </DialogTitle>
    <Divider />
    <DialogContent sx={{ p: 2 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {iconMap[iconType] && (
          <div style={{ marginRight: 10 }}>{iconMap[iconType]}</div>
        )}
        <Typography variant="body1">{text}</Typography>
      </div>
    </DialogContent>
    <Divider sx={{ margin: "10px 0px 10px 0px" }} />
    <DialogActions>
      <Button
        fullWidth
        onClick={onCancel}
        color={cancelButtonColor}
        variant="outlined"
      >
        {cancelButtonText}
      </Button>
      <Button
        fullWidth
        onClick={onConfirm}
        color={confirmButtonColor}
        variant="contained"
      >
        {confirmButtonText}
      </Button>
    </DialogActions>
  </Dialog>
);

ConfirmDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  iconType: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmButtonText: PropTypes.string,
  confirmButtonColor: PropTypes.string,
  cancelButtonText: PropTypes.string,
  cancelButtonColor: PropTypes.string
};

ConfirmDialog.defaultProps = {
  open: false,
  iconType: "warning",
  confirmButtonText: "Confirm",
  confirmButtonColor: "primary",
  cancelButtonText: "Cancel",
  cancelButtonColor: "default"
};

export default ConfirmDialog;
