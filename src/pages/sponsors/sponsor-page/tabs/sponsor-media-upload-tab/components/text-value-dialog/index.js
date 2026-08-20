/**
 * Copyright 2026 OpenStack Foundation
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
import { TextField, Typography } from "@mui/material";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import { TEXT_MAX_LENGTH_1024 } from "../../../../../../../utils/constants";

const TextValueDialog = ({
  name,
  moduleName,
  value,
  open,
  onClose,
  onSubmit
}) => {
  const [text, setText] = useState(value || "");

  useEffect(() => {
    if (open) {
      setText(value || "");
    }
  }, [open, value]);

  return (
    <CustomDialog
      title={T.translate("edit_sponsor.mu_tab.upload_input.enter_text")}
      open={open}
      onClose={onClose}
      primaryAction={{
        label: T.translate("edit_sponsor.mu_tab.upload_input.save_answer"),
        onClick: () => onSubmit(text).then(() => onClose()),
        disabled: text === (value || "")
      }}
    >
      <Typography variant="body1" sx={{ mb: 2 }}>
        {moduleName}
      </Typography>
      <TextField
        id={`media_upload_${name}`}
        name={name}
        fullWidth
        multiline
        minRows={4}
        value={text}
        onChange={(ev) => setText(ev.target.value)}
        inputProps={{ maxLength: TEXT_MAX_LENGTH_1024 }}
        helperText={`${text.length}/${TEXT_MAX_LENGTH_1024}`}
      />
    </CustomDialog>
  );
};

TextValueDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  moduleName: PropTypes.string,
  value: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

TextValueDialog.defaultProps = {
  moduleName: "",
  value: null
};

export default TextValueDialog;
