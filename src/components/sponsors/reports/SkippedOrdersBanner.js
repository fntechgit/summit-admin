import React from "react";
import T from "i18n-react/dist/i18n-react";
import { Alert, AlertTitle, Box, Typography } from "@mui/material";
import { formatCheckoutTime } from "./OrdersTable";

const REASON_KEYS = {
  missing_dim: "skipped_reason_missing_dim",
  write_error: "skipped_reason_write_error"
};

const SkippedOrdersBanner = ({ orders = [], count = 0, oldest = null }) => {
  if (!count) return null;
  return (
    <Alert
      data-testid="reports-skipped-orders"
      severity="warning"
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        {count === 1
          ? T.translate("sponsor_reports_page.skipped_orders_title_one")
          : T.translate("sponsor_reports_page.skipped_orders_title", {
              count
            })}
      </AlertTitle>
      {oldest != null && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {T.translate("sponsor_reports_page.skipped_orders_since", {
            time: formatCheckoutTime(oldest)
          })}
        </Typography>
      )}
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {orders.map((o) => (
          <li key={o.purchase_id}>
            {o.purchase_number} -{" "}
            {o.sponsor_name ||
              T.translate("sponsor_reports_page.skipped_unknown_sponsor")}{" "}
            (
            {T.translate(
              `sponsor_reports_page.${
                REASON_KEYS[o.reason] || "skipped_reason_unknown"
              }`
            )}
            )
          </li>
        ))}
      </Box>
    </Alert>
  );
};

export default SkippedOrdersBanner;
