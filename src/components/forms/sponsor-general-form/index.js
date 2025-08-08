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
import { Box } from "@mui/material";
import SponsorHeader from "./sponsor-header";
import Sponsorship from "./sponsorship";

const SponsorGeneralForm = ({
  sponsor,
  summitId,
  onSponsorshipPaginate,
  onSponsorshipAdd,
  onSponsorshipDelete,
  getSponsorshipAddons,
  onSponsorshipSelect,
  onSponsorshipAddonSave,
  onSponsorshipAddonRemove
}) => (
  <Box sx={{ mt: 2 }}>
    <SponsorHeader sponsor={sponsor} />
    <Sponsorship
      sponsor={sponsor}
      summitId={summitId}
      onSponsorshipPaginate={onSponsorshipPaginate}
      onSponsorshipAdd={onSponsorshipAdd}
      onSponsorshipDelete={onSponsorshipDelete}
      getSponsorshipAddons={getSponsorshipAddons}
      onSponsorshipSelect={onSponsorshipSelect}
      onSponsorshipAddonSave={onSponsorshipAddonSave}
      onSponsorshipAddonRemove={onSponsorshipAddonRemove}
    />
  </Box>
);

export default SponsorGeneralForm;
