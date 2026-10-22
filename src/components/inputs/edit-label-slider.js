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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Switch, TextField, Typography } from "@mui/material";
import { useField } from "formik";

const EditLabelSlider = ({ name, disabled = false }) => {
  const [enabledField] = useField(`${name}.is_enabled`);
  const [labelField, , labelHelpers] = useField(`${name}.label`);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const handleEdit = () => {
    setDraft(labelField.value);
    setEditing(true);
  };

  // label is only committed on Save so Cancel can discard the draft
  const handleSave = () => {
    labelHelpers.setValue(draft);
    setEditing(false);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Switch
        name={enabledField.name}
        checked={!!enabledField.value}
        onChange={enabledField.onChange}
        disabled={disabled}
        inputProps={{ "aria-label": labelField.value }}
      />
      <Typography>{labelField.value}</Typography>
      {!editing && !disabled && (
        <Button size="small" onClick={handleEdit}>
          {T.translate("edit_schedule_settings.edit_name")}
        </Button>
      )}
      {editing && (
        <>
          <TextField
            size="small"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            inputProps={{
              "aria-label": T.translate("edit_schedule_settings.edit_name")
            }}
          />
          <Button size="small" onClick={handleSave}>
            {T.translate("general.save")}
          </Button>
          <Button size="small" onClick={() => setEditing(false)}>
            {T.translate("general.cancel")}
          </Button>
        </>
      )}
    </Box>
  );
};

EditLabelSlider.propTypes = {
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

export default EditLabelSlider;
