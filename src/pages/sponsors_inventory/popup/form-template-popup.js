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
  Grid2,
  FormGroup
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  TextEditor,
  UploadInputV2
} from "openstack-uicore-foundation/lib/components";
import { scrollToError, shallowEqual, hasErrors } from "../../../utils/methods";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY
} from "../../../utils/constants";
import showConfirmDialog from "../../../components/mui/components/showConfirmDialog";

const FormTemplateDialog = ({
  open,
  onClose,
  onSave,
  onMaterialDeleted,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  entity: initialEntity,
  errors: initialErrors
}) => {
  const [entity, setEntity] = useState({
    id: null,
    code: "",
    name: "",
    sponsors: [],
    opens_at: 0,
    expires_at: 0,
    instructions: "",
    meta_fields: [{ name: "", type: "Text", required: false, values: [] }],
    images: []
  });

  useEffect(() => {
    setEntity({
      id: initialEntity?.id || null,
      code: initialEntity?.code || "",
      name: initialEntity?.name || "",
      sponsors: initialEntity?.sponsors || [],
      opens_at: initialEntity?.opens_at || null,
      expires_at: initialEntity?.expires_at || null,
      instructions: initialEntity?.instructions || "",
      meta_fields:
        initialEntity?.meta_fields?.length > 0
          ? initialEntity?.meta_fields
          : [{ name: "", type: "Text", is_required: false, values: [] }],
      images: initialEntity?.images?.length > 0 ? initialEntity?.images : []
    });
  }, [initialEntity]);

  useEffect(() => {
    scrollToError(initialErrors);
    if (!shallowEqual(initialEntity, entity)) {
      setEntity({ ...initialEntity });
      setErrors({});
    }

    if (!shallowEqual(initialErrors, errors)) {
      setErrors({ ...initialErrors });
    }
  }, [initialEntity, initialErrors]);

  const fieldTypesWithOptions = ["CheckBoxList", "ComboBox", "RadioButtonList"];

  const mediaType = {
    max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
    max_uploads_qty: MAX_INVENTORY_IMAGES_UPLOAD_QTY,
    type: {
      allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setEntity({ ...entity, [id]: value });
  };

  const handleChangeDateTime = (e) => {
    console.log("e", e, e.unix());
  };

  const handleSave = () => {
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
      text: `${T.translate("edit_inventory_item.delete_meta_field_warning")} ${
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

  const handleMaterialUploadComplete = (response) => {
    if (response) {
      const material = {
        file_path: `${response.path}${response.name}`,
        filename: response.name
      };
      setEntity((prevEntity) => ({
        ...prevEntity,
        meta_fields: getNormalizedMetaFields(),
        materials: [...prevEntity.materials, material]
      }));
    }
  };

  const handleRemoveMaterial = (materialFile) => {
    const materials = entity.materials.filter(
      (material) => material.filename != materialFile.name
    );
    setEntity((prevEntity) => ({
      ...prevEntity,
      meta_fields: getNormalizedMetaFields(),
      materials
    }));

    if (onMaterialDeleted && entity.id && materialFile.id) {
      onMaterialDeleted(entity.id, materialFile.id);
    }
  };

  const getMediaInputValue = () =>
    entity.images.length > 0
      ? entity.images.map((img) => ({
          ...img,
          filename: img.filename ?? img.file_path ?? img.file_url
        }))
      : [];

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
            <InputLabel htmlFor="code">Code</InputLabel>
            <TextField
              variant="outlined"
              name="code"
              id="code"
              value={entity.code}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="name">Name</InputLabel>
            <TextField
              variant="outlined"
              name="name"
              id="name"
              value={entity.name}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel id="sponsors">Always apply to</InputLabel>
            <FormControl fullWidth>
              <Select
                labelId="sponsors"
                id="sponsors"
                value={entity.sponsors}
                placeholder="Select All or Sponsor Levels..."
                onChange={handleChange}
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={4}>
            <InputLabel htmlFor="opens_at">Opens at</InputLabel>
            <DatePicker
              name="opens_at"
              id="opens_at"
              value={entity.opens_at}
              onChange={handleChangeDateTime}
              sx={{ width: "100%" }}
              renderInput={(params) => (
                <TextField {...params} fullWidth variant="outlined" />
              )}
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="expires_at">Expires at</InputLabel>
            <DatePicker
              name="expires_at"
              id="expires_at"
              value={entity.expires_at}
              onChange={handleChangeDateTime}
              sx={{ width: "100%" }}
              renderInput={(params) => (
                <TextField {...params} fullWidth variant="outlined" />
              )}
            />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="instructions">instructions</InputLabel>
            <TextEditor
              name="instructions"
              id="instructions"
              value={entity.instructions}
              onChange={handleChange}
            />
          </Grid2>
        </Grid2>

        <Divider />
        <DialogTitle sx={{ p: 3 }}>Additional Input Fields</DialogTitle>

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
                      <InputLabel htmlFor="fieldTitle">Field Title</InputLabel>
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
                      <InputLabel htmlFor="fieldType">Field Type</InputLabel>
                      <Select
                        value={field.type}
                        name="fieldType"
                        fullWidth
                        onChange={(ev) =>
                          handleFieldChange(fieldIndex, "type", ev.target.value)
                        }
                      >
                        <MenuItem value="CheckBox">CheckBox</MenuItem>
                        <MenuItem value="CheckBoxList">CheckBoxList</MenuItem>
                        <MenuItem value="ComboBox">ComboBox</MenuItem>
                        <MenuItem value="RadioButtonList">
                          RadioButtonList
                        </MenuItem>
                        <MenuItem value="Text">Text</MenuItem>
                        <MenuItem value="TextArea">TextArea</MenuItem>
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
                          label="Required"
                        />
                      </FormControl>
                    </Grid2>
                  </Grid2>
                  {fieldTypesWithOptions.includes(field.type) && (
                    <Box>
                      {field.values
                        .sort((a, b) => a.order - b.order)
                        .map((val, valueIndex) => (
                          <Grid2
                            container
                            spacing={2}
                            sx={{ alignItems: "end", my: 2 }}
                          >
                            <Grid2 size={4}>
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <TextField
                                  value={val.name}
                                  placeholder={T.translate(
                                    "meta_field_values_list.name"
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
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <TextField
                                  value={val.value}
                                  placeholder={T.translate(
                                    "meta_field_values_list.value"
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
                                    "meta_field_values_list.is_default"
                                  )}
                                />
                              </FormGroup>
                            </Grid2>
                          </Grid2>
                        ))}
                      <Grid2 container spacing={2} offset={4}>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => handleAddValue(fieldIndex)}
                        >
                          Add a value
                        </Button>
                      </Grid2>
                    </Box>
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

        <Grid2 container spacing={2} sx={{ alignItems: "start", px: 3, py: 1 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="file">PDF</InputLabel>
            <UploadInputV2
              id="material"
              onUploadComplete={handleMaterialUploadComplete}
              value={getMediaInputValue()}
              mediaType={mediaType}
              onRemove={handleRemoveMaterial}
              postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
              error={hasErrors("material", errors)}
              djsConfig={{ withCredentials: true }}
              maxFiles={mediaType.max_uploads_qty}
              canAdd={
                mediaType.is_editable ||
                entity.materials.length < mediaType.max_uploads_qty
              }
              parallelChunkUploads
            />
          </Grid2>
        </Grid2>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleSave} fullWidth variant="contained">
          Save Form
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FormTemplateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialValues: PropTypes.object
};

export default FormTemplateDialog;
