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

import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Grid2, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddTierPopup from "./add-tier-popup";

const Sponsorship = ({ sponsor, summitId }) => {
  const [showAddTierPopup, setShowAddTierPopup] = useState(false);

  console.log("CHECK SPONSOR!", sponsor);

  const handleCloseAddTierPopup = () => {
    setShowAddTierPopup(false);
  };

  const handleOpenAddTierPopup = () => {
    setShowAddTierPopup(true);
  };

  const handleAddTierToSponsor = (tiers) => {
    console.log("CHECK TIERS", tiers);
  };

  return (
    <>
      <Box className="container" sx={{ px: 2, py: 0, mt: 2 }}>
        <Grid2 container size={12} sx={{ height: "68px" }}>
          <Grid2
            container
            size={12}
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography
              sx={{
                fontWeight: "500",
                letterSpacing: "0.15px",
                fontSize: "2rem",
                lineHeight: "1.6rem"
              }}
            >
              {T.translate("edit_sponsor.sponsorship")}
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenAddTierPopup}
              startIcon={<AddIcon />}
              sx={{ height: "36px" }}
            >
              {T.translate("edit_sponsor.add_tier")}
            </Button>
          </Grid2>
        </Grid2>
      </Box>
      {showAddTierPopup && (
        <AddTierPopup
          company={sponsor.company}
          summitId={summitId}
          open={showAddTierPopup}
          onClose={handleCloseAddTierPopup}
          onSubmit={handleAddTierToSponsor}
        />
      )}
    </>
  );
};

export default Sponsorship;
