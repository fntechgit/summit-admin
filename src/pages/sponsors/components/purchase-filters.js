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
import { Box } from "@mui/material";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import { PURCHASE_METHODS, PURCHASE_STATUS } from "../../../utils/constants";

const PurchaseFilters = ({ filters, onChange, sx }) => {
  const { status, paymentMethod, cardEnabled } = filters;
  const allOption = {
    value: "",
    label: T.translate("sponsor_show_purchases.filters.all")
  };

  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <Box sx={{ display: "flex", gap: 2, ...sx }}>
      <Box sx={{ minWidth: 150 }}>
        <MuiDropdown
          id="purchase-status-filter"
          size="small"
          label={T.translate("sponsor_show_purchases.filters.status")}
          placeholder={allOption.label}
          value={status ?? ""}
          options={[
            allOption,
            ...Object.entries(PURCHASE_STATUS).map(([key, value]) => ({
              value,
              label: T.translate(
                `sponsor_show_purchases.filters.status_options.${key.toLowerCase()}`
              )
            }))
          ]}
          onChange={(ev) => handleChange("status", ev.target.value)}
        />
      </Box>
      <Box sx={{ minWidth: 150 }}>
        <MuiDropdown
          id="purchase-payment-method-filter"
          size="small"
          label={T.translate("sponsor_show_purchases.filters.payment_method")}
          placeholder={allOption.label}
          value={paymentMethod ?? ""}
          options={[
            allOption,
            ...Object.entries(PURCHASE_METHODS).map(([key, value]) => ({
              value,
              label: T.translate(
                `sponsor_show_purchases.filters.payment_method_options.${key.toLowerCase()}`
              )
            }))
          ]}
          onChange={(ev) => handleChange("paymentMethod", ev.target.value)}
        />
      </Box>
      <Box sx={{ minWidth: 150 }}>
        {/* MuiDropdown only takes string values; the filter itself is a boolean */}
        <MuiDropdown
          id="purchase-card-enabled-filter"
          size="small"
          label={T.translate("sponsor_show_purchases.filters.card_enabled")}
          placeholder={allOption.label}
          value={cardEnabled == null ? "" : String(cardEnabled)}
          options={[
            allOption,
            { value: "true", label: T.translate("general.yes") },
            { value: "false", label: T.translate("general.no") }
          ]}
          onChange={(ev) =>
            handleChange(
              "cardEnabled",
              ev.target.value === "" ? null : ev.target.value === "true"
            )
          }
        />
      </Box>
    </Box>
  );
};

PurchaseFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    paymentMethod: PropTypes.string,
    cardEnabled: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired,
  sx: PropTypes.shape({})
};

PurchaseFilters.defaultProps = {
  filters: {},
  sx: {}
};

export default PurchaseFilters;
