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

import React from "react";
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
import AddNewButton from "../../components/buttons/add-new-button";

// import '../../styles/edit-media-upload-page.less';

class EditMediaUploadPage extends React.Component {
  constructor(props) {
    const mediaUploadId = props.match.params.media_upload_id;
    super(props);

    this.state = {};

    if (!mediaUploadId) {
      props.resetMediaUploadForm();
    } else {
      props.getMediaUpload(mediaUploadId);
    }

    props.getAllMediaFileTypes();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.media_upload_id;
    const newId = this.props.match.params.media_upload_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetTemplateForm();
      } else {
        this.props.getMediaUpload(newId);
      }
    }
  }

  render() {
    const { entity, errors, match, currentSummit, media_file_types } =
      this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.name : T.translate("general.new");

    return (
      <div className="container edit-media-uploads-page">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("media_upload.media_upload")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        <MediaUploadForm
          entity={entity}
          errors={errors}
          currentSummit={currentSummit}
          mediaFileTypes={media_file_types}
          onSubmit={this.props.saveMediaUpload}
        />
      </div>
    );
  }
}

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
