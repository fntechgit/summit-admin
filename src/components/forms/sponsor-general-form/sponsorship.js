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
import MuiTable from "../../mui/table/mui-table";
import AddTierPopup from "./add-tier-popup";
import ManageTierAddonsPopup from "./manage-tier-addons-popup";

const Sponsorship = ({
  sponsor,
  summitId,
  onSponsorshipPaginate,
  onSponsorshipAdd,
  onSponsorshipDelete,
  getSponsorshipAddons,
  onSponsorshipSelect,
  onSponsorshipAddonSave,
  onSponsorshipAddonRemove
}) => {
  const [showAddTierPopup, setShowAddTierPopup] = useState(false);
  const [showManageTierAddonsPopup, setShowManageTierAddons] = useState(false);
  const [selectedSponsorship, setSelectedSponsorship] = useState(null);

  const {
    sponsorships,
    currentPage,
    perPage,
    totalSponsorships,
    order,
    orderDir
  } = sponsor.sponsorships_collection;

  const handleCloseAddTierPopup = () => {
    setShowAddTierPopup(false);
  };

  const handleOpenAddTierPopup = () => {
    setShowAddTierPopup(true);
  };

  const handleAddTierToSponsor = (sponsorships) => {
    onSponsorshipAdd(sponsorships).then(() => setShowAddTierPopup(false));
  };

  const handlePageChange = (page) => {
    onSponsorshipPaginate(page, perPage, order, orderDir);
  };
  const handlePerPageChange = (newPerPage) => {
    onSponsorshipPaginate(currentPage, newPerPage, order, orderDir);
  };
  const handleSort = (index, key, dir) => {
    onSponsorshipPaginate(currentPage, perPage, key, dir);
  };

  const handleOpenManageAddonsPopup = (sponsorship) => {
    setSelectedSponsorship(sponsorship);
    onSponsorshipSelect(sponsorship);
    setShowManageTierAddons(true);
  };

  const handleCloseManageAddonsPopup = () => {
    setShowManageTierAddons(false);
    onSponsorshipSelect(null);
    setSelectedSponsorship(null);
  };

  const handleAddSponsorshipAddon = (addons, sponsorshipId) => {
    onSponsorshipAddonSave(addons, sponsorshipId).then(() =>
      setShowManageTierAddons(false)
    );
  };

  const columns = [
    {
      columnKey: "tier",
      header: T.translate("edit_sponsor.tier"),
      sortable: true
    },
    {
      columnKey: "add_ons",
      header: T.translate("edit_sponsor.addons"),
      sortable: true,
      render: (row) =>
        row.add_ons.length > 0
          ? row.add_ons.map((a) => `${a.type} ${a.name}`).join(", ")
          : "None"
    },
    {
      columnKey: "manage_addons",
      header: "",
      width: 170,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleOpenManageAddonsPopup(row)}
          sx={{
            fontSize: "1.3rem",
            fontWeight: 500,
            lineHeight: "2.2rem",
            padding: "4px 5px"
          }}
        >
          {T.translate("edit_sponsor.manage_addons")}
        </Button>
      ),
      className: "dottedBorderLeft"
    }
  ];

  return (
    <>
      <Box sx={{ px: 2, py: 0, mt: 2, backgroundColor: "white" }}>
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
          sponsor={sponsor}
          summitId={summitId}
          open={showAddTierPopup}
          onClose={handleCloseAddTierPopup}
          onSubmit={handleAddTierToSponsor}
        />
      )}

      {showManageTierAddonsPopup && (
        <ManageTierAddonsPopup
          sponsorship={selectedSponsorship}
          summitId={summitId}
          open={showManageTierAddonsPopup}
          getSponsorshipAddons={getSponsorshipAddons}
          onSponsorshipAddonRemove={onSponsorshipAddonRemove}
          onClose={handleCloseManageAddonsPopup}
          onSubmit={handleAddSponsorshipAddon}
        />
      )}

      <div>
        <MuiTable
          data={sponsorships}
          columns={columns}
          totalRows={totalSponsorships}
          orderField="order"
          perPage={perPage}
          currentPage={currentPage}
          onDelete={onSponsorshipDelete}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
        />
      </div>
    </>
  );
};

export default Sponsorship;
