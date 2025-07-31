/**
 * Copyright 2025 OpenStack Foundation
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
import T from "i18n-react/dist/i18n-react";
import { Box, Divider, Grid2, Typography } from "@mui/material";

const SponsorHeader = ({ sponsor }) => (
  <Box sx={{ px: 2, py: 0, backgroundColor: "white" }}>
    <Grid2 container size={12} sx={{ height: "68px", alignItems: "center" }}>
      <Grid2 size={12}>
        <Typography
          sx={{
            fontWeight: "500",
            letterSpacing: "0.15px",
            fontSize: "2rem",
            lineHeight: "1.6rem"
          }}
        >
          {T.translate("edit_sponsor.general_information")}
        </Typography>
      </Grid2>
    </Grid2>
    <Divider />
    <Grid2
      container
      size={12}
      sx={{ height: "75px", gap: "10px", alignItems: "center" }}
    >
      <Grid2 size={3}>
        <Typography
          sx={{
            fontSize: "1.4rem",
            lineHeight: "1.57rem",
            fontWeight: "500"
          }}
        >
          {T.translate("edit_sponsor.sponsor_name")}
        </Typography>
      </Grid2>
      <Grid2>{sponsor.company?.name}</Grid2>
    </Grid2>
    <Divider />
    <Grid2
      container
      size={12}
      sx={{ height: "75px", gap: "10px", alignItems: "center" }}
    >
      <Grid2 size={3}>
        <Typography
          sx={{
            fontSize: "1.4rem",
            lineHeight: "1.57rem",
            fontWeight: "500"
          }}
        >
          {T.translate("edit_sponsor.sponsor_address")}
        </Typography>
      </Grid2>
    </Grid2>
  </Box>
);

export default SponsorHeader;
