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

const MuiFormikUpload = ({
  id,
  name,
  onDelete,
  maxFiles = MAX_INVENTORY_IMAGES_UPLOAD_QTY
}) => {
  const [field, meta, helpers] = useField(name);

  const mediaType = {
    max_size: MAX_INVENTORY_IMAGE_UPLOAD_SIZE,
    max_uploads_qty: maxFiles,
    type: {
      allowed_extensions: ALLOWED_INVENTORY_IMAGE_FORMATS
    }
  };

  const getInputValue = () =>
    field.value?.length > 0
      ? field.value.map((img) => ({
          ...img,
          filename:
            img.file_name ?? img.filename ?? img.file_path ?? img.file_url
        }))
      : [];

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
      const image = buildFileObject(response);
      helpers.setValue([...(field.value || []), image]);
      helpers.setTouched(true);
    }
  };

  const handleRemove = (imageFile) => {
    const updated = (field.value || []).filter(
      (i) => i.filename !== imageFile.name
    );
    helpers.setValue(updated);
    if (onDelete) {
      onDelete(imageFile.id);
    }
  };

  const canAddMore = () => (field.value?.length || 0) < maxFiles;

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
        maxFiles={maxFiles}
        canAdd={canAddMore()}
        parallelChunkUploads
      />
    </>
  );
};

MuiFormikUpload.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  maxFiles: PropTypes.number
};

export default MuiFormikUpload;
