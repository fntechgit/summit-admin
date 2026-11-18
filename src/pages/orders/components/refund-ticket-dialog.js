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
import * as yup from "yup";
import { InputLabel, Typography } from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiForm from "openstack-uicore-foundation/lib/components/mui/form";
import InfoTooltip from "../../../components/mui/info-tooltip";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import { decimalValidation } from "../../../utils/yup";
import { DECIMAL_DIGITS } from "../../../utils/constants";

const RefundTicketDialog = ({
  currencySymbol,
  netSellingCost,
  refundedAmount,
  onRefund,
  onClose
}) => {
  // rounded: 50.3 - 20.1 is 30.199999999999996
  const maxAmount = Number(
    (netSellingCost - refundedAmount).toFixed(DECIMAL_DIGITS)
  );

  const handleSubmit = async ({ amount, notes }) => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.refund_warning"),
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("edit_ticket.yes_refund")
    });
    if (!confirmed) return;

    // CustomDialog stays locked until this settles and open if it rejects
    await onRefund(amount, notes);
    onClose();
  };

  const formik = useFormik({
    initialValues: { amount: "", notes: "" },
    validationSchema: yup.object({
      amount: decimalValidation()
        // empty shows "required", not "must be a number"
        .transform((value, original) => (original === "" ? undefined : value))
        .moreThan(0, T.translate("validation.positive"))
        .max(maxAmount, T.translate("edit_ticket.refund_amount_error"))
    }),
    onSubmit: handleSubmit
  });

  return (
    <CustomDialog
      title={
        <>
          {T.translate("edit_ticket.refund_modal_title")}
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            {`${T.translate(
              "edit_ticket.net_selling_price"
            )} ${currencySymbol} ${netSellingCost}`}
          </Typography>
        </>
      }
      open
      onClose={onClose}
      primaryAction={{
        label: T.translate("edit_ticket.refund"),
        onClick: formik.submitForm
      }}
    >
      <FormikProvider value={formik}>
        <MuiForm onSubmit={formik.handleSubmit} noValidate autoComplete="off">
          <InputLabel htmlFor="refundAmount">
            {T.translate("edit_ticket.refund_amount")}
            <InfoTooltip
              title={T.translate("edit_ticket.refund_amount_info")}
            />
          </InputLabel>
          <MuiFormikTextField
            id="refundAmount"
            name="amount"
            type="number"
            size="small"
            margin="none"
            fullWidth
            placeholder="0.00"
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
          <InputLabel htmlFor="refundNotes" sx={{ mt: 2 }}>
            {T.translate("edit_ticket.refund_request_notes")}
          </InputLabel>
          <MuiFormikTextField
            id="refundNotes"
            name="notes"
            multiline
            rows={3}
            margin="none"
            fullWidth
            placeholder={T.translate("edit_ticket.placeholders.refund_notes")}
          />
        </MuiForm>
      </FormikProvider>
    </CustomDialog>
  );
};

RefundTicketDialog.propTypes = {
  currencySymbol: PropTypes.string.isRequired,
  netSellingCost: PropTypes.number.isRequired,
  refundedAmount: PropTypes.number.isRequired,
  onRefund: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RefundTicketDialog;
