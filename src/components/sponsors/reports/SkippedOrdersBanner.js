import React from "react";
import T from "i18n-react/dist/i18n-react";
import { Alert, AlertTitle, Box, Typography } from "@mui/material";
import { formatCheckoutTime } from "./OrdersTable";

const SkippedOrdersBanner = ({ orders = [], count = 0, oldest = null }) => {
  if (!count) return null;
  return (
    <Alert
      data-testid="reports-skipped-orders"
      severity="warning"
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        {T.translate("sponsor_reports_page.skipped_orders_title", { count })}
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
            ({T.translate(`sponsor_reports_page.skipped_reason_${o.reason}`)})
          </li>
        ))}
      </Box>
    </Alert>
  );
};

export default SkippedOrdersBanner;
