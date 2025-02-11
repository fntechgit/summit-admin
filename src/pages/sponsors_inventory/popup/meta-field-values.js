import React from "react";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  TextField,
  Grid2,
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((item, index) => ({ ...item, order: index + 1 }));
};

const MetaFieldValues = ({
  field,
  fieldIndex,
  handleFieldValueChange,
  handleRemoveValue,
  handleAddValue,
  formData,
  setFormData
}) => {
  const onFieldValuesDragEnd = (result) => {
    if (!result.destination) return;

    const newValues = reorder(
      formData.meta_fields[fieldIndex].values,
      result.source.index,
      result.destination.index
    );

    const newMetaFields = [...formData.meta_fields];
    newMetaFields[fieldIndex].values = newValues;
    setFormData({ ...formData, meta_fields: newMetaFields });
  };

  return (
    <Box>
      <DragDropContext onDragEnd={onFieldValuesDragEnd}>
        <Droppable droppableId={`droppable-${fieldIndex}`}>
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              {field.values
                .sort((a, b) => a.order - b.order)
                .map((val, valueIndex) => (
                  <>
                    <Draggable
                      key={val.id}
                      draggableId={String(val.id)}
                      index={valueIndex}
                    >
                      {(provided, snapshot) => (
                        <Grid2
                          container
                          spacing={2}
                          sx={{
                            alignItems: "end",
                            background: snapshot.isDragging
                              ? "#ebebeb"
                              : "inherit",
                            boxShadow: snapshot.isDragging
                              ? "0px 5px 15px rgba(0, 0, 0, 0.3)"
                              : "none",
                            transition:
                              "transform 0.2s ease, box-shadow 0.2s ease",
                            transform: snapshot.isDragging
                              ? "scale(1.02)"
                              : "none",
                            py: 2
                          }}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Grid2 size={4}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <TextField
                                value={val.name}
                                placeholder={T.translate(
                                  "edit_inventory_item.placeholders.meta_field_name"
                                )}
                                onChange={(e) =>
                                  handleFieldValueChange(
                                    fieldIndex,
                                    valueIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                fullWidth
                              />
                            </Box>
                          </Grid2>
                          <Grid2 size={4}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <TextField
                                value={val.value}
                                placeholder={T.translate(
                                  "edit_inventory_item.placeholders.meta_field_value"
                                )}
                                onChange={(e) =>
                                  handleFieldValueChange(
                                    fieldIndex,
                                    valueIndex,
                                    "value",
                                    e.target.value
                                  )
                                }
                                fullWidth
                                slotProps={{
                                  input: {
                                    endAdornment: (
                                      <IconButton
                                        onClick={() =>
                                          handleRemoveValue(
                                            field,
                                            val,
                                            valueIndex,
                                            fieldIndex
                                          )
                                        }
                                      >
                                        <CloseIcon />
                                      </IconButton>
                                    )
                                  }
                                }}
                              />
                            </Box>
                          </Grid2>
                          <Grid2 size={4}>
                            <FormGroup>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={val.is_default}
                                    onChange={(e) =>
                                      handleFieldValueChange(
                                        fieldIndex,
                                        valueIndex,
                                        "is_default",
                                        e.target.checked
                                      )
                                    }
                                  />
                                }
                                label={T.translate(
                                  "edit_inventory_item.meta_field_is_default"
                                )}
                              />
                            </FormGroup>
                          </Grid2>
                        </Grid2>
                      )}
                    </Draggable>
                    <Divider />
                  </>
                ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      <Grid2 container spacing={2} sx={{ mt: 2 }} offset={4}>
        <Button
          startIcon={<AddIcon />}
          onClick={() => handleAddValue(fieldIndex)}
        >
          {T.translate("edit_inventory_item.meta_field_add_value")}
        </Button>
      </Grid2>
    </Box>
  );
};

export default MetaFieldValues;
