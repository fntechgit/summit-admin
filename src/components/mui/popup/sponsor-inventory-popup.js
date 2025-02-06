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
import {
  TextEditor,
  UploadInputV2
} from "openstack-uicore-foundation/lib/components";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY
} from "../../../utils/constants";
import showConfirmDialog from "../components/showConfirmDialog";

const EditItemDialog = ({
  open,
  onClose,
  onSave,
  onImageDeleted,
  onMetaFieldTypeDeleted,
  onMetaFieldTypeValueDeleted,
  initialValues
}) => {
  const [formData, setFormData] = useState({
    id: null,
    code: "",
    name: "",
    description: "",
    early_bird_rate: 0,
    standard_rate: 0,
    onsite_rate: 0,
    quantity_limit_per_sponsor: 0,
    quantity_limit_per_show: 0,
    meta_fields: [{ name: "", type: "Text", required: false, values: [] }],
    images: initialValues?.images || []
  });

  useEffect(() => {
    setFormData({
      id: initialValues?.id || null,
      code: initialValues?.code || "",
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      early_bird_rate: initialValues?.early_bird_rate || 0,
      standard_rate: initialValues?.standard_rate || 0,
      onsite_rate: initialValues?.onsite_rate || 0,
      quantity_limit_per_sponsor:
        initialValues?.quantity_limit_per_sponsor || 0,
      quantity_limit_per_show: initialValues?.quantity_limit_per_show || 0,
      meta_fields:
        initialValues?.meta_fields.length > 0
          ? initialValues?.meta_fields
          : [{ name: "", type: "Text", is_required: false, values: [] }],
      images: initialValues?.images.length > 0 ? initialValues?.images : []
    });
  }, [initialValues]);

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
    setFormData({ ...formData, [id]: value });
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleAddField = () => {
    setFormData({
      ...formData,
      meta_fields: [
        ...formData.meta_fields,
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
        let new_meta_fields = [...formData.meta_fields].filter(
          (_, i) => i !== index
        );
        if (new_meta_fields.length === 0)
          new_meta_fields = [
            { name: "", type: "Text", is_required: false, values: [] }
          ];
        setFormData({ ...formData, meta_fields: new_meta_fields });
      };
      if (fieldType.id) {
        onMetaFieldTypeDeleted(formData.id, fieldType.id).then(() => {
          removeFromUI();
        });
      } else {
        removeFromUI();
      }
    }
  };

  const handleAddValue = (index) => {
    const newFields = [...formData.meta_fields];
    newFields[index].values.push({ value: "", isDefault: false });
    setFormData({ ...formData, meta_fields: newFields });
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
        const newFields = [...formData.meta_fields];
        newFields[fieldIndex].values = newFields[fieldIndex].values.filter(
          (_, index) => index !== valueIndex
        );
        setFormData({ ...formData, meta_fields: newFields });
      };
      if (metaField.id && metaFieldValue.id) {
        if (onMetaFieldTypeDeleted) {
          onMetaFieldTypeValueDeleted(
            formData.id,
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
    const newFields = [...formData.meta_fields];
    newFields[index][field] = value;
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleFieldValueChange = (fieldIndex, valueIndex, key, value) => {
    const newFields = [...formData.meta_fields];
    newFields[fieldIndex].values[valueIndex][key] = value;
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleImageUploadComplete = (response) => {
    if (response) {
      const image = {
        file_path: `${response.path}${response.name}`,
        filename: response.name
      };
      setFormData((prevEntity) => ({
        ...prevEntity,
        images: [...prevEntity.images, image]
      }));
    }
  };

  const handleRemoveImage = (imageFile) => {
    const images = formData.images.filter(
      (image) => image.filename !== imageFile.name
    );
    setFormData((prevEntity) => ({
      ...prevEntity,
      images
    }));

    if (onImageDeleted && formData.id && imageFile.id) {
      onImageDeleted(formData.id, imageFile.id);
    }
  };

  const getMediaInputValue = () =>
    formData.images.length > 0
      ? formData.images.map((img) => ({
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
              value={formData.code}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={8}>
            <InputLabel htmlFor="name">Name</InputLabel>
            <TextField
              variant="outlined"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
        </Grid2>

        <Divider />

        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={12}>
            <InputLabel htmlFor="description">Description</InputLabel>
            <TextEditor
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Grid2>
        </Grid2>

        <Divider />

        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={4}>
            <InputLabel htmlFor="early_bird_rate">Early Bird Rate</InputLabel>
            <TextField
              variant="outlined"
              name="early_bird_rate"
              id="early_bird_rate"
              value={formData.early_bird_rate}
              onChange={handleChange}
              type="number"
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="standard_rate">Standard Rate</InputLabel>
            <TextField
              variant="outlined"
              name="standard_rate"
              id="standard_rate"
              value={formData.standard_rate}
              onChange={handleChange}
              type="number"
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="onsite_rate">On Site Rate</InputLabel>
            <TextField
              variant="outlined"
              name="onsite_rate"
              id="onsite_rate"
              value={formData.onsite_rate}
              onChange={handleChange}
              type="number"
              fullWidth
            />
          </Grid2>
        </Grid2>
        <Divider />
        <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
          <Grid2 size={4}>
            <InputLabel htmlFor="quantity_limit_per_sponsor">
              Limit total per sponsor (empty = disabled)
            </InputLabel>
            <TextField
              variant="outlined"
              name="quantity_limit_per_sponsor"
              id="quantity_limit_per_sponsor"
              value={formData.quantity_limit_per_sponsor}
              onChange={handleChange}
              type="number"
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="quantity_limit_per_show">
              Limit total per show (empty = disabled)
            </InputLabel>
            <TextField
              variant="outlined"
              name="quantity_limit_per_show"
              id="quantity_limit_per_show"
              value={formData.quantity_limit_per_show}
              onChange={handleChange}
              type="number"
              fullWidth
            />
          </Grid2>
        </Grid2>

        <Divider />
        <DialogTitle sx={{ p: 3 }}>Additional Input Fields</DialogTitle>

        <Box sx={{ px: 3 }}>
          {formData.meta_fields.map((field, fieldIndex) => (
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
              id="image-upload"
              onUploadComplete={handleImageUploadComplete}
              value={getMediaInputValue()}
              mediaType={mediaType}
              onRemove={handleRemoveImage}
              postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
              djsConfig={{ withCredentials: true }}
              maxFiles={mediaType.max_uploads_qty}
              canAdd={
                mediaType.is_editable ||
                formData.images.length < mediaType.max_uploads_qty
              }
              parallelChunkUploads
            />
          </Grid2>
        </Grid2>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleSave} fullWidth variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialValues: PropTypes.object
};

export default EditItemDialog;
