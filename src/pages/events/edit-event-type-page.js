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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import EventTypeForm from "../../components/forms/event-type-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getEventType,
  resetEventTypeForm,
  saveEventType
} from "../../actions/event-type-actions";
import "../../styles/edit-event-type-page.less";
import {
  queryMediaUploads,
  linkToPresentationType,
  unlinkFromPresentationType
} from "../../actions/media-upload-actions";
import AddNewButton from "../../components/buttons/add-new-button";

class EditEventTypePage extends React.Component {
  constructor(props) {
    const eventTypeId = props.match.params.event_type_id;
    super(props);

    if (!eventTypeId) {
      props.resetEventTypeForm();
    } else {
      props.getEventType(eventTypeId);
    }

    this.getMediaUploads = this.getMediaUploads.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.event_type_id;
    const newId = this.props.match.params.event_type_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetEventTypeForm();
      } else {
        this.props.getEventType(newId);
      }
    }
  }

  getMediaUploads(input, callback) {
    const { currentSummit } = this.props;

    if (!input) {
      return Promise.resolve({ options: [] });
    }

    return queryMediaUploads(currentSummit.id, input, callback);
  }

  render() {
    const { currentSummit, entity, errors, match } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.name : T.translate("general.new");

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_event_type.event_type")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <EventTypeForm
            currentSummit={currentSummit}
            entity={entity}
            errors={errors}
            onSubmit={this.props.saveEventType}
            getMediaUploads={this.getMediaUploads}
            onMediaUploadLink={this.props.linkToPresentationType}
            onMediaUploadUnLink={this.props.unlinkFromPresentationType}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, currentEventTypeState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventTypeState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEventType,
  resetEventTypeForm,
  saveEventType,
  linkToPresentationType,
  unlinkFromPresentationType
})(EditEventTypePage);
