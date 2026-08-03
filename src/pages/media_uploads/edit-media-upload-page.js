/**
 * Copyright 2020 OpenStack Foundation
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
import { Breadcrumb } from "react-breadcrumbs";
import MediaUploadForm from "../../components/forms/media-upload-form";
import {
  getMediaUpload,
  resetMediaUploadForm,
  saveMediaUpload
} from "../../actions/media-upload-actions";
import { getAllMediaFileTypes } from "../../actions/media-file-type-actions";

const EditMediaUploadPage = ({
  currentSummit,
  entity,
  errors,
  media_file_types: mediaFileTypes,
  match,
  history,
  getMediaUpload,
  resetMediaUploadForm,
  saveMediaUpload,
  getAllMediaFileTypes
}) => {
  const mediaUploadId = match.params.media_upload_id;

  useEffect(() => {
    if (!mediaUploadId) {
      resetMediaUploadForm();
    } else {
      getMediaUpload(mediaUploadId);
    }
  }, [mediaUploadId]);

  useEffect(() => {
    if (mediaFileTypes.length === 0) {
      getAllMediaFileTypes();
    }
  }, [mediaFileTypes.length]);

  const handleSubmit = (values) =>
    saveMediaUpload(values).then(() => {
      history.push(`/app/summits/${currentSummit.id}/media-uploads`);
    });

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  if (!currentSummit) return <div />;

  return (
    <div className="container edit-media-uploads-page">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("media_upload.media_upload")}
      </h3>
      <hr />
      <MediaUploadForm
        entity={entity}
        errors={errors}
        currentSummit={currentSummit}
        mediaFileTypes={mediaFileTypes}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

const mapStateToProps = ({ mediaUploadState, currentSummitState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...mediaUploadState
});

export default connect(mapStateToProps, {
  getMediaUpload,
  resetMediaUploadForm,
  saveMediaUpload,
  getAllMediaFileTypes
})(EditMediaUploadPage);
