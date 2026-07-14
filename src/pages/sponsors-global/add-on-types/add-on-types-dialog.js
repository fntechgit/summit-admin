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

import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  IconButton,
  Divider,
  Grid2
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import { requiredStringValidation } from "../../../utils/yup";
import useScrollToError from "../../../hooks/useScrollToError";

const AddOnTypesDialog = ({ entity: initialEntity, onSave, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      name: initialEntity?.name ?? ""
    },
    validationSchema: yup.object().shape({
      name: requiredStringValidation()
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      onSave(values)
        .then(() => onClose())
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }
  });

  useScrollToError(formik);

  const handleClose = () => {
    if (isSaving) return;
    formik.resetForm();
    onClose();
  };

  const title = initialEntity?.id
    ? `${T.translate("general.edit")} ${T.translate(
        "add_on_types_list.add_on_type"
      )}`
    : `${T.translate("general.add")} ${T.translate(
        "add_on_types_list.add_on_type"
      )}`;

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {title}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ mr: 1 }}
          aria-label="close"
          disabled={isSaving}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent sx={{ p: 0 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={12}>
                <MuiFormikTextField
                  variant="outlined"
                  name="name"
                  id="name"
                  margin="none"
                  fullWidth
                  label={T.translate("edit_sponsorship.name")}
                  required
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSaving}
            >
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

AddOnTypesDialog.propTypes = {
  entity: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default AddOnTypesDialog;
