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
import Swal from "sweetalert2";
import { Button, Grid2, IconButton, Alert, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { getSummitById } from "../../actions/summit-actions";
import {
  getSummitSponsorships,
  deleteSummitSponsorship,
  updateSummitSponsorhipOrder,
  saveSummitSponsorship
} from "../../actions/sponsor-actions";
import MuiTable from "../../components/mui/table/mui-table";
import AddTierPopup from "./popup/add-tier-popup";

const SummitSponsorshipListPage = ({
  currentSummit,
  history,
  deleteSummitSponsorship,
  sponsorships,
  currentPage,
  perPage,
  order,
  orderDir,
  totalSponsorships,
  updateSummitSponsorhipOrder,
  getSummitSponsorships,
  saveSummitSponsorship
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

  const handleEdit = (sponsorship_id) => {
    history.push(
      `/app/summits/${currentSummit.id}/sponsorships/${sponsorship_id}`
    );
  };

  const handleDelete = (sponsorshipId) => {
    const sponsorship = sponsorships.find((t) => t.id === sponsorshipId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("summit_sponsorship_list.remove_warning")} ${
        sponsorship.type.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteSummitSponsorship(sponsorshipId);
      }
    });
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
    },
    {
      columnKey: "edit",
      header: "",
      width: 40,
      align: "center",
      render: (row) => (
        <IconButton size="small" onClick={() => handleEdit(row.id)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
      className: "dottedBorderLeft"
    },
    {
      columnKey: "edit",
      header: "",
      width: 40,
      align: "center",
      render: (row) => (
        <IconButton size="small" onClick={() => handleDelete(row.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
      className: "dottedBorderLeft"
    }
  ];

  const table_options = {
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

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
          options={table_options}
          data={tableData}
          columns={columns}
          totalRows={totalSponsorships}
          currentPage={currentPage}
          perPage={perPage}
          onSort={handleSort}
          onReorder={handleReorder}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}

      <AddTierPopup
        open={showAddTierModal}
        onClose={() => setShowAddTierModal(false)}
        onSave={handleSaveSummitSponsorship}
        entity={null}
        sponsorships={tableData}
      />
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSummitSponsorshipListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSummitSponsorshipListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getSummitSponsorships,
  deleteSummitSponsorship,
  updateSummitSponsorhipOrder,
  saveSummitSponsorship
})(SummitSponsorshipListPage);
