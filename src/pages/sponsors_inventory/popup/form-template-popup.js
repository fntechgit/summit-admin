import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  Divider,
  Grid2
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { TextEditor } from "openstack-uicore-foundation/lib/components";
import { scrollToError, hasErrors } from "../../../utils/methods";
import showConfirmDialog from "../../../components/mui/components/showConfirmDialog";
import MetaFieldValues from "./meta-field-values";
import { METAFIELD_TYPES } from "../../../utils/constants";

const FormTemplateDialog = ({
  open,
  onClose,
  onSave,
  toDuplicate = false,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  entity: initialEntity,
  errors: initialErrors
}) => {
  const [entity, setEntity] = useState({
    id: null,
    code: "",
    name: "",
    instructions: "",
    meta_fields: [
      {
        name: "",
        type: "Text",
        required: false,
        minimum_quantity: "",
        maximum_quantity: "",
        values: []
      }
    ],
    materials: initialEntity?.materials || []
  });

  const [errors, setErrors] = useState(initialErrors || {});

  useEffect(() => {
    setEntity({
      id: toDuplicate ? null : initialEntity?.id || null,
      code: initialEntity?.code || "",
      name: initialEntity?.name || "",
      instructions: initialEntity?.instructions || "",
      meta_fields:
        initialEntity?.meta_fields.length > 0
          ? initialEntity?.meta_fields
          : [
              {
                name: "",
                type: "Text",
                is_required: false,
                values: [],
                minimum_quantity: "",
                maximum_quantity: ""
              }
            ],
      materials:
        initialEntity?.materials && initialEntity.materials.length > 0
          ? initialEntity.materials
          : []
    });
  }, [initialEntity, toDuplicate]);

  useEffect(() => {
    setErrors(initialErrors || {});
  }, [open]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setEntity({ ...entity, [id]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    const requiredFields = ["code", "name", "instructions"];

    requiredFields.forEach((field) => {
      if (!entity[field].trim()) {
        newErrors[field] = T.translate("edit_form_template.required_error");
      }
    });

    scrollToError(newErrors);

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSave(entity);
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

  const handleRemoveFieldType = async (fieldType, index) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_form_template.delete_meta_field_warning")} ${
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
        onMetaFieldTypeDeleted(entity.id, fieldType.id).then(() => {
          removeFromUI();
        });
      } else {
        removeFromUI();
      }
    }
  };

  const handleAddValue = (index) => {
    const newFields = [...entity.meta_fields];
    newFields[index].values.push({ value: "", isDefault: false });
    setEntity({ ...entity, meta_fields: newFields });
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

  const handleFieldChange = (index, field, value) => {
    const newFields = [...entity.meta_fields];
    newFields[index][field] = value;
    setEntity({ ...entity, meta_fields: newFields });
  };

  const handleFieldValueChange = (fieldIndex, valueIndex, key, value) => {
    const newFields = [...entity.meta_fields];
    newFields[fieldIndex].values[valueIndex][key] = value;
    setEntity({ ...entity, meta_fields: newFields });
  };

  const handleFieldValueQuantityChange = (fieldIndex, key, value) => {
    const newFields = [...entity.meta_fields];
    newFields[fieldIndex][key] = value;
    setEntity({ ...entity, meta_fields: newFields });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Edit Item
        <IconButton size="small" onClick={() => onClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={4}>
            <InputLabel htmlFor="code">
              {T.translate("edit_form_template.code")} *
            </InputLabel>
            <TextField
              variant="outlined"
              name="code"
              id="code"
              value={entity.code}
              error={!!errors.code}
              helperText={errors.code}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={8}>
            <InputLabel htmlFor="name">
              {T.translate("edit_form_template.name")} *
            </InputLabel>
            <TextField
              variant="outlined"
              name="name"
              id="name"
              value={entity.name}
              error={!!errors.name}
              helperText={errors.name}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
        </Grid2>
        <Divider />
        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="instructions">
              {T.translate("edit_form_template.instructions")} *
            </InputLabel>
            <TextEditor
              name="instructions"
              id="instructions"
              value={entity.instructions}
              error={hasErrors("instructions", errors)}
              helperText={errors.instructions}
              onChange={handleChange}
            />
          </Grid2>
        </Grid2>

        <Divider />
        <DialogTitle sx={{ p: 3 }}>
          {T.translate("edit_form_template.meta_fields")}
        </DialogTitle>

        <Box sx={{ px: 3 }}>
          {entity.meta_fields.map((field, fieldIndex) => (
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
                      <InputLabel htmlFor="fieldTitle">
                        {T.translate("edit_form_template.meta_field_title")}
                      </InputLabel>
                      <TextField
                        name="fieldTitle"
                        variant="outlined"
                        value={field.name}
                        onChange={(ev) =>
                          handleFieldChange(fieldIndex, "name", ev.target.value)
                        }
                        fullWidth
                      />
                    </Grid2>
                    <Grid2 size={4}>
                      <InputLabel htmlFor="fieldType">
                        {T.translate("edit_form_template.meta_field_type")}
                      </InputLabel>
                      <Select
                        value={field.type}
                        name="fieldType"
                        fullWidth
                        onChange={(ev) =>
                          handleFieldChange(fieldIndex, "type", ev.target.value)
                        }
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
                              onChange={(ev) =>
                                handleFieldChange(
                                  fieldIndex,
                                  "is_required",
                                  ev.target.checked
                                )
                              }
                            />
                          }
                          label={T.translate(
                            "edit_form_template.meta_field_required"
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
                        fieldIndex={fieldIndex}
                        entity={entity}
                        setEntity={setEntity}
                        handleFieldValueChange={handleFieldValueChange}
                        handleRemoveValue={handleRemoveValue}
                        handleAddValue={handleAddValue}
                      />
                    </>
                  )}
                  {field.type === "Quantity" && (
                    <Grid2
                      container
                      spacing={2}
                      sx={{ alignItems: "end", my: 2 }}
                    >
                      <Grid2 size={4}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <TextField
                            value={field.minimum_quantity}
                            placeholder={T.translate(
                              "edit_form_template.placeholders.meta_field_minimum_quantity"
                            )}
                            type="number"
                            onChange={(e) =>
                              handleFieldValueQuantityChange(
                                fieldIndex,
                                "minimum_quantity",
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
                            value={field.maximum_quantity}
                            placeholder={T.translate(
                              "edit_form_template.placeholders.meta_field_maximum_quantity"
                            )}
                            type="number"
                            onChange={(e) =>
                              handleFieldValueQuantityChange(
                                fieldIndex,
                                "maximum_quantity",
                                e.target.value
                              )
                            }
                            fullWidth
                          />
                        </Box>
                      </Grid2>
                    </Grid2>
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
                    onClick={() => handleRemoveFieldType(field, fieldIndex)}
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
          ))}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleSave} fullWidth variant="contained">
          {entity.id
            ? T.translate("edit_form_template.save_changes")
            : T.translate("edit_form_template.add_form")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FormTemplateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  entity: PropTypes.object
};

export default FormTemplateDialog;
