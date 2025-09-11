import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography
} from "@mui/material";
import { Warning, CheckCircle, Error, Info } from "@mui/icons-material";

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
  iconType = "warning",
  variant = "contained",
  onConfirm,
  onCancel,
  confirmButtonText = "Confirm",
  confirmButtonColor,
  cancelButtonText = "Cancel",
  cancelButtonColor
}) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <div style={{ display: "flex", alignItems: "center" }}>
        {iconMap[iconType] && (
          <div style={{ marginRight: 10 }}>{iconMap[iconType]}</div>
        )}
        <Typography variant="body2">{text}</Typography>
      </div>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color={cancelButtonColor} variant={variant}>
        {cancelButtonText}
      </Button>
      <Button onClick={onConfirm} color={confirmButtonColor} variant={variant}>
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
  variant: PropTypes.string,
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
  variant: "contained",
  confirmButtonText: "Confirm",
  confirmButtonColor: "primary",
  cancelButtonText: "Cancel",
  cancelButtonColor: "default"
};

export default ConfirmDialog;
