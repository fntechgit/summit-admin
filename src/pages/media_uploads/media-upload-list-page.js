/**
 * Copyright 2017 OpenStack Foundation
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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import SummitDropdown from "../../components/summit-dropdown";
import {
  getMediaUploads as getMediaUploadsAction,
  getMediaUpload as getMediaUploadAction,
  deleteMediaUpload as deleteMediaUploadAction,
  copyMediaUploads as copyMediaUploadsAction,
  resetMediaUploadForm as resetMediaUploadFormAction,
  saveMediaUpload as saveMediaUploadAction
} from "../../actions/media-upload-actions";
import { getAllMediaFileTypes as getAllMediaFileTypesAction } from "../../actions/media-file-type-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import MediaUploadDialog from "./components/media-upload-dialog";

const MediaUploadListPage = ({
  currentSummit,
  media_uploads,
  currentMediaUpload,
  currentMediaUploadErrors,
  mediaFileTypes,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalMediaUploads,
  getMediaUploads,
  getMediaUpload,
  deleteMediaUpload,
  copyMediaUploads,
  resetMediaUploadForm,
  saveMediaUpload,
  getAllMediaFileTypes
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getMediaUploads();
    getAllMediaFileTypes();
  }, []);

  const handleEdit = (row) => {
    getMediaUpload(row.id).then(() => setOpenPopup("mediaUploadForm"));
  };

  const handleNew = () => {
    resetMediaUploadForm();
    setOpenPopup("mediaUploadForm");
  };

  // The dialog closes when this promise resolves, so it must track ONLY the
  // save: a failed list refresh after a successful create would otherwise keep
  // the dialog open and invite a duplicate-create retry.
  const handleSave = (mediaUploadEntity) =>
    saveMediaUpload(mediaUploadEntity).then(() => {
      getMediaUploads(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      ).catch(() => {});
    });

  const handleDelete = (mediaUploadId) => {
    deleteMediaUpload(mediaUploadId).then(() =>
      getMediaUploads(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const handleSearch = (searchTerm) => {
    getMediaUploads(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handlePageChange = (page) => {
    getMediaUploads(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getMediaUploads(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getMediaUploads(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);
  };

  const handleCopyMediaUploads = (fromSummitId) => {
    copyMediaUploads(fromSummitId);
  };

  const canDeleteMediaUpload = (row) => !row.is_system_defined;

  const columns = [
    { columnKey: "id", header: T.translate("general.id"), sortable: true },
    {
      columnKey: "name",
      header: T.translate("media_upload.name"),
      sortable: true
    },
    {
      columnKey: "description",
      header: T.translate("media_upload.description")
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>{T.translate("media_upload.media_upload_list")}</h3>
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
          <Box component="span">
            {totalMediaUploads} {T.translate("media_upload.media_uploads")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <SearchInput term={term} onSearch={handleSearch} />
          </Grid2>
          <SummitDropdown
            onClick={handleCopyMediaUploads}
            actionLabel={T.translate("media_upload.copy_media_uploads")}
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
            {T.translate("media_upload.add")}
          </Button>
        </Grid2>
      </Grid2>

      {media_uploads.length > 0 && (
        <MuiTable
          columns={columns}
          data={media_uploads}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalMediaUploads}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canDelete={canDeleteMediaUpload}
          deleteDialogBody={(name) =>
            `${T.translate("media_upload.delete_warning")}${name}`
          }
          confirmButtonColor="error"
        />
      )}

      {media_uploads.length === 0 && (
        <div>{T.translate("media_upload.no_results")}</div>
      )}

      {openPopup === "mediaUploadForm" && (
        <MediaUploadDialog
          currentSummit={currentSummit}
          entity={currentMediaUpload}
          errors={currentMediaUploadErrors}
          mediaFileTypes={mediaFileTypes}
          onClose={() => setOpenPopup(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

MediaUploadListPage.propTypes = {
  currentSummit: PropTypes.shape({ id: PropTypes.number }).isRequired,
  media_uploads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      description: PropTypes.string
    })
  ).isRequired,
  currentMediaUpload: PropTypes.shape({ id: PropTypes.number }).isRequired,
  currentMediaUploadErrors: PropTypes.shape({}),
  mediaFileTypes: PropTypes.arrayOf(PropTypes.shape({})),
  term: PropTypes.string,
  currentPage: PropTypes.number,
  perPage: PropTypes.number,
  order: PropTypes.string,
  orderDir: PropTypes.number,
  totalMediaUploads: PropTypes.number,
  getMediaUploads: PropTypes.func.isRequired,
  getMediaUpload: PropTypes.func.isRequired,
  deleteMediaUpload: PropTypes.func.isRequired,
  copyMediaUploads: PropTypes.func.isRequired,
  resetMediaUploadForm: PropTypes.func.isRequired,
  saveMediaUpload: PropTypes.func.isRequired,
  getAllMediaFileTypes: PropTypes.func.isRequired
};

MediaUploadListPage.defaultProps = {
  currentMediaUploadErrors: {},
  mediaFileTypes: [],
  term: "",
  currentPage: 1,
  perPage: 10,
  order: "id",
  orderDir: 1,
  totalMediaUploads: 0
};

const mapStateToProps = ({
  currentSummitState,
  mediaUploadListState,
  mediaUploadState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...mediaUploadListState,
  currentMediaUpload: mediaUploadState.entity,
  currentMediaUploadErrors: mediaUploadState.errors,
  mediaFileTypes: mediaUploadState.media_file_types
});

export default connect(mapStateToProps, {
  getMediaUploads: getMediaUploadsAction,
  getMediaUpload: getMediaUploadAction,
  deleteMediaUpload: deleteMediaUploadAction,
  copyMediaUploads: copyMediaUploadsAction,
  resetMediaUploadForm: resetMediaUploadFormAction,
  saveMediaUpload: saveMediaUploadAction,
  getAllMediaFileTypes: getAllMediaFileTypesAction
})(MediaUploadListPage);
