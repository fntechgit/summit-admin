import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const TagsDialog = ({ open, onClose, onSave, initialData }) => {
  const [tag, setTag] = useState(initialData?.tag || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setTag(initialData?.tag || "");
    setError("");
  }, [initialData, open]);

  const handleSave = () => {
    if (!tag.trim()) {
      setError(T.translate("edit_tag.name_required"));
      return;
    }
    onSave({ ...initialData, tag });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {initialData?.id
          ? `${T.translate("general.edit")} ${T.translate("edit_tag.tag")}`
          : `${T.translate("general.add")} ${T.translate("edit_tag.tag")}`}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={T.translate("edit_tag.name")}
          type="text"
          fullWidth
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{T.translate("general.cancel")}</Button>
        <Button onClick={handleSave} variant="contained">
          {T.translate("general.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagsDialog;
