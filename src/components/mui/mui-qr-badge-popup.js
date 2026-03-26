/**
 * Copyright 2019 OpenStack Foundation
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
import moment from "moment-timezone";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import ExtraQuestionsMUI from "openstack-uicore-foundation/lib/components/extra-questions-mui";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputLabel,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useSnackbarMessage } from "./SnackbarNotification/Context";
import MuiFormikTextField from "./formik-inputs/mui-formik-textfield";
import QrReader from "../qr-reader";
import { getTypeValue, toSlug } from "../../utils/extra-questions";

const buildInitialValues = (extraQuestions) => {
  const values = { notes: "" };
  extraQuestions.forEach((q) => {
    values[toSlug(q.name, q.id)] = getTypeValue("", q.type);
  });
  return values;
};

const MuiQrBadgePopup = ({ onClose, onSave, extraQuestions = [], isAdmin }) => {
  const { errorMessage } = useSnackbarMessage();
  const [scannedCode, setScannedCode] = useState(null);

  const formik = useFormik({
    initialValues: buildInitialValues(extraQuestions),
    onSubmit: (values) => {
      const { notes, ...extraValues } = values;

      const extra_questions = Object.entries(extraValues)
        .map(([slug, value]) => ({
          question_id: parseInt(slug.split("_").pop()),
          answer: Array.isArray(value)
            ? value.filter((v) => v !== "").join(",")
            : value
        }))
        .filter((q) => q.answer);

      return onSave({
        qr_code: scannedCode,
        scan_date: moment().unix(),
        notes,
        extra_questions
      });
    }
  });

  const handleScan = (data) => {
    if (!data) return;
    setScannedCode(data);
  };

  const handleRescan = () => {
    setScannedCode(null);
  };

  const handleError = () => {
    errorMessage(T.translate("sponsor_badge_scans.scan_popup.error"));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", p: 2 }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_badge_scans.scan_popup.scan_qr")}
        </Typography>
        <IconButton size="small" onClick={onClose}>
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
          <DialogContent>
            {scannedCode ? (
              <Alert
                severity="success"
                sx={{ mb: 2, alignItems: "center" }}
                action={
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    onClick={handleRescan}
                  >
                    {T.translate("sponsor_badge_scans.scan_popup.rescan")}
                  </Button>
                }
              >
                {T.translate("sponsor_badge_scans.scan_popup.badge_scanned")}
              </Alert>
            ) : (
              <Box sx={{ mb: 2 }}>
                <QrReader onError={handleError} onScan={handleScan} />
              </Box>
            )}

            {isAdmin && (
              <Box sx={{ mb: 2 }}>
                <InputLabel htmlFor="notes">
                  {T.translate("edit_badge_scan.notes")}
                </InputLabel>
                <MuiFormikTextField
                  name="notes"
                  multiline
                  rows={4}
                  fullWidth
                  margin="none"
                />
              </Box>
            )}

            {extraQuestions.length > 0 && isAdmin && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {T.translate("edit_badge_scan.extra_questions")}
                </Typography>
                <ExtraQuestionsMUI
                  extraQuestions={extraQuestions.sort(
                    (a, b) => a.order - b.order
                  )}
                  formik={formik}
                  allowEdit
                />
              </>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!scannedCode || formik.isSubmitting}
            >
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

export default MuiQrBadgePopup;
