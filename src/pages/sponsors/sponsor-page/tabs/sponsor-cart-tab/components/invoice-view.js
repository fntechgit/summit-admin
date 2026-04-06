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

const InvoiceView = ({ onCancel }) => (
  <Card sx={{ borderRadius: "10px", height: "100%" }} variant="outlined">
    <CardContent>
      <Box sx={{ pt: 10, pb: 10 }}>
        <Box sx={{ width: 400, margin: "auto", textAlign: "center" }}>
          <Typography variant="h4" component="div" sx={{ mb: 2 }}>
            {T.translate("edit_sponsor.cart_tab.invoice_view.title")}
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 2 }}>
            {T.translate("edit_sponsor.cart_tab.invoice_view.subtitle")}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            style={{ minWidth: 250 }}
            onClick={onCancel}
          >
            {T.translate("general.return")}
          </Button>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const mapStateToProps = ({ showAccessState }) => ({
  ...showAccessState
});

export default connect(mapStateToProps, {})(InvoiceView);
