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
import { Box, MenuItem, Select } from "@mui/material";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import CardEnabledIndicator from "./card-enabled-indicator";
import {
  PAYMENT_STATUS,
  PURCHASE_METHODS,
  PURCHASE_STATUS
} from "../../../utils/constants";

// action entries, not statuses: never become the Select's value
const PAY_BY_CARD = "pay_by_card";
const RESUME_CHECKOUT = "resume_checkout";
const BACK_TO_INVOICE = "back_to_invoice";

// a card payment opened from Pay by card that can still be resumed (not confirmed/cancelled)
const RESUMABLE_PAYMENT_STATUSES = [
  PAYMENT_STATUS.NEW,
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.ERROR
];

const PurchaseStatusCell = ({
  purchase,
  onStatusChange,
  onPayByCard,
  onBackToInvoice
}) => {
  const isPending = purchase.status === PURCHASE_STATUS.PENDING;
  const isPendingInvoice =
    isPending && purchase.payment_method === PURCHASE_METHODS.INVOICE;

  // if admin already triggered a card payment, we can resume it
  const isResumableCardPayment =
    isPending &&
    purchase.payment_method !== PURCHASE_METHODS.INVOICE &&
    !!purchase.card_payment_enabled_at &&
    RESUMABLE_PAYMENT_STATUSES.includes(purchase.payment_status) &&
    purchase.net_amount > 0;

  const confirmPayByCard = async () => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("sponsor_show_purchases.pay_by_card_warning"),
      iconType: "warning",
      confirmButtonText: T.translate("sponsor_show_purchases.pay_by_card")
    });

    if (isConfirmed) onPayByCard();
  };

  const confirmBackToInvoice = async () => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("sponsor_show_purchases.back_to_invoice_warning"),
      iconType: "warning",
      confirmButtonText: T.translate("sponsor_show_purchases.back_to_invoice")
    });

    if (isConfirmed) onBackToInvoice();
  };

  const handleChange = (ev) => {
    const { value } = ev.target;

    switch (value) {
      // resume also calls change_payment_method: a no-op mid-payment, but its 412 stops a stale row the sponsor already paid
      case PAY_BY_CARD:
      case RESUME_CHECKOUT:
        confirmPayByCard();
        break;
      case BACK_TO_INVOICE:
        confirmBackToInvoice();
        break;
      default:
        onStatusChange(value);
    }
  };

  const renderStatus = () => {
    if (isPendingInvoice)
      return (
        <Select
          fullWidth
          size="small"
          variant="outlined"
          value={purchase.status}
          onChange={handleChange}
        >
          {Object.values(PURCHASE_STATUS).map((s) => (
            <MenuItem key={`purchase-status-${s}`} value={s}>
              {s}
            </MenuItem>
          ))}
          {purchase.net_amount > 0 && (
            <MenuItem value={PAY_BY_CARD}>
              {T.translate("sponsor_show_purchases.pay_by_card")}
            </MenuItem>
          )}
        </Select>
      );

    // no Paid/Canceled: approve is offline-only and the active payment here is the card one
    if (isResumableCardPayment)
      return (
        <Select
          fullWidth
          size="small"
          variant="outlined"
          value={purchase.status}
          onChange={handleChange}
        >
          <MenuItem value={PURCHASE_STATUS.PENDING}>
            {PURCHASE_STATUS.PENDING}
          </MenuItem>
          <MenuItem value={RESUME_CHECKOUT}>
            {T.translate("sponsor_show_purchases.resume_checkout")}
          </MenuItem>
          <MenuItem value={BACK_TO_INVOICE}>
            {T.translate("sponsor_show_purchases.back_to_invoice")}
          </MenuItem>
        </Select>
      );

    return purchase.status;
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {renderStatus()}
      <CardEnabledIndicator purchase={purchase} />
    </Box>
  );
};

PurchaseStatusCell.propTypes = {
  purchase: PropTypes.shape({
    payment_method: PropTypes.string,
    status: PropTypes.string,
    net_amount: PropTypes.number,
    card_payment_enabled_at: PropTypes.number,
    payment_status: PropTypes.string
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onPayByCard: PropTypes.func.isRequired,
  onBackToInvoice: PropTypes.func.isRequired
};

export default PurchaseStatusCell;
