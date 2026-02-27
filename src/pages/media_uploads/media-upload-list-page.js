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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Table
} from "openstack-uicore-foundation/lib/components";
import { getSummitById } from "../../actions/summit-actions";
import {
  getMediaUploads,
  deleteMediaUpload,
  copyMediaUploads
} from "../../actions/media-upload-actions";
import SummitDropdown from "../../components/summit-dropdown";

const MediaUploadListPage = ({
  history,
  currentSummit,
  media_uploads,
  term,
  order,
  orderDir,
  currentPage,
  lastPage,
  perPage,
  ...props
}) => {
  useEffect(() => {
    props.getMediaUploads();
  }, []);

  const handleEdit = (media_upload_id) => {
    history.push(
      `/app/summits/${currentSummit.id}/media-uploads/${media_upload_id}`
    );
  };

  const handlePageChange = (page) => {
    props.getMediaUploads(term, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    props.getMediaUploads(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (term) => {
    props.getMediaUploads(term, currentPage, perPage, order, orderDir);
  };

  const handleNewMediaUpload = (ev) => {
    ev.preventDefault();
    history.push(`/app/summits/${currentSummit.id}/media-uploads/new`);
  };

  const handleDelete = (mediaUploadId) => {
    const media_upload = media_uploads.find((t) => t.id === mediaUploadId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("media_upload.delete_warning")} ${
        media_upload.name
      }}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        props.deleteMediaUpload(mediaUploadId);
      }
    });
  };

  const handleCopyMediaUploads = (fromSummitId) => {
    props.copyMediaUploads(fromSummitId);
  };

  const canEdit = (item) => !item.is_system_defined;

  const columns = [
    { columnKey: "id", value: T.translate("general.id"), sortable: true },
    {
      columnKey: "name",
      value: T.translate("media_upload.name"),
      sortable: true
    },
    {
      columnKey: "description",
      value: T.translate("media_upload.description")
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete, display: canEdit }
    }
  };

  return (
    <div className="container">
      <h3> {T.translate("media_upload.media_upload_list")}</h3>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term}
            placeholder={T.translate("media_upload.placeholders.search")}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6 text-right">
          <button
            className="btn btn-primary right-space"
            onClick={handleNewMediaUpload}
          >
            {T.translate("media_upload.add")}
          </button>
          <SummitDropdown
            onClick={handleCopyMediaUploads}
            actionLabel={T.translate("media_upload.copy_media_uploads")}
          />
        </div>
      </div>

      {media_uploads.length === 0 && (
        <div>{T.translate("media_upload.no_results")}</div>
      )}

      {media_uploads.length > 0 && (
        <div>
          <Table
            options={table_options}
            data={media_uploads}
            columns={columns}
            onSort={handleSort}
          />
          <Pagination
            bsSize="medium"
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={10}
            items={lastPage}
            activePage={currentPage}
            onSelect={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, mediaUploadListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...mediaUploadListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getMediaUploads,
  deleteMediaUpload,
  copyMediaUploads
})(MediaUploadListPage);
