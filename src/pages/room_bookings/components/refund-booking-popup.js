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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";

const RefundBookingPopup = ({ booking, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const formik = useFormik({
    initialValues: { amount: 0 },
    validationSchema: yup.object().shape({
      amount: yup
        .number()
        .typeError(T.translate("validation.number"))
        .required(T.translate("validation.required"))
        .integer(T.translate("validation.integer"))
        .min(0, T.translate("validation.non_negative"))
    }),
    onSubmit: ({ amount }) => {
      if (isSaving) return;
      setIsSaving(true);
      onSave(booking, amount)
        .then(() => onClose())
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }
  });

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={isSaving}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {T.translate("room_booking_list.refund_title", {
          owner_name: booking.owner_name,
          room_name: booking.room_name
        })}
        <IconButton
          size="small"
          onClick={handleClose}
          aria-label="close"
          disabled={isSaving}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Typography>
              <strong>{T.translate("room_booking_list.user_paid")}: </strong>
              {booking.amount_str} {booking.currency}
            </Typography>
            <MuiFormikTextField
              name="amount"
              label={T.translate("room_booking_list.refund_amount")}
              type="number"
              fullWidth
              required
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {T.translate("room_booking_list.refund")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

RefundBookingPopup.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.number.isRequired,
    room_id: PropTypes.number,
    owner_name: PropTypes.string,
    room_name: PropTypes.string,
    amount_str: PropTypes.string,
    currency: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default RefundBookingPopup;
