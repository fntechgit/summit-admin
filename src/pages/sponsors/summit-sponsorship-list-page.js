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
import { Alert, Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTableSortable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import GridToolbar from "../../components/mui/grid-toolbar";
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
import EditTierPopup from "./popup/edit-tier-popup";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

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
    deleteSummitSponsorship(sponsorshipId).then(() =>
      getSummitSponsorships(DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const handleSort = (key, dir) => {
    getSummitSponsorships(key, dir);
  };

  const handlePageChange = (page) => {
    getSummitSponsorships(page, perPage, order, orderDir);
  };
  const handlePerPageChange = (newPerPage) => {
    getSummitSponsorships(DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
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

  const handleSaveSummitSponsorship = (sponsorship) =>
    saveSummitSponsorship(sponsorship).then(() =>
      getSummitSponsorships(
        sponsorship.id ? currentPage : DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      ).catch(() => {})
    );

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
      <h3> {T.translate("summit_sponsorship_list.tiers")}</h3>

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
      <GridToolbar>
        <Button
          variant="contained"
          onClick={handleNewSponsorship}
          startIcon={<AddIcon />}
        >
          {T.translate("summit_sponsorship_list.add_sponsorship")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>{totalSponsorships} summit tiers</Box>

      {sponsorships.length === 0 && (
        <div>{T.translate("summit_sponsorship_list.no_sponsorships")}</div>
      )}

      {sponsorships.length > 0 && (
        <MuiTableSortable
          data={tableData}
          columns={columns}
          totalRows={totalSponsorships}
          currentPage={currentPage}
          perPage={perPage}
          getName={(item) => item.sponsorship_type}
          onEdit={handleEditSponsorship}
          onDelete={handleDelete}
          deleteDialogBody={(name) =>
            T.translate("summit_sponsorship_list.remove_tier_warning", { name })
          }
          onSort={handleSort}
          onReorder={handleReorder}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}

      {showAddTierModal && (
        <EditTierPopup
          onClose={() => setShowAddTierModal(false)}
          onSubmit={handleSaveSummitSponsorship}
          onBadgeImageAttach={uploadSponsorshipBadgeImage}
          onBadgeImageRemove={removeSponsorshipBadgeImage}
          entity={currentEntity}
        />
      )}
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
