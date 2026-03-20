import React, { useState } from "react";
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
import showConfirmDialog from "../../../../../components/mui/showConfirmDialog";

const CartNote = ({
  title,
  notes,
  placeholder,
  onSave,
  onDelete,
  canEdit,
  canDelete,
  multiple
}) => {
  const [editNote, setEditNote] = useState(null);
  // we show the input view always when multiple or when is single and editing or empty
  const showEditForm = multiple || editNote || notes.length === 0;
  // we show the current notes view always when multiple or when is single and not editing
  const showCurrentNotes = multiple || !showEditForm;
  // sort notes by created date
  const sortedNotes = [...notes].sort((a, b) => b.created - a.created);

  const handleEdit = (note) => {
    setEditNote(note);
  };

  const handleSave = () => {
    onSave?.(editNote)
      .then(() => {
        setEditNote(null);
      })
      .catch(console.log); // dummy catch
  };

  const handleDelete = async (noteId) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("general.remove_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      onDelete?.(noteId);
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
      {showEditForm && (
        <Card
          variant="outlined"
          sx={{
            border: "1px solid #DDDDDD",
            borderRadius: "4px",
            display: "flex",
            p: "12px 18px",
            mb: 2
          }}
        >
          <TextField
            fullWidth
            autoFocus={!!editNote}
            value={editNote?.content || ""}
            onChange={(ev) => {
              const { value } = ev.target;
              setEditNote((currentNote) => ({
                ...(currentNote || {}),
                content: value
              }));
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && editNote?.content) handleSave();
              if (ev.key === "Escape" && !multiple) setEditNote(null);
            }}
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
            disabled={!editNote?.content}
          >
            {T.translate("general.save")}
          </Button>
        </Card>
      )}
      {showCurrentNotes &&
        sortedNotes.map((note, idx) => (
          <Card
            key={`notes-${note.id}`}
            variant="contained"
            sx={{
              display: "flex",
              backgroundColor: multiple ? "#0000000A" : "#2196F314",
              borderRadius: "4px",
              p: "12px 18px",
              ...(idx < sortedNotes.length - 1 && { mb: 2 })
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
              {!multiple && (
                <IconButton
                  size="large"
                  aria-label="edit"
                  onClick={() => handleEdit(notes?.[0])}
                  disabled={!canEdit}
                >
                  <EditIcon fontSize="large" />
                </IconButton>
              )}
              <IconButton
                size="large"
                disabled={!canDelete || !onDelete}
                onClick={() => handleDelete(note.id)}
              >
                <DeleteIcon fontSize="large" />
              </IconButton>
            </Box>
          </Card>
        ))}
    </Paper>
  );
};

CartNote.propTypes = {
  title: PropTypes.string.isRequired,
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      created: PropTypes.number
    })
  ),
  placeholder: PropTypes.string,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
  multiple: PropTypes.bool
};

CartNote.defaultProps = {
  placeholder: "",
  notes: [],
  onSave: null,
  onDelete: null,
  canEdit: true,
  canDelete: true,
  multiple: false
};

export default CartNote;
