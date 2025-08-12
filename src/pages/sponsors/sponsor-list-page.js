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

import React, { useCallback, useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Button,
  Grid2,
  TextField,
  Typography,
  Badge,
  Tooltip
} from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import {
  getLeadReportSettingsMeta,
  getSummitById,
  upsertLeadReportSettings
} from "../../actions/summit-actions";
import {
  getSponsors,
  addSponsorToSummit,
  deleteSponsor,
  updateSponsorOrder
} from "../../actions/sponsor-actions";
import Member from "../../models/member";
import MuiTable from "../../components/mui/table/mui-table";
import { DEBOUNCE_WAIT, DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import AddSponsorDialog from "./popup/add-sponsor-popup";

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
  orderDir,
  lastPage,
  addSponsorToSummit
}) => {
  const [searchTerm, setSearchTerm] = useState(term);
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);

  useEffect(() => {
    if (currentSummit) {
      getSponsors();
    }
  }, [currentSummit]);

  const handleSearchDebounced = useCallback(
    _.debounce((term) => {
      getSponsors(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
    }, DEBOUNCE_WAIT),
    [perPage, order, orderDir]
  );

  useEffect(() => handleSearchDebounced.cancel(), [handleSearchDebounced]);

  const handleEdit = (sponsor) => {
    history.push(`/app/summits/${currentSummit.id}/sponsors/${sponsor.id}`);
  };

  const handleDelete = (sponsorId) => {
    deleteSponsor(sponsorId);
  };

  const handleNewSponsor = (sponsor) => {
    addSponsorToSummit(sponsor).then(() => {
      setShowAddSponsorModal(false);
      getSponsors(term, lastPage, perPage, order, orderDir);
    });
  };

  const handlePageChange = (page) => {
    getSponsors(term, page, perPage, order, orderDir);
  };
  const handlePerPageChange = (newPerPage) => {
    getSponsors(term, currentPage, newPerPage, order, orderDir);
  };
  const handleSort = (index, key, dir) => {
    getSponsors(term, currentPage, perPage, key, dir);
  };

  const handleOpenAddSponsorPopup = () => {
    setShowAddSponsorModal(true);
  };

  const handleCloseAddSponsorPopup = () => {
    setShowAddSponsorModal(false);
  };

  const memberObj = new Member(member);
  const canAddSponsors = memberObj.canAddSponsors();
  const canDeleteSponsors = memberObj.canDeleteSponsors();

  const columns = [
    { columnKey: "id", header: T.translate("sponsor_list.id") },
    { columnKey: "company_name", header: T.translate("sponsor_list.company") },
    {
      columnKey: "sponsorships",
      header: T.translate("sponsor_list.sponsorship"),
      render: (row) =>
        row.sponsorships.map((s) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{ fontSize: "1.4rem", mr: "15px", lineHeight: "2rem" }}
            >
              {s.type?.type?.name}
            </Typography>
            <Tooltip
              title={
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontSize: "14px", fontWeight: "bold" }}
                  >
                    {T.translate("sponsor_list.add_ons")}
                  </Typography>
                  {s.add_ons.map((a) => (
                    <Typography
                      key={a.name}
                      sx={{ fontSize: "12px", lineHeight: "20px" }}
                    >
                      {a.name}
                    </Typography>
                  ))}
                </Box>
              }
              arrow
              placement="top"
            >
              <Badge
                badgeContent={s.add_ons.length}
                slotProps={{
                  badge: {
                    sx: {
                      backgroundColor: "#EAEDF4",
                      color: "#000",
                      minWidth: 20,
                      height: 20,
                      fontWeight: "500",
                      fontSize: "1.2rem",
                      borderRadius: "100px",
                      ml: "10px"
                    }
                  }
                }}
              />
            </Tooltip>
          </Box>
        ))
    },
    {
      columnKey: "documents",
      header: T.translate("sponsor_list.documents"),
      render: (row) =>
        `${row.documents?.length || 0} ${T.translate(
          "sponsor_list.documents"
        ).toLowerCase()}`
    },
    {
      columnKey: "forms",
      header: T.translate("sponsor_list.forms"),
      render: (row) =>
        `${row.forms?.length || 0} ${T.translate(
          "sponsor_list.forms"
        ).toLowerCase()}`
    },
    {
      columnKey: "purchases",
      header: T.translate("sponsor_list.purchases"),
      render: (row) =>
        `${row.purchases?.length || 0} ${T.translate(
          "sponsor_list.purchases"
        ).toLowerCase()}`
    },
    {
      columnKey: "pages",
      header: T.translate("sponsor_list.pages"),
      render: (row) =>
        `${row.pages?.length || 0} ${T.translate(
          "sponsor_list.pages"
        ).toLowerCase()}`
    }
  ];

  if (!currentSummit.id) return <div />;

  const sortedSponsors = [...sponsors];
  sortedSponsors.sort((a, b) =>
    a.order > b.order ? 1 : a.order < b.order ? -1 : 0
  );

  return (
    <div className="container">
      <h3> {T.translate("sponsor_list.sponsor_list")}</h3>

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
          <Box component="span">{totalSponsors} sponsors</Box>
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
              onChange={(event) => {
                const { value } = event.target;
                setSearchTerm(value);
                handleSearchDebounced(value);
              }}
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
                onClick={() => handleOpenAddSponsorPopup()}
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
            data={sortedSponsors}
            columns={columns}
            totalRows={totalSponsors}
            perPage={perPage}
            currentPage={currentPage}
            getName={(item) => item.company_name}
            onEdit={handleEdit}
            onDelete={canDeleteSponsors ? handleDelete : null}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
          />
        </div>
      )}

      {showAddSponsorModal && (
        <AddSponsorDialog
          open={showAddSponsorModal}
          onClose={handleCloseAddSponsorPopup}
          onSubmit={handleNewSponsor}
          summitId={currentSummit.id}
        />
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
  upsertLeadReportSettings,
  addSponsorToSummit
})(SponsorListPage);
