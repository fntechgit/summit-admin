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
import { Box, Chip, IconButton } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  getGeneralMURequests,
  getSponsorMURequests,
  removeFileForSponsorMU,
  uploadFileForSponsorMU
} from "../../../actions/sponsor-mu-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import MuiTable from "../../../components/mui/table/mui-table";
import { SPONSOR_MEDIA_UPLOAD_STATUS } from "../../../utils/constants";
import UploadDialog from "../../../components/upload-dialog";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";

const SponsorMediaUploadTab = ({
  sponsorRequests,
  generalRequests,
  getSponsorMURequests,
  getGeneralMURequests,
  uploadFileForSponsorMU,
  removeFileForSponsorMU
}) => {
  const [uploadModule, setUploadModule] = useState(null);

  useEffect(() => {
    getSponsorMURequests();
    getGeneralMURequests();
  }, []);

  const handleSponsorPageChange = (page) => {
    const { perPage, order, orderDir } = sponsorRequests;
    getSponsorMURequests(page, perPage, order, orderDir);
  };

  const handleSponsorSort = (key, dir) => {
    const { currentPage, perPage } = sponsorRequests;
    getSponsorMURequests(currentPage, perPage, key, dir);
  };

  const handleUpload = (item) => {
    setUploadModule(item);
  };

  const handleUploadFile = (file) => {
    uploadFileForSponsorMU(uploadModule.page_id, uploadModule.id, file).then(
      () => {
        setUploadModule(null);
      }
    );
  };

  const handleView = (item) => {
    console.log("VIEW : ", item);
  };

  const handleDownload = (item) => {
    console.log("DOWNLOAD : ", item);
  };

  const handleDelete = async (item) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("general.row_remove_warning")} ${item.name}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      removeFileForSponsorMU(item.page_id, item.id);
    }
  };

  const handleGeneralPageChange = (page) => {
    const { perPage, order, orderDir } = sponsorRequests;
    getGeneralMURequests(page, perPage, order, orderDir);
  };

  const handleGeneralSort = (key, dir) => {
    const { currentPage, perPage } = sponsorRequests;
    getGeneralMURequests(currentPage, perPage, key, dir);
  };

  const getTableColumns = (type) => {
    const isSponsor = type === "sponsor";
    const nameLabel = isSponsor
      ? T.translate("edit_sponsor.mu_tab.sponsor_request")
      : T.translate("edit_sponsor.mu_tab.general_request");

    const getChipColor = (status) => {
      switch (status) {
        case SPONSOR_MEDIA_UPLOAD_STATUS.DEADLINE_ALERT:
          return "warning";
        case SPONSOR_MEDIA_UPLOAD_STATUS.DEADLINE_MISSED:
          return "error";
        case SPONSOR_MEDIA_UPLOAD_STATUS.COMPLETE:
          return "success";
        default:
          return "default";
      }
    };

    return [
      {
        columnKey: "name",
        header: nameLabel,
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
            variant="outlined"
            color={getChipColor(row.status)}
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
            disabled={!row.media_upload}
            onClick={() => handleView(row)}
          >
            <VisibilityIcon fontSize="large" />
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
            disabled={!row.media_upload}
            onClick={() => handleDownload(row)}
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
          if (row.media_upload) {
            return (
              <IconButton size="large" onClick={() => handleDelete(row)}>
                <DeleteIcon fontSize="large" />
              </IconButton>
            );
          }
          return (
            <IconButton size="large" onClick={() => handleUpload(row)}>
              <ArrowUpwardIcon fontSize="large" />
            </IconButton>
          );
        }
      }
    ];
  };

  return (
    <Box sx={{ mt: 2 }}>
      <CustomAlert
        message={T.translate("edit_sponsor.mu_tab.alert_info")}
        hideIcon
      />
      <div>
        <Box component="div" sx={{ mb: 2 }}>
          {sponsorRequests.totalCount}{" "}
          {T.translate("edit_sponsor.mu_tab.media_upload")}
          {sponsorRequests.totalCount === 1 ? "" : "s"}
        </Box>
        <MuiTable
          columns={getTableColumns("sponsor")}
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
      <div>
        <Box component="div" sx={{ mb: 2 }}>
          {generalRequests.totalCount}{" "}
          {T.translate("edit_sponsor.mu_tab.media_upload")}
          {generalRequests.totalCount === 1 ? "" : "s"}
        </Box>
        <MuiTable
          columns={getTableColumns("general")}
          data={generalRequests.requests}
          options={{
            sortCol: generalRequests.order,
            sortDir: generalRequests.orderDir
          }}
          perPage={generalRequests.perPage}
          totalRows={generalRequests.totalCount}
          currentPage={generalRequests.currentPage}
          onPageChange={handleGeneralPageChange}
          onSort={handleGeneralSort}
        />
      </div>
      <UploadDialog
        name={uploadModule?.name}
        open={!!uploadModule}
        onClose={() => setUploadModule(null)}
        onUpload={handleUploadFile}
        onRemove={() => handleDelete(uploadModule)}
        value={uploadModule?.media_upload}
        fileMeta={{
          ...(uploadModule?.file_type || {}),
          max_file_size: uploadModule?.max_file_size
        }}
        maxFiles={1}
      />
    </Box>
  );
};

const mapStateToProps = ({ sponsorPageMUListState }) => ({
  ...sponsorPageMUListState
});

export default connect(mapStateToProps, {
  getSponsorMURequests,
  getGeneralMURequests,
  uploadFileForSponsorMU,
  removeFileForSponsorMU
})(SponsorMediaUploadTab);
