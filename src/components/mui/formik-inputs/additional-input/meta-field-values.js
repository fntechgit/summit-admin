import React from "react";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import { Box, Button, Grid2, Divider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DragAndDropList from "../../dnd-list";
import showConfirmDialog from "../../showConfirmDialog";
import MuiFormikTextField from "../mui-formik-textfield";
import MuiFormikCheckbox from "../mui-formik-checkbox";

const MetaFieldValues = ({
  field,
  fieldIndex,
  baseName = "meta_fields",
  onMetaFieldTypeValueDeleted,
  entityId
}) => {
  const { values, setFieldValue } = useFormikContext();

  const metaFields = values[baseName] || [];
  const sortedValues = [...field.values].sort((a, b) => a.order - b.order);

  const buildValueFieldName = (valueIndex, fieldName) =>
    `${baseName}[${fieldIndex}].values[${valueIndex}].${fieldName}`;

  const onReorder = (newValues) => {
    const newMetaFields = [...metaFields];
    newMetaFields[fieldIndex].values = newValues;
    setFieldValue(baseName, newMetaFields);
  };

  const handleAddValue = () => {
    const newFields = [...metaFields];
    newFields[fieldIndex].values.push({
      value: "",
      name: "",
      is_default: false
    });
    setFieldValue(baseName, newFields);
  };

  const handleDefaultChange = (valueIndex, checked) => {
    const newFields = [...metaFields];
    if (checked) {
      newFields[fieldIndex].values.forEach((v) => {
        v.is_default = false;
      });
    }
    newFields[fieldIndex].values[valueIndex].is_default = checked;
    setFieldValue(baseName, newFields);
  };

  const isMetafieldValueIncomplete = () => {
    if (field.values.length > 0) {
      return field.values.some((v) => !v.name?.trim() || !v.value?.trim());
    }
    return false;
  };

  const handleRemoveValue = async (metaFieldValue, valueIndex) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("meta_field_values_list.delete_value_warning")} ${
        metaFieldValue.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (!isConfirmed) return;

    const removeValueFromFields = () => {
      const newFields = [...metaFields];
      newFields[fieldIndex].values = newFields[fieldIndex].values.filter(
        (_, index) => index !== valueIndex
      );
      setFieldValue(baseName, newFields);
    };

    if (field.id && metaFieldValue.id && onMetaFieldTypeValueDeleted) {
      console.log("Delete params:", {
        entityId,
        fieldId: field.id,
        valueId: metaFieldValue.id
      });
      onMetaFieldTypeValueDeleted(entityId, field.id, metaFieldValue.id).then(
        () => removeValueFromFields()
      );
    } else {
      removeValueFromFields();
    }
  };

  const renderMetaFieldValue = (val, sortedIndex, provided, snapshot) => {
    const originalIndex = field.values.findIndex(
      (v) => (v.id && v.id === val.id) || v === val
    );
    const valueIndex = originalIndex !== -1 ? originalIndex : sortedIndex;

    return (
      <Box key={val.id || `value-${valueIndex}`}>
        <Grid2
          container
          spacing={2}
          sx={{
            alignItems: "start",
            background: snapshot?.isDragging ? "#ebebeb" : "inherit",
            boxShadow: snapshot?.isDragging
              ? "0px 5px 15px rgba(0,0,0,0.3)"
              : "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            transform: snapshot?.isDragging ? "scale(1.02)" : "none",
            py: 2
          }}
        >
          <Grid2 size={4}>
            <MuiFormikTextField
              name={buildValueFieldName(valueIndex, "name")}
              placeholder={T.translate(
                "edit_inventory_item.placeholders.meta_field_name"
              )}
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikTextField
              name={buildValueFieldName(valueIndex, "value")}
              placeholder={T.translate(
                "edit_inventory_item.placeholders.meta_field_value"
              )}
              margin="none"
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => handleRemoveValue(val, valueIndex)}
                    aria-label="remove value"
                  >
                    <CloseIcon />
                  </IconButton>
                )
              }}
            />
          </Grid2>
          <Grid2 size={4}>
            <MuiFormikCheckbox
              name={buildValueFieldName(valueIndex, "is_default")}
              label={T.translate("edit_inventory_item.meta_field_is_default")}
              onChange={(e) =>
                handleDefaultChange(valueIndex, e.target.checked)
              }
            />
          </Grid2>
        </Grid2>
        <Divider />
      </Box>
    );
  };

  return (
    <Box>
      <DragAndDropList
        items={sortedValues}
        onReorder={onReorder}
        renderItem={renderMetaFieldValue}
        idKey="id"
        updateOrder="order"
        droppableId={`droppable-values-${fieldIndex}`}
      />
      <Grid2 container spacing={2} sx={{ mt: 2 }} offset={4}>
        <Button
          startIcon={<AddIcon />}
          disabled={isMetafieldValueIncomplete()}
          onClick={handleAddValue}
          variant="text"
        >
          {T.translate("edit_inventory_item.meta_field_add_value")}
        </Button>
      </Grid2>
    </Box>
  );
};

export default MetaFieldValues;
