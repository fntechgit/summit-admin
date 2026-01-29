import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Grid2, InputLabel } from "@mui/material";

import MuiFormikUpload from "../../../../../components/mui/formik-inputs/mui-formik-upload";
import MuiFormikTextField from "../../../../../components/mui/formik-inputs/mui-formik-textfield";

const DocumentDownloadModule = ({ baseName, index }) => {
  const buildFieldName = (field) => `${baseName}[${index}].${field}`;

  return (
    <Grid2 container spacing={2} size={12}>
      <InputLabel htmlFor={buildFieldName("name")}>
        {T.translate("page_template_list.page_crud.document_name")}
      </InputLabel>
      <Grid2 size={12}>
        <MuiFormikTextField
          name={buildFieldName("name")}
          fullWidth
          margin="none"
        />
      </Grid2>
      <InputLabel htmlFor={buildFieldName("description")}>
        {T.translate("page_template_list.page_crud.description")}
      </InputLabel>
      <Grid2 size={12}>
        <MuiFormikTextField
          name={buildFieldName("description")}
          fullWidth
          multiline
          rows={2}
          margin="none"
        />
      </Grid2>
      <InputLabel htmlFor={buildFieldName("external_url")}>
        {T.translate("page_template_list.page_crud.external_url")}
      </InputLabel>
      <Grid2 size={12}>
        <MuiFormikTextField
          name={buildFieldName("external_url")}
          placeholder="Link"
          fullWidth
          margin="none"
        />
      </Grid2>
      <Grid2 size={12}>
        <MuiFormikUpload
          id={`document-module-upload-${index}`}
          name={buildFieldName("file")}
          maxFiles={1}
        />
      </Grid2>
    </Grid2>
  );
};

DocumentDownloadModule.propTypes = {
  baseName: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired
};

export default DocumentDownloadModule;
