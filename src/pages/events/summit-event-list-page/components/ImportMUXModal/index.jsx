import React, { useState } from "react";
import T from "i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";

const FieldLabel = ({ htmlFor, label, info }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
    <Typography component="label" htmlFor={htmlFor}>
      {label}
    </Typography>
    <Tooltip title={info}>
      <InfoOutlinedIcon fontSize="small" />
    </Tooltip>
  </Box>
);

const ImportMUXModal = ({ show, onClose, onImport }) => {
  const { errorMessage } = useSnackbarMessage();
  const [tokenId, setTokenId] = useState("");
  const [tokenSecret, setTokenSecret] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    if (isSaving) return;
    setTokenId("");
    setTokenSecret("");
    setEmailTo("");
    onClose();
  };

  const handleImport = () => {
    if (isSaving) return;
    if (!tokenId || !tokenSecret) {
      errorMessage(T.translate("event_list.missing_token_error"));
      return;
    }
    setIsSaving(true);
    onImport(tokenId, tokenSecret, emailTo)
      .then(() => {
        handleClose();
      })
      .catch((error) => {
        errorMessage(
          T.translate("event_list.mux_import_error", {
            error: error.message || error
          })
        );
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <Dialog
      open={show}
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        component="div"
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <Typography variant="h5">
          {T.translate("event_list.mux_import")}
        </Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={isSaving}
          aria-label="close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <FieldLabel
              htmlFor="mux_token_id"
              label={T.translate("event_list.mux_token_id")}
              info={T.translate("event_list.mux_token_id_info")}
            />
            <TextField
              id="mux_token_id"
              value={tokenId}
              onChange={(ev) => setTokenId(ev.target.value)}
              fullWidth
              size="small"
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <FieldLabel
              htmlFor="mux_token_secret"
              label={T.translate("event_list.mux_token_secret")}
              info={T.translate("event_list.mux_token_secret_info")}
            />
            <TextField
              id="mux_token_secret"
              type="password"
              value={tokenSecret}
              onChange={(ev) => setTokenSecret(ev.target.value)}
              fullWidth
              size="small"
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <FieldLabel
              htmlFor="mux_email_to"
              label={T.translate("event_list.mux_email_to")}
              info={T.translate("event_list.mux_email_to_info")}
            />
            <TextField
              id="mux_email_to"
              type="email"
              value={emailTo}
              onChange={(ev) => setEmailTo(ev.target.value)}
              fullWidth
              size="small"
            />
          </Grid2>
        </Grid2>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          variant="contained"
          fullWidth
          disabled={isSaving}
          onClick={handleImport}
        >
          {T.translate("event_list.import")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportMUXModal;
