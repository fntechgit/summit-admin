import React, { useEffect, useState } from "react";
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
  FormGroup,
  Link
} from "@mui/material";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

const EditItemDialog = ({
  open,
  onClose,
  onSave,
  onImageDeleted,
  // eslint-disable-next-line
  onMetaFieldTypeDeleted,
  // eslint-disable-next-line
  onMetaFieldTypeValueDeleted,
  initialValues
}) => {
  console.log("INVITAL VAL", initialValues);
  const [formData, setFormData] = useState({
    id: null,
    code: "",
    name: "",
    early_bird_rate: "",
    standard_rate: "",
    onsite_rate: "",
    quantity_limit_per_sponsor: "",
    quantity_limit_per_show: "",
    meta_fields: [
      { fieldTitle: "", type: "text", required: false, values: [] }
    ],
    images: initialValues?.images || []
  });

  useEffect(() => {
    setFormData({
      id: initialValues?.id || null,
      code: initialValues?.code || "",
      name: initialValues?.name || "",
      early_bird_rate: initialValues?.early_bird_rate || "",
      standard_rate: initialValues?.standard_rate || "",
      onsite_rate: initialValues?.onsite_rate || "",
      quantity_limit_per_sponsor:
        initialValues?.quantity_limit_per_sponsor || "",
      quantity_limit_per_show: initialValues?.quantity_limit_per_show || "",
      meta_fields:
        initialValues?.meta_fields.length > 0
          ? initialValues?.meta_fields
          : [{ name: "", type: "text", is_required: false, values: [] }],
      images: initialValues?.images.length > 0 ? initialValues?.images : []
    });
  }, [initialValues]);

  console.log("formdata...", formData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleAddField = () => {
    setFormData({
      ...formData,
      meta_fields: [
        ...formData.meta_fields,
        { name: "", type: "text", is_required: false, values: [] }
      ]
    });
  };

  const handleRemoveField = (index) => {
    // onMetaFieldTypeDeleted()
    let new_meta_fields = [...formData.meta_fields].filter(
      (_, i) => i !== index
    );
    if (new_meta_fields.length === 0)
      new_meta_fields = [
        { name: "", type: "text", is_required: false, values: [] }
      ];
    setFormData({ ...formData, meta_fields: new_meta_fields });
  };

  const handleAddValue = (index) => {
    const newFields = [...formData.meta_fields];
    newFields[index].values.push({ value: "", isDefault: false });
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleRemoveValue = (fieldIndex, valueIndex) => {
    // onMetaFieldTypeValueDeleted()
    const newFields = [...formData.meta_fields];
    newFields[fieldIndex].values = newFields[fieldIndex].values.filter(
      (_, index) => index !== valueIndex
    );
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...formData.meta_fields];
    newFields[index][field] = value;
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleValueChange = (fieldIndex, valueIndex, value) => {
    const newFields = [...formData.meta_fields];
    newFields[fieldIndex].values[valueIndex].value = value;
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleDefaultChange = (fieldIndex, valueIndex, checked) => {
    const newFields = [...formData.meta_fields];
    newFields[fieldIndex].values[valueIndex].isDefault = checked;
    setFormData({ ...formData, meta_fields: newFields });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const newImages = [...formData.images, file];
    setFormData({ ...formData, images: newImages });
  };

  const handleRemoveFile = (file, inventoryId) => {
    if (file.id) {
      onImageDeleted(file.id, inventoryId)
        .then(() => {
          const updatedImages = formData.images.filter(
            (image) => image.id !== img.id
          );
          setFormData({ ...formData, images: updatedImages });
        })
        .catch((error) => {
          console.error("Error deleting image from server:", error);
          Swal.fire({
            title: "Error",
            text: "There was an issue deleting the image from the server.",
            icon: "error"
          });
        });
    } else {
      const updatedImages = formData.images.filter(
        (image) => image.name !== img.name
      );
      setFormData({ ...formData, images: updatedImages });
    }
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
            <InputLabel htmlFor="code">Code</InputLabel>
            <TextField
              variant="outlined"
              name="code"
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
              value={formData.name}
              onChange={handleChange}
              fullWidth
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
              value={formData.early_bird_rate}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="standard_rate">Standard Rate</InputLabel>
            <TextField
              variant="outlined"
              name="standard_rate"
              value={formData.standard_rate}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
          <Grid2 size={4}>
            <InputLabel htmlFor="onsite_rate">On Site Rate</InputLabel>
            <TextField
              variant="outlined"
              name="onsite_rate"
              value={formData.onsite_rate}
              onChange={handleChange}
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
              value={formData.quantity_limit_per_sponsor}
              onChange={handleChange}
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
              value={formData.quantity_limit_per_show}
              onChange={handleChange}
              fullWidth
            />
          </Grid2>
        </Grid2>

        <Divider />
        <DialogTitle sx={{ p: 3 }}>Additional Input Fields</DialogTitle>

        <Box sx={{ px: 3 }}>
          {formData.meta_fields.map((field, index) => (
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
                          handleFieldChange(index, "name", ev.target.value)
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
                          handleFieldChange(index, "type", ev.target.value)
                        }
                      >
                        <MenuItem value="Text">Text input</MenuItem>
                        <MenuItem value="CheckBoxList">Drop down</MenuItem>
                        <MenuItem value="CheckBox">Check box</MenuItem>
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
                                  index,
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
                  {field.type === "CheckBoxList" && (
                    <Box>
                      {field.values
                        .sort((a, b) => a.order - b.order)
                        .map((val, valueIndex) => (
                          <Grid2
                            container
                            spacing={2}
                            sx={{ alignItems: "end", my: 2 }}
                          >
                            <Grid2 offset={4} size={4}>
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <TextField
                                  value={val.value}
                                  onChange={(e) =>
                                    handleValueChange(
                                      index,
                                      valueIndex,
                                      e.target.value
                                    )
                                  }
                                  fullWidth
                                  slotProps={{
                                    input: {
                                      endAdornment: (
                                        <IconButton
                                          onClick={() =>
                                            handleRemoveValue(index, valueIndex)
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
                                        handleDefaultChange(
                                          index,
                                          valueIndex,
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label="Default Value"
                                />
                              </FormGroup>
                            </Grid2>
                          </Grid2>
                        ))}
                      <Grid2 container spacing={2} offset={4}>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => handleAddValue(index)}
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
                    onClick={() => handleRemoveField(index)}
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
          <Grid2 size={4}>
            <InputLabel htmlFor="file">PDF</InputLabel>
            <Button
              component="label"
              role={undefined}
              variant="outlined"
              tabIndex={-1}
              startIcon={<ArrowUpwardIcon />}
              fullWidth
              onClick={() => document.getElementById("file-input").click()}
            >
              Select File
            </Button>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
              multiple
            />
          </Grid2>
          <Grid2 size={8}>
            {formData.images.length ? (
              formData.images.map((img) => (
                <Box
                  sx={{
                    border: "1px solid #0000001F",
                    borderRadius: "4px",
                    p: 2,
                    display: "grid",
                    gridTemplateColumns: "25% 70% 5%",
                    alignItems: "center",
                    my: 2
                  }}
                >
                  {console.log("CHECK IMAGE", img)}
                  <Box
                    component="img"
                    alt={`preview ${img?.file_url ? img.file_url : img.name}`}
                    src={img?.file_url ? img.file_url : img.name}
                    sx={{
                      height: "100px",
                      maxHeight: "100px",
                      maxWidth: "150px",
                      p: 1,
                      width: "auto"
                    }}
                  />
                  <Link
                    href={img?.file_url && img.file_url}
                    sx={{
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {img?.file_url ? img.file_url : img.name}
                  </Link>
                  <IconButton
                    sx={{
                      width: 40,
                      height: 40,
                      minWidth: "auto",
                      borderRadius: "50%",
                      padding: 0
                    }}
                    onClick={() => handleRemoveFile(img, formData.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography
                sx={{
                  color: "#00000061",
                  alignSelf: "center"
                }}
              >
                No file selected
              </Typography>
            )}
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
