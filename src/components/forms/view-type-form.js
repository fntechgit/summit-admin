/**
 * Copyright 2021 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid2 from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import { hasErrors, scrollToError } from "../../utils/methods";

const ViewTypeForm = ({ entity: entityProp, errors: errorsProp, onSubmit }) => {
  const [entity, setEntity] = useState({ ...entityProp });
  const [errors, setErrors] = useState(errorsProp);

  useEffect(() => {
    setEntity({ ...entityProp });
    setErrors({});
  }, [entityProp]);

  useEffect(() => {
    setErrors({ ...errorsProp });
    scrollToError(errorsProp);
  }, [errorsProp]);

  const handleChange = (ev) => {
    const { id, type, checked } = ev.target;
    const value = type === "checkbox" ? checked : ev.target.value;

    setErrors({ ...errors, [id]: "" });
    setEntity({ ...entity, [id]: value });
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit(entity);
  };

  const nameError = hasErrors("name", errors);

  return (
    <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={12}>
          <TextField
            id="name"
            label={T.translate("edit_view_type.name")}
            value={entity.name}
            onChange={handleChange}
            error={!!nameError}
            helperText={nameError}
            required
            fullWidth
          />
        </Grid2>
        <Grid2 size={12}>
          <InputLabel htmlFor="description">
            {T.translate("edit_view_type.description")}
          </InputLabel>
          <TextEditorV3
            id="description"
            value={entity.description}
            onChange={handleChange}
            error={hasErrors("description", errors)}
            license={process.env.JODIT_LICENSE_KEY}
          />
        </Grid2>
        <Grid2 size={12}>
          <FormControlLabel
            control={
              <Checkbox
                id="is_default"
                checked={!!entity.is_default}
                onChange={handleChange}
              />
            }
            label={T.translate("edit_view_type.is_default")}
          />
        </Grid2>
      </Grid2>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSubmit}>
          {T.translate("general.save")}
        </Button>
      </Stack>
    </Box>
  );
};

ViewTypeForm.propTypes = {
  entity: PropTypes.object.isRequired,
  errors: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
};

ViewTypeForm.defaultProps = {
  errors: {}
};

export default ViewTypeForm;
