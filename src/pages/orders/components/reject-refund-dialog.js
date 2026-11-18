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

import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import { InputLabel } from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiForm from "openstack-uicore-foundation/lib/components/mui/form";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";

const RejectRefundDialog = ({ onReject, onClose }) => {
  const handleReject = async ({ notes }) => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.cancel_refund_warning"),
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("edit_ticket.yes_cancel_refund")
    });
    if (!confirmed) return;

    // CustomDialog stays locked until this settles and open if it rejects
    await onReject(notes);
    onClose();
  };

  const formik = useFormik({
    initialValues: { notes: "" },
    onSubmit: handleReject
  });

  return (
    <CustomDialog
      title={T.translate("edit_ticket.refund_reject_modal_title")}
      open
      onClose={onClose}
      primaryAction={{
        label: T.translate("edit_ticket.refund_reject"),
        onClick: formik.submitForm
      }}
    >
      <FormikProvider value={formik}>
        <MuiForm onSubmit={formik.handleSubmit} noValidate autoComplete="off">
          <InputLabel htmlFor="refundRejectNotes">
            {T.translate("edit_ticket.refund_request_notes")}
          </InputLabel>
          <MuiFormikTextField
            id="refundRejectNotes"
            name="notes"
            multiline
            rows={3}
            margin="none"
            fullWidth
            placeholder={T.translate(
              "edit_ticket.placeholders.refund_reject_notes"
            )}
          />
        </MuiForm>
      </FormikProvider>
    </CustomDialog>
  );
};

RejectRefundDialog.propTypes = {
  onReject: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RejectRefundDialog;
