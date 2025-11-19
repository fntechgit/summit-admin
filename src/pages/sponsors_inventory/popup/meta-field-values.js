import React from "react";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
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
import DragAndDropList from "../../../components/mui/dnd-list";

const MetaFieldValues = ({
  field,
  fieldIndex,
  onMetaFieldTypeValueDeleted,
  initialEntity
}) => {
  const { values, setFieldValue } = useFormikContext();

  const sortedValues = [...field.values].sort((a, b) => a.order - b.order);

  const onReorder = (newValues) => {
    const newMetaFields = [...values.meta_fields];
    newMetaFields[fieldIndex].values = newValues;
    setFieldValue("meta_fields", newMetaFields);
  };

  const handleFieldValueChange = (fieldIndex, valueIndex, key, value) => {
    const newFields = [...values.meta_fields];
    if (key === "is_default" && value === true) {
      newFields[fieldIndex].values.forEach((v) => {
        v.is_default = false;
      });
    }
    newFields[fieldIndex].values[valueIndex][key] = value;
    setFieldValue("meta_fields", newFields);
  };

  const handleAddValue = (index) => {
    const newFields = [...values.meta_fields];
    newFields[index].values.push({ value: "", name: "", is_default: false });
    setFieldValue("meta_fields", newFields);
  };

  const isMetafieldValueIncomplete = (index) => {
    const metafield = values.meta_fields[index];
    if (metafield.values.length > 0) {
      return metafield.values.some((f) => f.name === "" || f.value === "");
    }
    return false;
  };

  const handleRemoveValue = async (
    metaField,
    metaFieldValue,
    valueIndex,
    fieldIndex
  ) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("meta_field_values_list.delete_value_warning")} ${
        metaFieldValue.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const removeValueFromFields = () => {
        const newFields = [...values.meta_fields];
        newFields[fieldIndex].values = newFields[fieldIndex].values.filter(
          (_, index) => index !== valueIndex
        );
        setFieldValue("meta_fields", newFields);
      };

      if (metaField.id && metaFieldValue.id && onMetaFieldTypeValueDeleted) {
        onMetaFieldTypeValueDeleted(
          initialEntity.id,
          metaField.id,
          metaFieldValue.id
        ).then(() => {
          removeValueFromFields();
        });
      } else {
        removeValueFromFields();
      }
    }
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
        </Grid2>
        <Grid2 size={4}>
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
          disabled={isMetafieldValueIncomplete(fieldIndex)}
          onClick={() => handleAddValue(fieldIndex)}
        >
          {T.translate("edit_inventory_item.meta_field_add_value")}
        </Button>
      </Grid2>
    </Box>
  );
};

export default MetaFieldValues;
