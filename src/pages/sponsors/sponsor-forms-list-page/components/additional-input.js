import React from "react";
import {
  Box, Button,
  Checkbox, Divider,
  FormControl,
  FormControlLabel,
  Grid2,
  MenuItem,
  Select,
  TextField
} from "@mui/material";
import T from "i18n-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MetaFieldValues from "../../../sponsors_inventory/popup/meta-field-values";
import { METAFIELD_TYPES, METAFIELD_TYPES_WITH_OPTIONS } from "../../../../utils/constants";
import showConfirmDialog from "../../../../components/mui/components/showConfirmDialog";



const AdditionalInput = ({field, fieldIdx, entity, setEntity, onMetaFieldDelete}) => {

  const handleChange = (name, value) => {
    const newFields = [...entity.meta_fields];
    newFields[fieldIdx][name] = value;
    setEntity(prevEntity => ({ ...prevEntity, meta_fields: newFields }));
  }

  const handleRemoveFieldType = async (fieldType, index) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("sponsor_forms.form_template_popup.delete_meta_field_warning")} ${
        fieldType.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const removeFromUI = () => {
        let new_meta_fields = [...entity.meta_fields].filter(
          (_, i) => i !== index
        );
        if (new_meta_fields.length === 0)
          new_meta_fields = [
            { name: "", type: "Text", is_required: false, values: [] }
          ];
        setEntity({ ...entity, meta_fields: new_meta_fields });
      };
      if (fieldType.id) {
        onMetaFieldDelete(entity.id, fieldType.id).then(() => {
          removeFromUI();
        });
      } else {
        removeFromUI();
      }
    }
  };

  const handleRemoveValue = async (
    metaField,
    metaFieldValue,
    valueIndex,
    fieldIndex
  ) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("sponsor_forms.form_template_popup.delete_value_warning")} ${
        metaFieldValue.name
      }`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const removeValueFromFields = () => {
        const newFields = [...entity.meta_fields];
        newFields[fieldIndex].values = newFields[fieldIndex].values.filter(
          (_, index) => index !== valueIndex
        );
        setEntity({ ...entity, meta_fields: newFields });
      };
      if (metaField.id && metaFieldValue.id) {
        if (onMetaFieldTypeDeleted) {
          onMetaFieldTypeValueDeleted(
            entity.id,
            metaField.id,
            metaFieldValue.id
          ).then(() => {
            removeValueFromFields();
          });
        }
      } else {
        removeValueFromFields();
      }
    }
  };

  const handleAddValue = (index) => {
    const newFields = [...entity.meta_fields];
    newFields[index].values.push({ value: "", isDefault: false });
    setEntity({ ...entity, meta_fields: newFields });
  };

  const handleFieldValueChange = (fieldIndex, valueIndex, key, value) => {
    const newFields = [...entity.meta_fields];
    newFields[fieldIndex].values[valueIndex][key] = value;
    setEntity({ ...entity, meta_fields: newFields });
  };

  const handleAddField = () => {
    setEntity({
      ...entity,
      meta_fields: [
        ...entity.meta_fields,
        { name: "", type: "Text", is_required: false, values: [] }
      ]
    });
  };

  return (
    <Grid2 container spacing={2} sx={{ alignItems: "center" }}>
      <Grid2 size={11}>
        <Box
          sx={{
            border: "1px solid #0000001F",
            borderRadius: "4px",
            p: 2,
            my: 2
          }}
        >
          <Grid2 container spacing={2} sx={{ alignItems: "end" }}>
            <Grid2 size={4}>
              <TextField
                name="fieldTitle"
                label={T.translate("sponsor_forms.form_template_popup.meta_field_title")}
                variant="outlined"
                value={field.name}
                onChange={ev => handleChange("name", ev.target.value)}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <Select
                value={field.type}
                name="fieldType"
                label={T.translate("sponsor_forms.form_template_popup.meta_field_type")}
                fullWidth
                onChange={ev => handleChange("type", ev.target.value)}
              >
                {METAFIELD_TYPES.map((field_type) => (
                  <MenuItem value={field_type}>{field_type}</MenuItem>
                ))}
              </Select>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.is_required}
                      onChange={ev => handleChange("is_required", ev.target.checked)}
                    />
                  }
                  label={T.translate(
                    "sponsor_forms.form_template_popup.meta_field_required"
                  )}
                />
              </FormControl>
            </Grid2>
          </Grid2>
          {METAFIELD_TYPES_WITH_OPTIONS.includes(field.type) && (
            <>
              <Divider sx={{ mt: 2 }} />
              <MetaFieldValues
                field={field}
                fieldIndex={fieldIdx}
                entity={entity}
                setEntity={setEntity}
                handleFieldValueChange={handleFieldValueChange}
                handleRemoveValue={handleRemoveValue}
                handleAddValue={handleAddValue}
              />
            </>
          )}
        </Box>
      </Grid2>
      <Grid2 size={1}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            aria-label="delete"
            sx={{
              width: 40,
              height: 40,
              minWidth: "auto",
              borderRadius: "50%",
              padding: 0
            }}
            onClick={() => handleRemoveFieldType(field, fieldIdx)}
          >
            <DeleteIcon />
          </Button>
          <Button
            variant="contained"
            aria-label="add"
            sx={{
              width: 40,
              height: 40,
              minWidth: "auto",
              borderRadius: "50%",
              padding: 0
            }}
            onClick={handleAddField}
          >
            <AddIcon />
          </Button>
        </Box>
      </Grid2>
    </Grid2>
  );
}

export default AdditionalInput;