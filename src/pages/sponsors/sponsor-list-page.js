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
import { Button, Grid2, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getSummitById,
  getLeadReportSettingsMeta,
  upsertLeadReportSettings
} from "../../actions/summit-actions";
import {
  getSponsors,
  deleteSponsor,
  updateSponsorOrder
} from "../../actions/sponsor-actions";
import Member from "../../models/member";
import MuiTable from "../../components/mui/table/mui-table";

const SponsorListPage = ({
  currentSummit,
  getSponsors,
  history,
  deleteSponsor,
  sponsors,
  totalSponsors,
  perPage,
  currentPage,
  member,
  term,
  order,
  orderDir
}) => {
  const [searchTerm, setSearchTerm] = useState(term);

  useEffect(() => {
    if (currentSummit) {
      getSponsors();
    }
  }, [currentSummit]);

  // componentDidMount() {
  //   const { currentSummit, getSponsors, getLeadReportSettingsMeta } =
  //     this.props;

  // }

  const handleEdit = (sponsor_id) => {
    history.push(`/app/summits/${currentSummit.id}/sponsors/${sponsor_id}`);
  };

  const handleDelete = (sponsorId) => {
    const sponsor = sponsors.find((s) => s.id === sponsorId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("sponsor_list.remove_warning")} ${
        sponsor.company_name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteSponsor(sponsorId);
      }
    });
  };

  const handleNewSponsor = () => {
    history.push(`/app/summits/${currentSummit.id}/sponsors/new`);
  };

  const handlePageChange = (page) => {
    getSponsors(term, page, perPage, order, orderDir);
  };
  const handlePerPageChange = (newPerPage) => {
    getSponsors(term, currentPage, newPerPage, order, orderDir);
  };
  const handleSort = (index, key, dir) => {
    getInventoryItems(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      getSponsors(searchTerm, currentPage, perPage, order, orderDir);
    }
  };

  const memberObj = new Member(member);
  const canAddSponsors = memberObj.canAddSponsors();
  const canDeleteSponsors = memberObj.canDeleteSponsors();

  const columns = [
    { columnKey: "id", header: T.translate("sponsor_list.id") },
    { columnKey: "company_name", header: T.translate("sponsor_list.company") },
    {
      columnKey: "sponsorship_name",
      header: T.translate("sponsor_list.sponsorship")
    },
    { columnKey: "documents", header: T.translate("sponsor_list.documents") },
    { columnKey: "company_name", header: T.translate("sponsor_list.forms") },
    {
      columnKey: "company_name",
      header: T.translate("sponsor_list.purchases")
    },
    { columnKey: "company_name", header: T.translate("sponsor_list.pages") },
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
      edit: { onClick: handleEdit }
    }
  };

  if (canDeleteSponsors) {
    table_options.actions = {
      ...table_options.actions,
      delete: { onClick: handleDelete }
    };
  }

  if (!currentSummit.id) return <div />;

  const sortedSponsors = [...sponsors];
  sortedSponsors.sort((a, b) =>
    a.order > b.order ? 1 : a.order < b.order ? -1 : 0
  );

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("sponsor_list.sponsor_list")} ({totalSponsors})
      </h3>

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
          <Box component="span">{totalSponsors} items</Box>
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
          <Grid2 size={2} />
          <Grid2 size={6}>
            <TextField
              variant="outlined"
              value={searchTerm}
              placeholder={T.translate(
                "inventory_item_list.placeholders.search_inventory_items"
              )}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }
              }}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={handleSearch}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "36px"
                }
              }}
            />
          </Grid2>
          <Grid2 size={4}>
            {canAddSponsors && (
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleNewSponsor()}
                startIcon={<AddIcon />}
                sx={{ height: "36px" }}
              >
                {T.translate("sponsor_list.add_sponsor")}
              </Button>
            )}
          </Grid2>
        </Grid2>
      </Grid2>

      {sponsors.length === 0 && (
        <div>{T.translate("sponsor_list.no_sponsors")}</div>
      )}

      {sponsors.length > 0 && (
        <div>
          <MuiTable
            options={table_options}
            data={sortedSponsors}
            columns={columns}
            totalRows={totalSponsors}
            // dropCallback={this.props.updateSponsorOrder}
            // orderField="order"
            perPage={perPage}
            currentPage={currentPage}
            onRowEdit={handleEdit}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({
  loggedUserState,
  currentSummitState,
  currentSponsorListState,
  currentSummitSponsorshipListState
}) => ({
  availableLeadReportColumns: currentSummitState.available_lead_report_columns,
  summitLeadReportColumns: currentSummitState.lead_report_settings,
  currentSummit: currentSummitState.currentSummit,
  allSponsorships: currentSummitSponsorshipListState.sponsorships,
  member: loggedUserState.member,
  ...currentSponsorListState
});

export default connect(mapStateToProps, {
  getLeadReportSettingsMeta,
  getSummitById,
  getSponsors,
  deleteSponsor,
  updateSponsorOrder,
  upsertLeadReportSettings
})(SponsorListPage);
