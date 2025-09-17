import React, { useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Divider,
  Grid2,
  Typography,
  InputLabel,
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExtraQuestionsMUI from "openstack-uicore-foundation/lib/components/extra-questions-mui";

import useScrollToError from "../../../hooks/useScrollToError";
import MuiFormikTextField from "../../../components/mui/formik-inputs/mui-formik-textfield";
import { getTypeValue, toSlug } from "../../../utils/extra-questions";

const formatExtraQuestions = (extraQuestions, sponsorQuestions) => {
  const values = {};

  sponsorQuestions.forEach((q) => {
    const slug = toSlug(q.name, q.id);
    const answer =
      extraQuestions.find((eq) => eq.question_id === q.id)?.value || "";
    const formattedAnswer = getTypeValue(answer, q.type);

    values[slug] = formattedAnswer;
  });

  return values;
};

const EditBadgeScanPopup = ({ badgeScan, open, onClose, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      id: badgeScan.id,
      attendee_full_name: badgeScan.attendee_full_name,
      attendee_company: badgeScan.attendee_company,
      notes: badgeScan.notes,
      ...formatExtraQuestions(
        badgeScan.extra_questions,
        badgeScan.sponsor_extra_questions
      )
    },
    validationSchema: yup.object({
      attendee_full_name: yup.string().required(),
      attendee_company: yup.string().required(),
      notes: yup.string()
    }),
    onSubmit: (values) => {
      const {
        id,
        attendee_full_name,
        attendee_company,
        notes,
        ...extraValues
      } = values;

      // formatting extra questions before submit, and omit empty answers
      const extra_questions = Object.entries(extraValues)
        .map(([slug, value]) => {
          const parts = slug.split("_").pop();
          const question_id = parseInt(parts);

          return {
            question_id,
            answer: Array.isArray(value)
              ? value.filter((v) => v !== "").join(",")
              : value
          };
        })
        .filter((q) => q.answer);

      onSubmit({
        id,
        attendee_full_name,
        attendee_company,
        notes,
        extra_questions
      });
    },
    enableReinitialize: true
  });

  // SCROLL TO ERROR
  useScrollToError(formik);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  useEffect(() => {
    if (Object.keys(formik.errors).length > 0) {
      console.log("Validation errors:", formik.errors);
    }
  }, [formik.errors]);

  useEffect(() => {
    if (Object.keys(formik.values).length > 0) {
      console.log("Validation values:", formik.values);
    }
  }, [formik.values]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {T.translate("edit_badge_scan.edit_badge_scan")}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
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
          <DialogContent sx={{ p: 1 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2
                container
                spacing={2}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="attendee_full_name">
                  {T.translate("edit_badge_scan.attendee_name")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="attendee_full_name"
                    formik={formik}
                    disabled
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={2}
                size={6}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="attendee_company">
                  {T.translate("edit_badge_scan.attendee_company")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="attendee_company"
                    formik={formik}
                    disabled
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
              <Grid2
                container
                spacing={2}
                size={12}
                sx={{ alignItems: "baseline" }}
              >
                <InputLabel htmlFor="notes">
                  {T.translate("edit_badge_scan.notes")}
                </InputLabel>
                <Box width="100%">
                  <MuiFormikTextField
                    name="notes"
                    formik={formik}
                    multiline
                    rows={4}
                    maxLength={500}
                    fullWidth
                    margin="none"
                  />
                </Box>
              </Grid2>
            </Grid2>
            <Divider />
            <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
              <Grid2 spacing={2} size={12} sx={{ alignItems: "baseline" }}>
                <Typography>
                  {T.translate("edit_badge_scan.extra_questions")}
                </Typography>
                <ExtraQuestionsMUI
                  extraQuestions={badgeScan.sponsor_extra_questions.sort(
                    (a, b) => a.order - b.order
                  )}
                  formik={formik}
                  allowEdit
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

EditBadgeScanPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default EditBadgeScanPopup;
