import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Grid, Box, InputLabel } from "@mui/material";

import FormikTextEditor from "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor";

const InfoModule = ({ baseName, index }) => {
  const name = `${baseName}[${index}].content`;

  return (
    <Grid container spacing={2} size={12}>
      <InputLabel htmlFor={name}>
        {T.translate("page_template_list.page_crud.info_content")}
      </InputLabel>
      <Grid size={12}>
        <Box sx={{ width: "100%" }}>
          <FormikTextEditor
            name={name}
            fullWidth
            margin="none"
            license={process.env.JODIT_LICENSE_KEY}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

InfoModule.propTypes = {
  baseName: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired
};

export default InfoModule;
