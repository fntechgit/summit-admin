import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { epochToMoment } from "openstack-uicore-foundation/lib/utils/methods";
import {
  Box,
  Button,
  Card,
  IconButton,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PropTypes from "prop-types";
import showConfirmDialog from "../../../../components/mui/showConfirmDialog";

const CartNote = ({
  title,
  note,
  placeholder,
  onSave,
  onDelete,
  canEdit,
  canDelete
}) => {
  const [edit, setEdit] = useState(false);
  const [editValue, setEditValue] = useState(note?.content || "");

  useEffect(() => {
    setEditValue(note?.content || "");
  }, [note?.content]);

  const handleSave = () => {
    const newNote = note?.id
      ? { ...note, content: editValue }
      : { content: editValue };
    onSave?.(newNote).then(() => {
      setEdit(false);
    });
  };

  const handleDelete = async (note) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("general.remove_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      onDelete?.(note.id);
    }
  };

  return (
    <Paper elevation={0} sx={{ width: "100%", mb: 2, p: "18px" }}>
      <Typography
        variant="body2"
        gutterBottom
        sx={{ color: "text.disabled", textTransform: "uppercase", mb: 2 }}
      >
        {title}
      </Typography>
      {(!note || edit) && (
        <Card
          variant="outlined"
          sx={{
            border: "1px solid #DDDDDD",
            borderRadius: "4px",
            display: "flex",
            p: "12px 18px"
          }}
        >
          <TextField
            fullWidth
            value={editValue}
            onChange={(ev) => setEditValue(ev.target.value)}
            placeholder={placeholder}
            sx={{ flexGrow: 1 }}
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
                style: {
                  height: 40
                }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ minWidth: "96px" }}
            disabled={!editValue}
          >
            {T.translate("general.save")}
          </Button>
        </Card>
      )}
      {!!note && !edit && (
        <Card
          variant="contained"
          sx={{
            display: "flex",
            backgroundColor: "#2196F314",
            borderRadius: "4px",
            p: "12px 18px"
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body" component="div">
              {note.content}
            </Typography>
            <Typography
              variant="caption"
              component="div"
              sx={{ color: "text.disabled", mt: 1 }}
            >
              {note.created_by_fullname} -{" "}
              {epochToMoment(note.created)?.format("MMMM Do YYYY, h:mma")}
            </Typography>
          </Box>
          <Box>
            <IconButton
              size="large"
              aria-label="edit"
              onClick={() => setEdit(true)}
              disabled={!canEdit}
            >
              <EditIcon fontSize="large" />
            </IconButton>
            <IconButton
              size="large"
              disabled={!canDelete || !onDelete}
              onClick={() => handleDelete(note)}
            >
              <DeleteIcon fontSize="large" />
            </IconButton>
          </Box>
        </Card>
      )}
    </Paper>
  );
};

CartNote.propTypes = {
  title: PropTypes.string.isRequired,
  note: PropTypes.shape({
    value: PropTypes.string,
    created: PropTypes.number
  }),
  placeholder: PropTypes.string,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool
};

CartNote.defaultProps = {
  placeholder: "",
  note: null,
  onSave: null,
  onDelete: null,
  canEdit: true,
  canDelete: true
};

export default CartNote;
