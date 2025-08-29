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
import EventRSVPForm from "../../components/forms/event-rsvp-form";
import {
  getEventRSVPById,
  saveEventRSVP
} from "../../actions/event-rsvp-actions";

class EditEventRSVPPage extends React.Component {
  constructor(props) {
    const rsvpId = props.match.params.rsvp_id;
    super(props);

    if (rsvpId) {
      props.getEventRSVPById(rsvpId);
    }
  }

  componentDidUpdate(prevProps) {
    const oldId = prevProps.match.params.rsvp_id;
    const newId = this.props.match.params.rsvp_id;

    if (oldId !== newId) {
      if (newId) {
        this.props.getEventRSVPById(newId);
      }
    }
  }

  render() {
    const { currentSummit, entity, errors, match, event } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.id : T.translate("general.new");

    if (!event) return <div />;

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_event_rsvp.rsvp")}
        </h3>
        <hr />
        {currentSummit && (
          <EventRSVPForm
            currentSummit={currentSummit}
            entity={entity}
            event={event}
            errors={errors}
            onSubmit={this.props.saveEventRSVP}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentEventRSVPState,
  currentSummitEventState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  event: currentSummitEventState.entity,
  ...currentEventRSVPState
});

export default connect(mapStateToProps, {
  getEventRSVPById,
  saveEventRSVP
})(EditEventRSVPPage);
