import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Grid2, Box, InputLabel } from "@mui/material";

import FormikTextEditor from "../../../../../components/inputs/formik-text-editor";

const InfoModule = ({ baseName, index }) => {
  const name = `${baseName}[${index}].content`;

  return (
    <Grid2 container spacing={2} size={12}>
      <InputLabel htmlFor={name}>
        {T.translate("page_template_list.page_crud.info_content")}
      </InputLabel>
      <Grid2 size={12}>
        <Box width="100%">
          <FormikTextEditor name={name} fullWidth margin="none" />
        </Box>
      </Grid2>
    </Grid2>
  );
};

InfoModule.propTypes = {
  baseName: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired
};

export default InfoModule;
