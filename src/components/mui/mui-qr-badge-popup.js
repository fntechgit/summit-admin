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
  FormControlLabel,
  IconButton,
  InputLabel,
  Radio,
  RadioGroup,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useSnackbarMessage } from "./SnackbarNotification/Context";
import MuiFormikTextField from "./formik-inputs/mui-formik-textfield";
import QrReader from "../qr-reader";
import { getTypeValue, toSlug } from "../../utils/extra-questions";
import MuiFormikAsyncAutocomplete from "./formik-inputs/mui-formik-async-select";
import { queryAttendees } from "../../actions/attendee-actions";

const buildInitialValues = (extraQuestions) => {
  const values = { notes: "", attendee_email: "" };
  extraQuestions.forEach((q) => {
    values[toSlug(q.name, q.id)] = getTypeValue("", q.type);
  });
  return values;
};

const BADGE_SCAN_MODE_QR = "qr";
const BADGE_SCAN_MODE_ATTENDEE = "attendee";

const MuiQrBadgePopup = ({
  onClose,
  onSave,
  extraQuestions = [],
  isAdmin,
  summitId
}) => {
  const { errorMessage } = useSnackbarMessage();
  const [scannedCode, setScannedCode] = useState(null);
  const [scanMode, setScanMode] = useState(null);

  const formik = useFormik({
    initialValues: buildInitialValues(extraQuestions),
    onSubmit: (values) => {
      const { attendee_email, notes, ...extraValues } = values;

      const extra_questions = Object.entries(extraValues)
        .map(([slug, value]) => ({
          question_id: parseInt(slug.split("_").pop()),
          answer: Array.isArray(value)
            ? value.filter((v) => v !== "").join(",")
            : value
        }))
        .filter((q) => q.answer);

      const entity = {
        ...(scanMode === BADGE_SCAN_MODE_QR
          ? { qr_code: scannedCode }
          : { attendee_email: attendee_email.value }),
        scan_date: moment().unix(),
        notes,
        extra_questions
      };

      return onSave(entity);
    }
  });

  const handleScanModeChange = (e) => {
    setScanMode(e.target.value);
    setScannedCode(null);
  };

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

  const isSubmitDisabled =
    formik.isSubmitting ||
    !scanMode ||
    (scanMode === BADGE_SCAN_MODE_QR && !scannedCode) ||
    (scanMode === BADGE_SCAN_MODE_ATTENDEE && !formik.values.attendee_email);

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
            <RadioGroup
              row
              value={scanMode}
              onChange={handleScanModeChange}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value={BADGE_SCAN_MODE_QR}
                control={<Radio />}
                label={T.translate("sponsor_badge_scans.scan_popup.scan_qr")}
              />
              <FormControlLabel
                value={BADGE_SCAN_MODE_ATTENDEE}
                control={<Radio />}
                label={T.translate("sponsor_badge_scans.scan_popup.attendee")}
              />
            </RadioGroup>

            {scanMode === BADGE_SCAN_MODE_QR &&
              (scannedCode ? (
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
              ))}

            {scanMode === BADGE_SCAN_MODE_ATTENDEE && (
              <Box sx={{ mb: 2 }}>
                <InputLabel htmlFor="attendee">
                  {T.translate("sponsor_badge_scans.scan_popup.attendee")}
                </InputLabel>
                <MuiFormikAsyncAutocomplete
                  name="attendee_email"
                  fullWidth
                  margin="none"
                  placeholder={T.translate(
                    "sponsor_badge_scans.scan_popup.attendee_placeholder"
                  )}
                  queryFunction={queryAttendees}
                  queryParams={[summitId]}
                  formatOption={(attendee) => ({
                    value: attendee.email.toString(),
                    label: `${attendee.first_name || ""} ${
                      attendee.last_name || ""
                    } (${attendee.email || attendee.id})`
                  })}
                />
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
              disabled={isSubmitDisabled}
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
