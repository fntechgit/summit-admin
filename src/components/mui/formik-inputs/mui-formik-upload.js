import React from "react";
import PropTypes from "prop-types";
import { FormHelperText } from "@mui/material";
import { UploadInputV2 } from "openstack-uicore-foundation/lib/components";

import { useField } from "formik";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
  MAX_INVENTORY_IMAGES_UPLOAD_QTY
} from "../../../utils/constants";

const MuiFormikUpload = ({ id, name, onImageDeleted, singleFile = false }) => {
  const [field, meta, helpers] = useField(name);

  console.log("images: ", field.value);

  const mediaType = {
    max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
    max_uploads_qty: singleFile ? 1 : MAX_INVENTORY_IMAGES_UPLOAD_QTY,
    type: {
      allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS
    }
  };

  const getInputValue = () => {
    if (singleFile) {
      if (!field.value || Object.keys(field.value).length === 0) {
        return [];
      }
      return [
        {
          ...field.value,
          filename:
            field.value.file_name ??
            field.value.filename ??
            field.value.file_path
        }
      ];
    }
    return field.value?.length > 0
      ? field.value.map((img) => ({
          ...img,
          filename: img.filename ?? img.file_path ?? img.file_url
        }))
      : [];
  };

  const buildFileObject = (response) => {
    const file = {};

    if (response.id !== undefined) file.id = response.id;
    if (response.name) file.file_name = response.name;
    if (response.md5) file.md5 = response.md5;
    if (response.mime_type) file.mime_type = response.mime_type;
    if (response.source_bucket) file.bucket = response.source_bucket;
    if (response.path && response.name)
      file.file_path = `${response.path}${response.name}`;

    return file;
  };

  const handleUploadComplete = (response) => {
    if (response) {
      console.log("CHJECK RESPONSE", response);
      const image = buildFileObject(response);
      if (singleFile) {
        helpers.setValue(image);
      } else {
        helpers.setValue([...(field.value || []), image]);
      }
      helpers.setTouched(true);
    }
  };

  const handleRemove = (imageFile) => {
    if (singleFile) {
      if (onImageDeleted && field.value?.id) {
        onImageDeleted(field.value.id);
      }
      helpers.setValue(null);
    } else {
      const updated = (field.value || []).filter(
        (i) => i.filename !== imageFile.name
      );
      helpers.setValue(updated);
      if (onImageDeleted) {
        onImageDeleted(imageFile.id);
      }
    }
  };

  const canAddMore = () => {
    if (singleFile) {
      return !field.value || Object.keys(field.value).length === 0;
    }
    return (
      mediaType.is_editable ||
      (field.value?.length || 0) < mediaType.max_uploads_qty
    );
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
        canAdd={canAddMore()}
        parallelChunkUploads
      />
    </>
  );
};

MuiFormikUpload.propTypes = {
  name: PropTypes.string.isRequired,
  singleFile: PropTypes.bool
};

export default MuiFormikUpload;
