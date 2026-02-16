import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import { getIn, useFormikContext } from "formik";
import { Divider, Grid2, InputLabel, MenuItem } from "@mui/material";
import MuiFormikTextField from "../../../../../components/mui/formik-inputs/mui-formik-textfield";
import MuiFormikDatepicker from "../../../../../components/mui/formik-inputs/mui-formik-datepicker";
import MuiFormikRadioGroup from "../../../../../components/mui/formik-inputs/mui-formik-radio-group";
import { PAGE_MODULES_MEDIA_TYPES } from "../../../../../utils/constants";
import MuiFormikSelect from "../../../../../components/mui/formik-inputs/mui-formik-select";

const MediaRequestModule = ({ baseName, index, mediaFileTypes }) => {
  const { values } = useFormikContext();
  const buildFieldName = (field) => `${baseName}[${index}].${field}`;

  const mediaType =
    getIn(values, buildFieldName("type")) || PAGE_MODULES_MEDIA_TYPES.FILE;

  const mediaTypeOptions = [
    {
      value: PAGE_MODULES_MEDIA_TYPES.FILE,
      label: T.translate("page_template_list.page_crud.upload_file")
    },
    {
      value: PAGE_MODULES_MEDIA_TYPES.TEXT,
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
      <Grid2 size={6}>
        <InputLabel htmlFor={buildFieldName("name")}>
          {T.translate("page_template_list.page_crud.name")}
        </InputLabel>
        <MuiFormikTextField
          name={buildFieldName("name")}
          fullWidth
          margin="none"
        />
      </Grid2>
      <Grid2 size={6}>
        <InputLabel htmlFor={buildFieldName("upload_deadline")}>
          {T.translate("page_template_list.page_crud.upload_deadline")}
        </InputLabel>
        <MuiFormikDatepicker
          name={buildFieldName("upload_deadline")}
          margin="none"
        />
      </Grid2>

      {mediaType === PAGE_MODULES_MEDIA_TYPES.FILE && (
        <>
          <Grid2 size={6}>
            <InputLabel htmlFor={buildFieldName("max_file_size")}>
              {T.translate("page_template_list.page_crud.max_file_size")}
            </InputLabel>
            <MuiFormikTextField
              name={buildFieldName("max_file_size")}
              type="number"
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
                  return <span style={{ color: "#aaa" }}>{placeholder}</span>;
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
  index: PropTypes.number.isRequired
};

const mapStateToProps = ({ mediaUploadState }) => ({
  mediaFileTypes: mediaUploadState.media_file_types
});

export default connect(mapStateToProps, {})(MediaRequestModule);
