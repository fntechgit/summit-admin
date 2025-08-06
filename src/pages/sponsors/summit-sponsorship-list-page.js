/**
 * Copyright 2019 OpenStack Foundation
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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Alert, Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getSummitById } from "../../actions/summit-actions";
import {
  deleteSummitSponsorship,
  getSummitSponsorship,
  getSummitSponsorships,
  removeSponsorshipBadgeImage,
  resetSummitSponsorshipForm,
  saveSummitSponsorship,
  updateSummitSponsorhipOrder,
  uploadSponsorshipBadgeImage
} from "../../actions/sponsor-actions";
import MuiTable from "../../components/mui/table/mui-table";
import EditTierPopup from "./popup/edit-tier-popup";

const SummitSponsorshipListPage = ({
  currentSummit,
  currentEntity,
  deleteSummitSponsorship,
  sponsorships,
  currentPage,
  perPage,
  order,
  orderDir,
  totalSponsorships,
  updateSummitSponsorhipOrder,
  getSummitSponsorships,
  getSummitSponsorship,
  saveSummitSponsorship,
  uploadSponsorshipBadgeImage,
  removeSponsorshipBadgeImage,
  resetSummitSponsorshipForm
}) => {
  useEffect(() => {
    if (currentSummit) {
      getSummitSponsorships();
    }
  }, []);

  const [tableData, setTableData] = useState(sponsorships);
  const [showAddTierModal, setShowAddTierModal] = useState(false);

  useEffect(() => {
    const sortedSponsorships = sponsorships.sort((a, b) => a.order - b.order);
    setTableData(sortedSponsorships);
  }, [sponsorships]);

  const handleDelete = (sponsorshipId) => {
    deleteSummitSponsorship(sponsorshipId);
  };

  const handleSort = (index, key, dir) => {
    getSummitSponsorships(key, dir);
  };

  const handlePageChange = (page) => {
    getSummitSponsorships(page, perPage, order, orderDir);
  };
  const handlePerPageChange = (newPerPage) => {
    getSummitSponsorships(currentPage, newPerPage, order, orderDir);
  };

  const handleNewSponsorship = () => {
    resetSummitSponsorshipForm();
    setShowAddTierModal(true);
  };

  const handleEditSponsorship = (row) => {
    if (row) getSummitSponsorship(row.id);
    setShowAddTierModal(true);
  };

  const handleReorder = (newOrder, itemId, newItemOrder) => {
    setTableData(newOrder);
    updateSummitSponsorhipOrder(newOrder, itemId, newItemOrder);
  };

  const handleSaveSummitSponsorship = (sponsorship) => {
    saveSummitSponsorship(sponsorship).then(() => setShowAddTierModal(false));
  };

  const columns = [
    {
      columnKey: "sponsorship_type",
      header: T.translate("summit_sponsorship_list.sponsorship_type"),
      value: T.translate("summit_sponsorship_list.sponsorship_type")
    },
    {
      columnKey: "label",
      header: T.translate("summit_sponsorship_list.label"),
      value: T.translate("summit_sponsorship_list.label")
    },
    {
      columnKey: "size",
      header: T.translate("summit_sponsorship_list.size"),
      value: T.translate("summit_sponsorship_list.size")
    }
  ];

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("summit_sponsorship_list.summit_sponsorship_list")} (
        {totalSponsorships})
      </h3>

      <Alert
        severity="info"
        sx={{
          justifyContent: "start",
          alignItems: "center",
          mb: 2
        }}
      >
        {T.translate("summit_sponsorship_list.alert_info")}
      </Alert>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={6}>
          <Box component="span">{totalSponsorships} summit tiers</Box>
        </Grid2>
        <Grid2
          container
          size={6}
          spacing={1}
          sx={{
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Grid2 size={{ xs: 0, sm: 4, lg: 6, xl: 7 }} />
          <Grid2 size={{ xs: 12, sm: 8, lg: 6, xl: 5 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleNewSponsorship}
              startIcon={<AddIcon />}
              sx={{ height: "36px" }}
            >
              {T.translate("summit_sponsorship_list.add_sponsorship")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

      {sponsorships.length === 0 && (
        <div>{T.translate("summit_sponsorship_list.no_sponsorships")}</div>
      )}

      {sponsorships.length > 0 && (
        <MuiTable
          data={tableData}
          columns={columns}
          totalRows={totalSponsorships}
          currentPage={currentPage}
          perPage={perPage}
          getName={(item) => item.sponsorship_type}
          onEdit={handleEditSponsorship}
          onDelete={handleDelete}
          onSort={handleSort}
          onReorder={handleReorder}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}

      <EditTierPopup
        open={showAddTierModal}
        onClose={() => setShowAddTierModal(false)}
        onSubmit={handleSaveSummitSponsorship}
        onBadgeImageAttach={uploadSponsorshipBadgeImage}
        onBadgeImageRemove={removeSponsorshipBadgeImage}
        entity={currentEntity}
      />
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSummitSponsorshipListState,
  currentSummitSponsorshipState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  currentEntity: currentSummitSponsorshipState.entity,
  ...currentSummitSponsorshipListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getSummitSponsorships,
  getSummitSponsorship,
  resetSummitSponsorshipForm,
  deleteSummitSponsorship,
  updateSummitSponsorhipOrder,
  saveSummitSponsorship,
  uploadSponsorshipBadgeImage,
  removeSponsorshipBadgeImage
})(SummitSponsorshipListPage);
