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
import { Tooltip } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { formatEpoch } from "openstack-uicore-foundation/lib/utils/methods";

const CardEnabledIndicator = ({ purchase }) => {
  if (!purchase.card_payment_enabled_at) return null;

  const label = T.translate("sponsor_show_purchases.card_enabled_tooltip", {
    date: formatEpoch(purchase.card_payment_enabled_at, "YYYY/MM/DD HH:mm a"),
    user: purchase.card_payment_enabled_by_full_name
  });

  return (
    <Tooltip title={label}>
      <CreditCardIcon
        fontSize="large"
        sx={{ color: "primary.main" }}
        aria-label={label}
      />
    </Tooltip>
  );
};

CardEnabledIndicator.propTypes = {
  purchase: PropTypes.shape({
    card_payment_enabled_at: PropTypes.number,
    card_payment_enabled_by_full_name: PropTypes.string
  }).isRequired
};

export default CardEnabledIndicator;
