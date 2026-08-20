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
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
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
  term,
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

  useEffect(() => {
    getSponsorships();
  }, []);

  const handlePageChange = (page) => {
    getSponsorships(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getSponsorships(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getSponsorships(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getSponsorships(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
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

  const handleSave = (entity) =>
    saveSponsorship(entity).then(() =>
      getSponsorships(
        term,
        entity.id ? currentPage : DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      ).catch(() => {})
    );

  const handleDelete = (sponsorshipId) => {
    deleteSponsorship(sponsorshipId).then(() =>
      getSponsorships(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
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
      <GridToolbar
        searchProps={{
          onSearch: handleSearch,
          term,
          placeholder: T.translate("sponsorship_list.placeholders.search")
        }}
      >
        <Button variant="contained" onClick={handleNew} startIcon={<AddIcon />}>
          {T.translate("sponsorship_list.add_sponsorship")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>
        {totalSponsorships} {T.translate("sponsorship_list.sponsorship_types")}
      </Box>

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
          deleteDialogBody={(name) =>
            T.translate("sponsorship_list.remove_warning", { name })
          }
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
