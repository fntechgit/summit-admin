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
import { PURCHASE_METHODS, PURCHASE_STATUS } from "../../../utils/constants";

// action entry, not a status: never becomes the Select's value
const PAY_BY_CARD = "pay_by_card";

const PurchaseStatusCell = ({ purchase, onStatusChange, onPayByCard }) => {
  const isPendingInvoice =
    purchase.payment_method === PURCHASE_METHODS.INVOICE &&
    purchase.status === PURCHASE_STATUS.PENDING;

  const handleChange = async (ev) => {
    const { value } = ev.target;

    if (value !== PAY_BY_CARD) {
      onStatusChange(value);
      return;
    }

    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("sponsor_show_purchases.pay_by_card_warning"),
      iconType: "warning",
      confirmButtonText: T.translate("sponsor_show_purchases.pay_by_card")
    });

    if (isConfirmed) onPayByCard();
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isPendingInvoice ? (
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
      ) : (
        purchase.status
      )}
      <CardEnabledIndicator purchase={purchase} />
    </Box>
  );
};

PurchaseStatusCell.propTypes = {
  purchase: PropTypes.shape({
    payment_method: PropTypes.string,
    status: PropTypes.string,
    net_amount: PropTypes.number
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onPayByCard: PropTypes.func.isRequired
};

export default PurchaseStatusCell;
