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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import moment from "moment-timezone";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  TextField,
  Typography
} from "@mui/material";

const CHECKLIST = [
  { key: "devices", label: "edit_sponsor.force_delete_check_devices" },
  { key: "pending", label: "edit_sponsor.force_delete_check_pending" },
  {
    key: "third_party",
    label: "edit_sponsor.force_delete_check_third_party"
  }
];

const NO_CHECKS = { devices: false, pending: false, third_party: false };

/**
 * Admin only confirmation to force delete a sponsor extra question.
 * Sponsors can't delete questions because devices may hold answers the server has not seen, only
 * an admin who checked the devices can tell a delete is safe: the dialog shows what is at stake,
 * asks to confirm the checklist and a reason, and a second confirmation when collected answers
 * will be destroyed.
 */
const ForceDeleteExtraQuestionPopup = ({
  extraQuestion,
  getUsage,
  onConfirm,
  onClose
}) => {
  const [usage, setUsage] = useState(null);
  const [usageFailed, setUsageFailed] = useState(false);
  const [checks, setChecks] = useState(NO_CHECKS);
  const [reason, setReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);
  const [deleteAnswers, setDeleteAnswers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getUsage(extraQuestion.id)
      .then((response) => {
        if (active) setUsage(response);
      })
      .catch(() => {
        if (active) setUsageFailed(true);
      });
    return () => {
      active = false;
    };
  }, [extraQuestion.id]);

  const answersCount = usage?.answers_count ?? 0;
  const reasonMissing = reason.trim() === "";
  const allChecked = CHECKLIST.every(({ key }) => checks[key]);
  const answersConfirmed = answersCount === 0 || deleteAnswers;
  const canSubmit =
    !!usage && allChecked && !reasonMissing && answersConfirmed && !submitting;

  const handleCheck = (key) => (ev) =>
    setChecks((prev) => ({ ...prev, [key]: ev.target.checked }));

  const handleConfirm = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onConfirm(extraQuestion.id, {
      reason: reason.trim(),
      deleteAnswers: answersCount > 0 && deleteAnswers
    })
      .then(() => onClose())
      // the error is shown by the request, keep the dialog open to retry or cancel
      .catch(() => setSubmitting(false));
  };

  const renderActivity = () => {
    const reps = usage.reps || [];
    return (
      <Box sx={{ mt: 1 }}>
        <Typography sx={{ fontWeight: 500 }}>
          {T.translate("edit_sponsor.force_delete_scan_activity")}
        </Typography>
        {reps.length === 0 && (
          <Typography variant="body2">
            {T.translate("edit_sponsor.force_delete_no_scans")}
          </Typography>
        )}
        {reps.map((rep) => (
          <Typography variant="body2" key={rep.member_id}>
            {T.translate("edit_sponsor.force_delete_rep_activity", {
              name: `${rep.first_name} ${rep.last_name}`.trim(),
              email: rep.email,
              scans: rep.scans_count,
              date: moment.unix(rep.last_scan_date).format("YYYY-MM-DD HH:mm")
            })}
          </Typography>
        ))}
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1, color: "text.secondary" }}
        >
          {T.translate("edit_sponsor.force_delete_activity_note")}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {T.translate("edit_sponsor.force_delete_title")}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography sx={{ mb: 1 }}>
          {T.translate("edit_sponsor.force_delete_intro")}
        </Typography>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>
          {T.translate("edit_sponsor.force_delete_question", {
            name: extraQuestion.name
          })}
        </Typography>

        {!usage && !usageFailed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              {T.translate("edit_sponsor.force_delete_loading")}
            </Typography>
          </Box>
        )}

        {usageFailed && (
          <Typography color="error" sx={{ mb: 2 }}>
            {T.translate("edit_sponsor.force_delete_usage_error")}
          </Typography>
        )}

        {usage && (
          <>
            <Typography sx={{ fontWeight: 500 }}>
              {T.translate("edit_sponsor.force_delete_answers_count", {
                count: answersCount
              })}
            </Typography>
            {renderActivity()}

            <Typography sx={{ fontWeight: 500, mt: 2 }}>
              {T.translate("edit_sponsor.force_delete_checklist")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {CHECKLIST.map(({ key, label }) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={checks[key]}
                      onChange={handleCheck(key)}
                      inputProps={{
                        "data-testid": `force-delete-check-${key}`
                      }}
                    />
                  }
                  label={T.translate(label)}
                />
              ))}
            </Box>

            <TextField
              sx={{ mt: 2 }}
              fullWidth
              multiline
              minRows={2}
              label={T.translate("edit_sponsor.force_delete_reason")}
              placeholder={T.translate(
                "edit_sponsor.force_delete_reason_placeholder"
              )}
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
              onBlur={() => setReasonTouched(true)}
              error={reasonTouched && reasonMissing}
              helperText={
                reasonTouched && reasonMissing
                  ? T.translate("edit_sponsor.force_delete_reason_required")
                  : ""
              }
              inputProps={{ "data-testid": "force-delete-reason" }}
              required
            />

            {answersCount > 0 && (
              <Box sx={{ mt: 2, color: "error.main" }}>
                <Typography variant="body2" sx={{ color: "error.main" }}>
                  {T.translate(
                    "edit_sponsor.force_delete_delete_answers_warning"
                  )}
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="error"
                      checked={deleteAnswers}
                      onChange={(ev) => setDeleteAnswers(ev.target.checked)}
                      inputProps={{
                        "data-testid": "force-delete-delete-answers"
                      }}
                    />
                  }
                  label={T.translate(
                    "edit_sponsor.force_delete_delete_answers",
                    {
                      count: answersCount
                    }
                  )}
                  sx={{ color: "error.main" }}
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {T.translate("general.cancel")}
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!canSubmit}
          onClick={handleConfirm}
        >
          {T.translate("edit_sponsor.force_delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ForceDeleteExtraQuestionPopup.propTypes = {
  extraQuestion: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string
  }).isRequired,
  getUsage: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ForceDeleteExtraQuestionPopup;
