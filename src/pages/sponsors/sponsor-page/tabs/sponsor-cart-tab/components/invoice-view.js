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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import history from "../../../../../../history";

const InvoiceView = ({ match }) => {
  const rootUrl = match.url
    .split("/")
    .filter((segment) => segment.length > 0)
    // eslint-disable-next-line no-magic-numbers
    .slice(0, -2)
    .join("/");

  const handleCancel = () => {
    history.push(`/${rootUrl}/cart`);
  };

  const handleToOrders = () => {
    history.push(`/${rootUrl}/purchases`);
  };

  return (
    <Card sx={{ borderRadius: "10px", height: "100%" }} variant="outlined">
      <CardContent>
        <Box sx={{ pt: 10, pb: 10 }}>
          <Box sx={{ width: 400, margin: "auto", textAlign: "center" }}>
            <Typography variant="h4" component="div" sx={{ mb: 2 }}>
              {T.translate("edit_sponsor.cart_tab.invoice_view.title")}
            </Typography>
            <Box
              component="div"
              sx={{
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
                gap: 2
              }}
            >
              <Button
                variant="contained"
                color="primary"
                style={{ minWidth: 250 }}
                onClick={handleCancel}
              >
                {T.translate("general.return")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                style={{ minWidth: 250 }}
                onClick={handleToOrders}
              >
                {T.translate("edit_sponsor.cart_tab.invoice_view.go_to_orders")}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const mapStateToProps = ({ showAccessState }) => ({
  ...showAccessState
});

export default connect(mapStateToProps, {})(InvoiceView);
