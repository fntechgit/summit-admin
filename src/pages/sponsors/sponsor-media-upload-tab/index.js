/**
 * Copyright 2024 OpenStack Foundation
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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Chip, IconButton } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getSponsorMURequests } from "../../../actions/sponsor-mu-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import MuiTable from "../../../components/mui/table/mui-table";
import { SPONSOR_MEDIA_UPLOAD_STATUS } from "../../../utils/constants";

const SponsorMediaUploadTab = ({ sponsorRequests, getSponsorMURequests }) => {
  useEffect(() => {
    getSponsorMURequests();
  }, []);

  const handleSponsorPageChange = (page) => {
    const { perPage, order, orderDir } = sponsorRequests;
    getSponsorMURequests(page, perPage, order, orderDir);
  };

  const handleSponsorSort = (key, dir) => {
    const { currentPage, perPage } = sponsorRequests;
    getSponsorMURequests(currentPage, perPage, key, dir);
  };

  const handleSponsorDelete = (itemId) => {
    console.log("DELETE : ", itemId);
  };

  const handleSponsorView = (item) => {
    console.log("VIEW : ", item);
  };

  const handleSponsorUpload = (item) => {
    console.log("UPLOAD : ", item);
  };

  const handleSponsorDownload = (item) => {
    console.log("DOWNLOAD : ", item);
  };

  const sponsorColumns = [
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.mu_tab.sponsor_request"),
      sortable: true
    },
    {
      columnKey: "add_on",
      header: T.translate("edit_sponsor.mu_tab.add_on")
    },
    {
      columnKey: "max_size",
      header: T.translate("edit_sponsor.mu_tab.max_size")
    },
    {
      columnKey: "format",
      header: T.translate("edit_sponsor.mu_tab.format")
    },
    {
      columnKey: "deadline",
      header: T.translate("edit_sponsor.mu_tab.deadline"),
      sortable: true
    },
    {
      columnKey: "status",
      header: T.translate("edit_sponsor.mu_tab.status"),
      sortable: true,
      render: (row) => (
        <Chip
          color={
            row.status === SPONSOR_MEDIA_UPLOAD_STATUS.PENDING
              ? "warning"
              : "success"
          }
          label={row.status}
        />
      )
    },
    {
      columnKey: "view",
      header: "",
      width: 80,
      align: "center",
      render: (row) => (
        <IconButton
          size="large"
          disabled={!!row.file}
          onClick={() => handleSponsorView(row)}
        >
          <EditIcon fontSize="large" />
        </IconButton>
      )
    },
    {
      columnKey: "download",
      header: "",
      width: 80,
      align: "center",
      render: (row) => (
        <IconButton
          size="large"
          disabled={!!row.file}
          onClick={() => handleSponsorDownload(row)}
        >
          <DownloadIcon fontSize="large" />
        </IconButton>
      )
    },
    {
      columnKey: "upload_delete",
      header: "",
      width: 80,
      align: "center",
      render: (row) => {
        if (row.file) {
          return (
            <IconButton
              size="large"
              onClick={() => handleSponsorDelete(row.id)}
            >
              <DeleteIcon fontSize="large" />
            </IconButton>
          );
        }
        return (
          <IconButton size="large" onClick={() => handleSponsorUpload(row)}>
            <ArrowUpwardIcon fontSize="large" />
          </IconButton>
        );
      }
    }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <CustomAlert
        message={T.translate("edit_sponsor.mu_tab.alert_info")}
        hideIcon
      />
      <div>
        <Box component="span">
          {sponsorRequests.totalCount}{" "}
          {T.translate("edit_sponsor.mu_tab.media_upload")}
        </Box>
        <MuiTable
          columns={sponsorColumns}
          data={sponsorRequests.requests}
          options={{
            sortCol: sponsorRequests.order,
            sortDir: sponsorRequests.orderDir
          }}
          perPage={sponsorRequests.perPage}
          totalRows={sponsorRequests.totalCount}
          currentPage={sponsorRequests.currentPage}
          onPageChange={handleSponsorPageChange}
          onSort={handleSponsorSort}
        />
      </div>
    </Box>
  );
};

const mapStateToProps = ({ sponsorPageMUListState }) => ({
  ...sponsorPageMUListState
});

export default connect(mapStateToProps, {
  getSponsorMURequests
})(SponsorMediaUploadTab);
