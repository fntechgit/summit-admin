import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Divider, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ItemTableField from "../FormItemTable/components/ItemTableField";

const ItemSettingsModal = ({ item, timeZone, open, onClose }) => {
  const itemFields =
    item?.meta_fields.filter((f) => f.class_field === "Item") || [];

  const handleSave = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{T.translate("edit_form.settings")}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500]
        })}
      >
        <CloseIcon />
      </IconButton>
      <Divider />
      <DialogContent>
        <Typography
          variant="body2"
          component="div"
          sx={{ marginBottom: "20px" }}
        >
          {item?.name}
        </Typography>
        <Divider
          sx={{
            marginBottom: "20px",
            marginLeft: "-24px",
            marginRight: "-24px"
          }}
        />
        {itemFields.map((exc) => (
          <React.Fragment key={`item-field-${exc.type_id}`}>
            <ItemTableField
              field={exc}
              rowId={item.form_item_id}
              timeZone={timeZone}
              label={exc.name}
            />
          </React.Fragment>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} variant="contained" fullWidth>
          {T.translate("general.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ItemSettingsModal.propTypes = {
  item: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ItemSettingsModal;
