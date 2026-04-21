/**
 * Copyright 2026 OpenStack Foundation
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
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import MuiTable from "../../../../../components/mui/table/mui-table";
import {
  getBadgeScans,
  exportBadgeScans,
  getBadgeScan,
  saveBadgeScan,
  addBadgeScan
} from "../../../../../actions/sponsor-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../../utils/constants";
import EditBadgeScanPopup from "./edit-badge-scan-popup";
import MuiQrBadgePopup from "../../../../../components/mui/mui-qr-badge-popup";
import Member from "../../../../../models/member";

const SponsorBadgeScans = ({
  member,
  sponsor,
  summitId,
  badgeScans,
  totalBadgeScans,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  getBadgeScans,
  exportBadgeScans,
  getBadgeScan,
  saveBadgeScan,
  addBadgeScan,
  currentBadgeScan
}) => {
  useEffect(() => {
    if (sponsor?.id) getBadgeScans(sponsor.id);
  }, [sponsor]);

  const memberObj = new Member(member);
  const isAdmin = memberObj.hasAccess("admin-sponsors");

  const [searchTerm, setSearchTerm] = useState(term);
  const [showEditBadgeScanPopup, setShowEditBadgeScanPopup] = useState(false);
  const [showManualBadgeScanPopup, setShowManualBadgeScanPopup] =
    useState(false);

  const handleSearch = (ev) => {
    if (ev.key === "Enter") {
      getBadgeScans(
        sponsor.id,
        searchTerm,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      );
    }
  };

  const handlePageChange = (page) => {
    getBadgeScans(sponsor.id, term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getBadgeScans(
      sponsor.id,
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleSort = (key, dir) => {
    getBadgeScans(sponsor.id, term, 1, perPage, key, dir);
  };

  const handleRowEdit = (row) => {
    getBadgeScan(row.id).then(() => setShowEditBadgeScanPopup(true));
  };

  const handleCloseEditBadgeScanPopup = () => {
    setShowEditBadgeScanPopup(false);
  };

  const handleBadgeScanSave = (badgeScan) => {
    saveBadgeScan(badgeScan).then(() => setShowEditBadgeScanPopup(false));
  };

  const handleNewManualScan = () => {
    setShowManualBadgeScanPopup(true);
  };

  const handleManualScanSubmit = (entity) => {
    addBadgeScan(entity).then(() => {
      setShowManualBadgeScanPopup(false);
      return getBadgeScans(
        sponsor.id,
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      );
    });
  };

  const handleExportBadgeScans = () => {
    exportBadgeScans(sponsor);
  };

  const columns = [
    {
      columnKey: "id",
      header: T.translate("sponsor_badge_scans.id"),
      sortable: true
    },
    {
      columnKey: "scan_date",
      header: T.translate("sponsor_badge_scans.scanned"),
      sortable: true
    },
    {
      columnKey: "attendee_first_name",
      header: T.translate("sponsor_badge_scans.first_name"),
      sortable: true
    },
    {
      columnKey: "attendee_last_name",
      header: T.translate("sponsor_badge_scans.last_name"),
      sortable: true
    },
    {
      columnKey: "attendee_email",
      header: T.translate("sponsor_badge_scans.email"),
      sortable: true
    },
    {
      columnKey: "attendee_company",
      header: T.translate("sponsor_badge_scans.company"),
      sortable: true
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={3}>
          <Box component="span">
            {totalBadgeScans} {T.translate("sponsor_badge_scans.badge_scanned")}
          </Box>
        </Grid2>
        <Grid2 size={9} justifyContent="flex-end" gap={1} container>
          <TextField
            variant="outlined"
            value={searchTerm}
            placeholder={T.translate(
              "inventory_item_list.placeholders.search_inventory_items"
            )}
            slotProps={{
              input: {
                endAdornment: <SearchIcon sx={{ ml: 1 }} />
              }
            }}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={handleSearch}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px"
              },
              backgroundColor: "white"
            }}
          />
          <Button
            variant="contained"
            size="medium"
            onClick={handleNewManualScan}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("sponsor_badge_scans.add_manual_scan")}
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={handleExportBadgeScans}
            startIcon={<DownloadIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("sponsor_badge_scans.export")}
          </Button>
        </Grid2>
      </Grid2>

      {badgeScans.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={badgeScans}
            options={tableOptions}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalBadgeScans}
            onEdit={handleRowEdit}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
          />
        </div>
      )}

      {showEditBadgeScanPopup && (
        <EditBadgeScanPopup
          badgeScan={currentBadgeScan}
          open={showEditBadgeScanPopup}
          onClose={handleCloseEditBadgeScanPopup}
          onSubmit={handleBadgeScanSave}
        />
      )}
      {showManualBadgeScanPopup && (
        <MuiQrBadgePopup
          onSave={handleManualScanSubmit}
          onClose={() => setShowManualBadgeScanPopup(false)}
          extraQuestions={sponsor.extra_questions}
          isAdmin={isAdmin}
          summitId={summitId}
        />
      )}
    </Box>
  );
};

const mapStateToProps = ({
  loggedUserState,
  badgeScansListState,
  currentBadgeScanState,
  currentSponsorState,
  currentSummitState
}) => ({
  ...badgeScansListState,
  currentBadgeScan: currentBadgeScanState.entity,
  member: loggedUserState.member,
  sponsor: currentSponsorState.entity,
  summitId: currentSummitState.currentSummit.id
});

export default connect(mapStateToProps, {
  getBadgeScans,
  exportBadgeScans,
  getBadgeScan,
  saveBadgeScan,
  addBadgeScan
})(SponsorBadgeScans);
