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
import URI from "urijs";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import SummitEventBulkEditorForm from "../../components/summit-event-bulk-actions/summit-event-bulk-editor-form";
import {
  getSummitEventsById,
  getSummitEventsByFilters,
  updateEventLocationLocal,
  updateEventTitleLocal,
  updateEventStartDateLocal,
  updateEventEndDateLocal,
  updateEvents,
  updateAndPublishEvents,
  updateEventsLocationLocal,
  updateEventsTypeLocal,
  updateEventsStartDateLocal,
  updateEventsEndDateLocal,
  updateEventSelectionPlanLocal,
  updateEventsSelectionPlanLocal,
  updateEventActivityTypeLocal,
  updateEventActivityCategoryLocal,
  updateEventDurationLocal,
  updateEventStreamingURLLocal,
  updateEventStreamingTypeLocal,
  updateEventStreamIsSecureLocal,
  updateEventMeetingURLLocal,
  updateEventEtherpadURLLocal,
  updateEventsActivityTypeLocal,
  updateEventsActivityCategoryLocal,
  updateEventsDurationLocal,
  updateEventsStreamingURLLocal,
  updateEventsStreamingTypeLocal,
  updateEventsStreamIsSecureLocal,
  updateEventsMeetingURLLocal,
  updateEventsEtherpadURLLocal
} from "../../actions/summit-event-bulk-actions";
import { getSummitById } from "../../actions/summit-actions";

class SummitEventsBulkActionsPage extends React.Component {
  componentDidMount() {
    const { location } = this.props;
    const query = URI.parseQuery(location.search);
    const { events } = query;

    if (events === "unpublished") {
      this.props.getSummitEventsByFilters();
    } else {
      this.props.getSummitEventsById(events);
    }
  }

  render() {
    const {
      events,
      match,
      currentSummit,
      updateEventLocationLocal,
      updateEventTitleLocal,
      updateEventStartDateLocal,
      updateEventEndDateLocal,
      updateEvents,
      updateAndPublishEvents,
      updateEventsTypeLocal,
      updateEventsLocationLocal,
      updateEventsStartDateLocal,
      updateEventsEndDateLocal,
      updateEventSelectionPlanLocal,
      updateEventsSelectionPlanLocal,
      updateEventActivityTypeLocal,
      updateEventActivityCategoryLocal,
      updateEventDurationLocal,
      updateEventStreamingURLLocal,
      updateEventStreamingTypeLocal,
      updateEventStreamIsSecureLocal,
      updateEventMeetingURLLocal,
      updateEventEtherpadURLLocal,
      updateEventsActivityTypeLocal,
      updateEventsActivityCategoryLocal,
      updateEventsDurationLocal,
      updateEventsStreamingURLLocal,
      updateEventsStreamingTypeLocal,
      updateEventsStreamIsSecureLocal,
      updateEventsMeetingURLLocal,
      updateEventsEtherpadURLLocal
    } = this.props;

    if (!currentSummit.id) return <div />;

    return (
      <div>
        <Breadcrumb
          data={{
            title: T.translate("bulk_actions_page.bulk_actions"),
            pathname: match.url
          }}
        />

        <div className="bulk-actions-editor-container">
          <h2>{T.translate("bulk_actions_page.title")}</h2>
          <SummitEventBulkEditorForm
            events={events}
            currentSummit={currentSummit}
            updateEventLocationLocal={updateEventLocationLocal}
            updateEventTitleLocal={updateEventTitleLocal}
            updateEventStartDateLocal={updateEventStartDateLocal}
            updateEventEndDateLocal={updateEventEndDateLocal}
            updateEvents={updateEvents}
            updateAndPublishEvents={updateAndPublishEvents}
            updateEventsTypeLocal={updateEventsTypeLocal}
            updateEventsLocationLocal={updateEventsLocationLocal}
            updateEventsStartDateLocal={updateEventsStartDateLocal}
            updateEventsEndDateLocal={updateEventsEndDateLocal}
            updateEventSelectionPlanLocal={updateEventSelectionPlanLocal}
            updateEventsSelectionPlanLocal={updateEventsSelectionPlanLocal}
            updateEventActivityTypeLocal={updateEventActivityTypeLocal}
            updateEventActivityCategoryLocal={updateEventActivityCategoryLocal}
            updateEventDurationLocal={updateEventDurationLocal}
            updateEventStreamingURLLocal={updateEventStreamingURLLocal}
            updateEventStreamingTypeLocal={updateEventStreamingTypeLocal}
            updateEventStreamIsSecureLocal={updateEventStreamIsSecureLocal}
            updateEventMeetingURLLocal={updateEventMeetingURLLocal}
            updateEventEtherpadURLLocal={updateEventEtherpadURLLocal}
            updateEventsActivityTypeLocal={updateEventsActivityTypeLocal}
            updateEventsActivityCategoryLocal={
              updateEventsActivityCategoryLocal
            }
            updateEventsDurationLocal={updateEventsDurationLocal}
            updateEventsStreamingURLLocal={updateEventsStreamingURLLocal}
            updateEventsStreamingTypeLocal={updateEventsStreamingTypeLocal}
            updateEventsStreamIsSecureLocal={updateEventsStreamIsSecureLocal}
            updateEventsMeetingURLLocal={updateEventsMeetingURLLocal}
            updateEventsEtherpadURLLocal={updateEventsEtherpadURLLocal}
            history={this.props.history}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  summitEventsBulkActionsState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  events: summitEventsBulkActionsState.eventOnBulkEdition
});

export default connect(mapStateToProps, {
  getSummitEventsById,
  getSummitEventsByFilters,
  getSummitById,
  updateEventLocationLocal,
  updateEventTitleLocal,
  updateEventStartDateLocal,
  updateEventEndDateLocal,
  updateEvents,
  updateAndPublishEvents,
  updateEventsLocationLocal,
  updateEventsTypeLocal,
  updateEventsStartDateLocal,
  updateEventsEndDateLocal,
  updateEventSelectionPlanLocal,
  updateEventsSelectionPlanLocal,
  updateEventActivityTypeLocal,
  updateEventActivityCategoryLocal,
  updateEventDurationLocal,
  updateEventStreamingURLLocal,
  updateEventStreamingTypeLocal,
  updateEventStreamIsSecureLocal,
  updateEventMeetingURLLocal,
  updateEventEtherpadURLLocal,
  updateEventsActivityTypeLocal,
  updateEventsActivityCategoryLocal,
  updateEventsDurationLocal,
  updateEventsStreamingURLLocal,
  updateEventsStreamingTypeLocal,
  updateEventsStreamIsSecureLocal,
  updateEventsMeetingURLLocal,
  updateEventsEtherpadURLLocal
})(SummitEventsBulkActionsPage);
