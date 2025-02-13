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
  Divider,
  Grid2
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DragAndDropList from "../../../components/mui/components/dnd-list";

const MetaFieldValues = ({
  field,
  fieldIndex,
  handleFieldValueChange,
  handleRemoveValue,
  handleAddValue,
  entity,
  setEntity
}) => {
  const sortedValues = [...field.values].sort((a, b) => a.order - b.order);

  const onReorder = (newValues) => {
    const newMetaFields = [...entity.meta_fields];
    newMetaFields[fieldIndex].values = newValues;
    setEntity({ ...entity, meta_fields: newMetaFields });
  };

  const renderMetaFieldValue = (val, valueIndex, provided, snapshot) => (
    <>
      <Grid2
        container
        spacing={2}
        sx={{
          alignItems: "end",
          background: snapshot.isDragging ? "#ebebeb" : "inherit",
          boxShadow: snapshot.isDragging
            ? "0px 5px 15px rgba(0,0,0,0.3)"
            : "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          transform: snapshot.isDragging ? "scale(1.02)" : "none",
          py: 2
        }}
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
                        handleRemoveValue(field, val, valueIndex, fieldIndex)
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
              label={T.translate("edit_inventory_item.meta_field_is_default")}
            />
          </FormGroup>
        </Grid2>
      </Grid2>
      <Divider />
    </>
  );

  return (
    <Box>
      <DragAndDropList
        items={sortedValues}
        onReorder={onReorder}
        renderItem={renderMetaFieldValue}
        idKey="id"
        updateOrder="order"
        droppableId={`droppable-${fieldIndex}`}
      />
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
