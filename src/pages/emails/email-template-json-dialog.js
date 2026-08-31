/**
 * Copyright 2020 OpenStack Foundation
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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { sublimeInit } from "@uiw/codemirror-theme-sublime";
import { DECIMAL_DIGITS } from "../../utils/constants";

const EmailTemplateJsonDialog = ({
  open,
  jsonData,
  renderErrors,
  onUpdate,
  onClose
}) => {
  const [jsonPreview, setJsonPreview] = useState("");
  const [invalidJson, setInvalidJson] = useState(false);

  useEffect(() => {
    if (open) {
      setJsonPreview(JSON.stringify(jsonData, null, DECIMAL_DIGITS));
      setInvalidJson(false);
    }
  }, [open, jsonData]);

  const handleJsonChange = (value) => {
    setInvalidJson(false);
    setJsonPreview(value);
  };

  const handleUpdate = () => {
    let parsedJSON;
    try {
      parsedJSON = JSON.parse(jsonPreview);
    } catch {
      setInvalidJson(true);
      return;
    }
    onUpdate(parsedJSON);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Box>
          {T.translate("emails.sample_data")}
          <br />
          <Box component="span" sx={{ fontSize: "0.8rem", fontWeight: 400 }}>
            {T.translate("emails.sample_data_legend")}
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: "75vh" }}>
        {renderErrors?.length > 0 && (
          <Box sx={{ color: "error.main", mb: 2 }}>{renderErrors}</Box>
        )}
        {invalidJson && (
          <Box sx={{ color: "error.main", mb: 2 }}>
            {T.translate("emails.invalid_json")}
          </Box>
        )}
        <label>
          {" "}
          JSON{" "}
          <a
            href="https://jsonformatter.curiousconcept.com/"
            target="_blank"
            rel="noreferrer"
          >
            format
          </a>
        </label>
        <CodeMirror
          id="json_preview"
          value={jsonPreview}
          onChange={(value) => handleJsonChange(value)}
          theme={sublimeInit({
            settings: {
              caret: "#c6c6c6",
              fontFamily: "monospace"
            }
          })}
          extensions={[json()]}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleUpdate}>
          {T.translate("emails.update")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EmailTemplateJsonDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  jsonData: PropTypes.object,
  renderErrors: PropTypes.array,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

EmailTemplateJsonDialog.defaultProps = {
  jsonData: {},
  renderErrors: []
};

export default EmailTemplateJsonDialog;
