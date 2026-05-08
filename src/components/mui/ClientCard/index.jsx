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

import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid2,
  IconButton,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EditClientDialog from "./components/EditClientDialog";
import EditAddressDialog from "./components/EditAddressDialog";

const ClientCard = ({ client, address, onClientSubmit, onAddressSubmit }) => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  const clientDetails = `${client?.company_name}\n${client?.contact_name} - ${client?.contact_email} - ${client?.contact_phone}`;
  const addressDetails = `${address?.line1} ${address?.line2},\n${address?.postal_code} ${address?.city} ${address?.state} ${address?.country}`;
  const hasAddress = addressDetails.trim().length > 1;

  return (
    <>
      <Card
        sx={{ minWidth: 275, borderRadius: "10px", height: "100%" }}
        variant="outlined"
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {T.translate("client_card.title")}
          </Typography>
          <Grid2 container>
            <Grid2 size="grow">
              <Box sx={{ position: "relative", pr: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mb: 0.5 }}
                >
                  {T.translate("client_card.client")}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {clientDetails}
                </Typography>
                <IconButton
                  onClick={() => setClientDialogOpen(true)}
                  sx={{ position: "absolute", top: 0, right: 0 }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
            </Grid2>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <Grid2 size="grow">
              <Box sx={{ position: "relative", pr: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mb: 0.5 }}
                >
                  {T.translate("client_card.address")}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {hasAddress ? addressDetails : "N/A"}
                </Typography>
                <IconButton
                  onClick={() => setAddressDialogOpen(true)}
                  sx={{ position: "absolute", top: 0, right: 0 }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      <EditClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSubmit={onClientSubmit}
        client={client}
      />
      <EditAddressDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        onSubmit={onAddressSubmit}
        address={address}
      />
    </>
  );
};

export default ClientCard;
