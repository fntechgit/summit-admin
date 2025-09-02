import React from "react";
import PropTypes from "prop-types";
import { FormHelperText } from "@mui/material";
import { UploadInputV2 } from "openstack-uicore-foundation/lib/components";

import { useField } from "formik";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY
} from "../../utils/constants";

const MuiFormikUpload = ({ id, name, onImageDeleted }) => {
  const [field, meta, helpers] = useField(name);

  console.log("images: ", field.value);

  const mediaType = {
    max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
    max_uploads_qty: MAX_INVENTORY_IMAGES_UPLOAD_QTY,
    type: {
      allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS
    }
  };

  const getInputValue = () =>
    field.value?.length > 0
      ? field.value.map((img) => ({
          ...img,
          filename: img.filename ?? img.file_path ?? img.file_url
        }))
      : [];

  const handleUploadComplete = (response) => {
    if (response) {
      const image = {
        file_path: `${response.path}${response.name}`,
        filename: response.name
      };
      helpers.setValue([...field.value, image]);
      helpers.setTouched(true);
    }
  };

  const handleRemove = (imageFile) => {
    const updated = field.value.filter((i) => i.filename !== imageFile.name);
    helpers.setValue(updated);

    if (onImageDeleted) {
      onImageDeleted(imageFile.id);
    }
  };

  return (
    <>
      {meta.touched && meta.error && (
        <FormHelperText error>{meta.error}</FormHelperText>
      )}
      <UploadInputV2
        id={id}
        name={name}
        onUploadComplete={handleUploadComplete}
        value={getInputValue()}
        mediaType={mediaType}
        onRemove={handleRemove}
        postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
        djsConfig={{ withCredentials: true }}
        maxFiles={mediaType.max_uploads_qty}
        canAdd={
          mediaType.is_editable ||
          (field.value?.length || 0) < mediaType.max_uploads_qty
        }
        parallelChunkUploads
      />
    </>
  );
};

MuiFormikUpload.propTypes = {
  name: PropTypes.string.isRequired
};

export default MuiFormikUpload;
