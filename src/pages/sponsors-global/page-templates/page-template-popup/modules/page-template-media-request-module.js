import React, { useEffect } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import { getIn, useFormikContext } from "formik";
import { Divider, Grid2, InputLabel, MenuItem } from "@mui/material";
import MuiFormikDatepicker from "openstack-uicore-foundation/lib/components/mui/formik-inputs/datepicker";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikRadioGroup from "openstack-uicore-foundation/lib/components/mui/formik-inputs/radio-group";
import MuiFormikFilesizeField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/file-size-field";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import {
  COLUMN_6,
  COLUMN_12,
  PAGE_MODULES_MEDIA_TYPES
} from "../../../../../utils/constants";

const MediaRequestModule = ({
  baseName,
  index,
  mediaFileTypes,
  showUploadDeadline
}) => {
  const { values, setFieldValue } = useFormikContext();
  const buildFieldName = (field) => `${baseName}[${index}].${field}`;

  const mediaType =
    getIn(values, buildFieldName("type")) || PAGE_MODULES_MEDIA_TYPES.FILE;

  // clears a stale upload_deadline hydrated from a legacy module once the field is hidden;
  // only needs to run on mount, since showUploadDeadline doesn't change during a module's lifetime
  useEffect(() => {
    if (
      !showUploadDeadline &&
      getIn(values, buildFieldName("upload_deadline"))
    ) {
      setFieldValue(buildFieldName("upload_deadline"), null);
    }
  }, []);

  const mediaTypeOptions = [
    {
      value: PAGE_MODULES_MEDIA_TYPES.FILE,
      label: T.translate("page_template_list.page_crud.upload_file")
    },
    {
      value: PAGE_MODULES_MEDIA_TYPES.INPUT,
      label: T.translate("page_template_list.page_crud.text_input")
    }
  ];

  const fileTypeOptions = mediaFileTypes.map((ft) => ({
    value: ft.id,
    label: `${ft.name} (${ft.allowed_extensions?.join(", ")})`
  }));

  return (
    <Grid2 container spacing={2} size={12}>
      <Grid2 size={12}>
        <MuiFormikRadioGroup
          name={buildFieldName("type")}
          options={mediaTypeOptions}
          row
          marginWrapper="none"
        />
      </Grid2>
      <Grid2 size={12}>
        <Divider sx={{ mx: -2 }} />
      </Grid2>
      <Grid2 size={showUploadDeadline ? COLUMN_6 : COLUMN_12}>
        <InputLabel htmlFor={buildFieldName("name")}>
          {T.translate("page_template_list.page_crud.name")}
        </InputLabel>
        <MuiFormikTextField
          name={buildFieldName("name")}
          fullWidth
          margin="none"
        />
      </Grid2>
      {showUploadDeadline && (
        <Grid2 size={6}>
          <InputLabel htmlFor={buildFieldName("upload_deadline")}>
            {T.translate("page_template_list.page_crud.upload_deadline")}
          </InputLabel>
          <MuiFormikDatepicker
            name={buildFieldName("upload_deadline")}
            margin="none"
          />
        </Grid2>
      )}

      {mediaType === PAGE_MODULES_MEDIA_TYPES.FILE && (
        <>
          <Grid2 size={6}>
            <InputLabel htmlFor={buildFieldName("max_file_size")}>
              {T.translate("page_template_list.page_crud.max_file_size")}
            </InputLabel>
            <MuiFormikFilesizeField
              name={buildFieldName("max_file_size")}
              margin="none"
              fullWidth
            />
          </Grid2>
          <Grid2 size={6}>
            <InputLabel htmlFor={buildFieldName("file_type_id")}>
              {T.translate("page_template_list.page_crud.allowed_formats")}
            </InputLabel>
            <MuiFormikSelect
              name={buildFieldName("file_type_id")}
              renderValue={(selected) => {
                if (!selected || selected === "") {
                  return (
                    <span style={{ color: "#aaa" }}>
                      {T.translate(
                        "page_template_list.page_crud.allowed_formats"
                      )}
                    </span>
                  );
                }
                const selectedOption = fileTypeOptions.find(
                  (t) => t.value === selected
                );
                return selectedOption?.label || selected;
              }}
            >
              {fileTypeOptions.map(({ value, label }) => (
                <MenuItem key={`file-type-${value}`} value={value}>
                  {label}
                </MenuItem>
              ))}
            </MuiFormikSelect>
          </Grid2>
        </>
      )}

      <Grid2 size={12}>
        <InputLabel htmlFor={buildFieldName("description")}>
          {T.translate("page_template_list.page_crud.description")}
        </InputLabel>
        <MuiFormikTextField
          name={buildFieldName("description")}
          fullWidth
          multiline
          margin="none"
          rows={2}
        />
      </Grid2>
    </Grid2>
  );
};

MediaRequestModule.propTypes = {
  baseName: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  mediaFileTypes: PropTypes.array.isRequired,
  showUploadDeadline: PropTypes.bool
};

const mapStateToProps = ({ mediaUploadState }) => ({
  mediaFileTypes: mediaUploadState.media_file_types
});

export default connect(mapStateToProps, {})(MediaRequestModule);
