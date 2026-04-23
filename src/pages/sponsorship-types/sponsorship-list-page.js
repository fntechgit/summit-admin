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
import { Box, Button, Grid2, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  getSponsorships,
  getSponsorship,
  saveSponsorship,
  deleteSponsorship,
  resetSponsorshipForm
} from "../../actions/sponsorship-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import SponsorshipDialog from "./components/sponsorship-dialog";

const SponsorshipListPage = ({
  sponsorships,
  currentSponsorship,
  currentPage,
  perPage,
  order,
  orderDir,
  totalSponsorships,
  getSponsorships,
  getSponsorship,
  saveSponsorship,
  deleteSponsorship,
  resetSponsorshipForm
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getSponsorships();
  }, [getSponsorships]);

  const handlePageChange = (page) => {
    getSponsorships(searchTerm, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorships(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleSort = (key, dir) => {
    getSponsorships(searchTerm, currentPage, perPage, key, dir);
  };

  const handleSearch = (ev) => {
    setSearchTerm(ev.target.value);
    if (ev.key === "Enter") {
      getSponsorships(
        searchTerm,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      );
    }
  };

  const handleRowEdit = (row) => {
    getSponsorship(row.id).then(() => setOpen(true));
  };

  const handleNew = () => {
    resetSponsorshipForm();
    setOpen(true);
  };

  const handleClose = () => {
    resetSponsorshipForm();
    setOpen(false);
  };

  const handleSave = (entity) => {
    saveSponsorship(entity)
      .then(() =>
        getSponsorships(
          searchTerm,
          DEFAULT_CURRENT_PAGE,
          perPage,
          order,
          orderDir
        )
      )
      .then(() => setOpen(false));
  };

  const handleDelete = (sponsorshipId) => {
    deleteSponsorship(sponsorshipId).then(() =>
      getSponsorships(
        searchTerm,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      )
    );
  };

  const columns = [
    {
      columnKey: "name",
      header: T.translate("sponsorship_list.name"),
      sortable: true
    },
    {
      columnKey: "label",
      header: T.translate("sponsorship_list.label"),
      sortable: true
    },
    {
      columnKey: "size",
      header: T.translate("sponsorship_list.size"),
      sortable: true
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  return (
    <div className="container">
      <h3>{T.translate("sponsorship_list.sponsorship_types_list")}</h3>
      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">{totalSponsorships} tiers</Box>
        </Grid2>
        <Grid2
          container
          size={10}
          spacing={1}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <TextField
            variant="outlined"
            value={searchTerm}
            placeholder={T.translate("sponsorship_list.placeholders.search")}
            slotProps={{
              input: { startAdornment: <SearchIcon sx={{ mr: 1 }} /> }
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            sx={{ "& .MuiOutlinedInput-root": { height: "36px" } }}
          />
          <Button
            variant="contained"
            onClick={handleNew}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("sponsorship_list.add_sponsorship")}
          </Button>
        </Grid2>
      </Grid2>

      {sponsorships.length > 0 && (
        <MuiTable
          columns={columns}
          data={sponsorships}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalSponsorships}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleRowEdit}
          onDelete={handleDelete}
        />
      )}

      {sponsorships.length === 0 && (
        <div>{T.translate("sponsorship_list.no_sponsorships")}</div>
      )}

      {open && (
        <SponsorshipDialog
          entity={currentSponsorship}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSponsorshipListState,
  currentSponsorshipState
}) => ({
  ...currentSponsorshipListState,
  currentSponsorship: currentSponsorshipState.entity
});

export default connect(mapStateToProps, {
  getSponsorships,
  getSponsorship,
  saveSponsorship,
  deleteSponsorship,
  resetSponsorshipForm
})(SponsorshipListPage);
