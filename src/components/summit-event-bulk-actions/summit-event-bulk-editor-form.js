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
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import {
  DateTimePicker,
  SummitVenuesSelect,
  Input,
  Dropdown
} from "openstack-uicore-foundation/lib/components";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import moment from "moment-timezone";
import Select from "react-select";
import SummitEventBulkEditorItem from "./summit-event-bulk-editor-item";
import {
  MILLISECONDS_IN_SECOND,
  SECONDS_TO_MINUTES,
  TBALocation,
  TIME_23,
  TIME_59
} from "../../utils/constants";

import "../../styles/summit-event-bulk-editor.less";

class SummitEventBulkEditorForm extends React.Component {
  constructor(props) {
    super(props);
    this.onApplyChanges = this.onApplyChanges.bind(this);
    this.onApplyChangesAndPublish = this.onApplyChangesAndPublish.bind(this);
    this.onLocationChanged = this.onLocationChanged.bind(this);
    this.onTitleChanged = this.onTitleChanged.bind(this);
    this.onStartDateChanged = this.onStartDateChanged.bind(this);
    this.onEndDateChanged = this.onEndDateChanged.bind(this);
    this.onSelectedEvent = this.onSelectedEvent.bind(this);
    this.onBulkLocationChange = this.onBulkLocationChange.bind(this);
    this.onBulkSelectionPlanChange = this.onBulkSelectionPlanChange.bind(this);
    this.onBulkTypeChange = this.onBulkTypeChange.bind(this);
    this.handleChangeBulkStartDate = this.handleChangeBulkStartDate.bind(this);
    this.handleChangeBulkEndDate = this.handleChangeBulkEndDate.bind(this);
    this.onBulkActivityType = this.onBulkActivityType.bind(this);
    this.onBulkActivityCategory = this.onBulkActivityCategory.bind(this);
    this.onBulkDuration = this.onBulkDuration.bind(this);
    this.onBulkStreamingURL = this.onBulkStreamingURL.bind(this);
    this.onBulkStreamingType = this.onBulkStreamingType.bind(this);
    this.onBulkStreamIsSecure = this.onBulkStreamIsSecure.bind(this);
    this.onBulkMeetingURL = this.onBulkMeetingURL.bind(this);
    this.onBulkEtherpadURL = this.onBulkEtherpadURL.bind(this);
    this.onSelectionPlanChanged = this.onSelectionPlanChanged.bind(this);
    this.onActivityTypeLocalChanged =
      this.onActivityTypeLocalChanged.bind(this);
    this.onActivityCategoryLocalChanged =
      this.onActivityCategoryLocalChanged.bind(this);
    this.onDurationLocalChanged = this.onDurationLocalChanged.bind(this);
    this.onStreamingURLLocalChanged =
      this.onStreamingURLLocalChanged.bind(this);
    this.onStreamingTypeLocalChanged =
      this.onStreamingTypeLocalChanged.bind(this);
    this.onStreamIsSecureLocalChanged =
      this.onStreamIsSecureLocalChanged.bind(this);
    this.onMeetingURLLocalChanged = this.onMeetingURLLocalChanged.bind(this);
    this.onEtherpadURLLocalChanged = this.onEtherpadURLLocalChanged.bind(this);
    this.state = {
      currentBulkStartDate: null,
      currentBulkEndDate: null,
      currentBulkLocation: null,
      currentBulkSelectionPlan: null,
      currentBulkActivityType: null,
      currentBulkActivityCategory: null,
      currentBulkDuration: null,
      currentBulkStreamingURL: null,
      currentBulkStreamingType: null,
      currentBulkStreamIsSecure: null,
      currentBulkMeetingURL: null,
      currentBulkEtherpadURL: null
    };
  }

  onApplyChanges(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    const { currentSummit, events } = this.props;
    const invalidEvents = events.filter((event) => !event.is_valid);
    if (invalidEvents.length > 0) {
      Swal.fire({
        title: T.translate("bulk_actions_page.messages.validation_title"),
        text: T.translate("bulk_actions_page.messages.validation_message", {
          event: invalidEvents.length === 1 ? "event" : "events",
          event_id: invalidEvents.map((e) => e.id).join(", ")
        }),
        type: "warning"
      });
      return;
    }
    this.props.updateEvents(currentSummit.id, events);
  }

  onApplyChangesAndPublish(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    const { currentSummit, events } = this.props;
    const invalidEvents = events.filter((event) => !event.is_valid);
    if (invalidEvents.length > 0) {
      Swal.fire({
        title: T.translate("bulk_actions_page.messages.validation_title"),
        text: T.translate("bulk_actions_page.messages.validation_message", {
          event: invalidEvents.length === 1 ? "event" : "events",
          event_id: invalidEvents.map((e) => e.id).join(", ")
        }),
        type: "warning"
      });
      return;
    }
    this.props.updateAndPublishEvents(currentSummit.id, events);
  }

  onLocationChanged(idx, location, isValid) {
    const { events } = this.props;
    if (location == null) return;
    this.props.updateEventLocationLocal(events[idx], location, isValid);
  }

  onSelectionPlanChanged(idx, selectionPlan, isValid) {
    const { events } = this.props;
    if (selectionPlan == null) return;
    this.props.updateEventSelectionPlanLocal(
      events[idx],
      selectionPlan,
      isValid
    );
  }

  onTitleChanged(idx, title, isValid) {
    const { events } = this.props;
    this.props.updateEventTitleLocal(events[idx], title, isValid);
  }

  onStartDateChanged(idx, startDate, isValid) {
    const { events } = this.props;
    this.props.updateEventStartDateLocal(events[idx], startDate, isValid);
  }

  onEndDateChanged(idx, endDate, isValid) {
    const { events } = this.props;
    this.props.updateEventEndDateLocal(events[idx], endDate, isValid);
  }

  onActivityTypeLocalChanged(idx, activityType, isValid) {
    const { events } = this.props;
    this.props.updateEventActivityTypeLocal(events[idx], activityType, isValid);
  }

  onActivityCategoryLocalChanged(idx, activityCategory, isValid) {
    const { events } = this.props;
    this.props.updateEventActivityCategoryLocal(
      events[idx],
      activityCategory,
      isValid
    );
  }

  onDurationLocalChanged(idx, duration, isValid) {
    const { events } = this.props;
    this.props.updateEventDurationLocal(events[idx], duration, isValid);
  }

  onStreamingURLLocalChanged(idx, streamingURL, isValid) {
    const { events } = this.props;
    this.props.updateEventStreamingURLLocal(events[idx], streamingURL, isValid);
  }

  onStreamingTypeLocalChanged(idx, streamingType, isValid) {
    const { events } = this.props;
    this.props.updateEventStreamingTypeLocal(
      events[idx],
      streamingType,
      isValid
    );
  }

  onStreamIsSecureLocalChanged(idx, streamingIsSecure, isValid) {
    const { events } = this.props;
    this.props.updateEventStreamIsSecureLocal(
      events[idx],
      streamingIsSecure,
      isValid
    );
  }

  onMeetingURLLocalChanged(idx, meetingURL, isValid) {
    const { events } = this.props;
    this.props.updateEventMeetingURLLocal(events[idx], meetingURL, isValid);
  }

  onEtherpadURLLocalChanged(idx, etherpadURL, isValid) {
    const { events } = this.props;
    this.props.updateEventEtherpadURLLocal(events[idx], etherpadURL, isValid);
  }

  onSelectedEvent(event) {
    const { currentSummit } = this.props;
    this.props.history.push(
      `/app/summits/${currentSummit.id}/events/${event.id}`
    );
    return false;
  }

  // bulk controls handlers
  onBulkLocationChange(location) {
    this.setState({ ...this.state, currentBulkLocation: location });
    this.props.updateEventsLocationLocal(location);
  }

  onBulkSelectionPlanChange(option) {
    const selectionPlan = option.value;
    this.setState({ ...this.state, currentBulkSelectionPlan: selectionPlan });
    this.props.updateEventsSelectionPlanLocal(selectionPlan);
  }

  onBulkTypeChange(eventType) {
    this.props.updateEventsTypeLocal(eventType);
  }

  handleChangeBulkStartDate(ev) {
    let { value } = ev.target;
    value = value.valueOf() / MILLISECONDS_IN_SECOND;
    const { currentBulkEndDate, currentBulkDuration } = this.state;
    this.setState({ ...this.state, currentBulkStartDate: value }, () =>
      this.props.updateEventsStartDateLocal(value)
    );
    if (currentBulkEndDate) {
      const duration =
        currentBulkEndDate > value ? currentBulkEndDate - value : 0;
      this.setState(
        { ...this.state, currentBulkDuration: duration / SECONDS_TO_MINUTES },
        () => this.props.updateEventsDurationLocal(parseInt(duration))
      );
    } else if (currentBulkDuration) {
      const end_date = value + currentBulkDuration;
      this.setState({ ...this.state, currentBulkEndDate: end_date }, () =>
        this.props.updateEventsEndDateLocal(end_date)
      );
    }
  }

  handleChangeBulkEndDate(ev) {
    let { value } = ev.target;
    value = value.valueOf() / MILLISECONDS_IN_SECOND;
    const { currentBulkStartDate, currentBulkDuration } = this.state;
    this.setState({ ...this.state, currentBulkEndDate: value }, () =>
      this.props.updateEventsEndDateLocal(value)
    );
    if (currentBulkStartDate) {
      const duration =
        currentBulkStartDate < value ? value - currentBulkStartDate : 0;
      this.setState(
        { ...this.state, currentBulkDuration: duration / SECONDS_TO_MINUTES },
        () => this.props.updateEventsDurationLocal(parseInt(duration))
      );
    } else if (currentBulkDuration) {
      const start_date = value - currentBulkDuration;
      this.setState({ ...this.state, currentBulkStartDate: start_date }, () =>
        this.props.updateEventsStartDateLocal(start_date)
      );
    }
  }

  onBulkActivityType(ev) {
    const { value } = ev.target;
    this.setState({ ...this.state, currentBulkActivityType: value });
    this.props.updateEventsActivityTypeLocal(value);
  }

  onBulkActivityCategory(ev) {
    const { value } = ev.target;
    this.setState({ ...this.state, currentBulkActivityCategory: value });
    this.props.updateEventsActivityCategoryLocal(value);
  }

  onBulkDuration(ev) {
    const { value } = ev.target;
    const duration = Number.isInteger(parseInt(value)) ? parseInt(value) : null;
    const { currentBulkStartDate, currentBulkEndDate } = this.state;
    this.setState({ ...this.state, currentBulkDuration: duration }, () =>
      this.props.updateEventsDurationLocal(duration * SECONDS_TO_MINUTES)
    );
    if (duration !== null) {
      if (currentBulkStartDate) {
        const end_date = currentBulkStartDate + duration * SECONDS_TO_MINUTES;
        this.setState({ ...this.state, currentBulkEndDate: end_date }, () =>
          this.props.updateEventsEndDateLocal(end_date)
        );
      } else if (currentBulkEndDate) {
        const start_date = currentBulkEndDate - duration * SECONDS_TO_MINUTES;
        this.setState({ ...this.state, currentBulkStartDate: start_date }, () =>
          this.props.updateEventsStartDateLocal(start_date)
        );
      }
    }
  }

  onBulkStreamingURL(ev) {
    const { value } = ev.target;
    this.props.updateEventsStreamingURLLocal(value);
  }

  onBulkStreamingType(ev) {
    const { value } = ev.target;
    this.setState({ ...this.state, currentBulkStreamingType: value });
    this.props.updateEventsStreamingTypeLocal(value);
  }

  onBulkStreamIsSecure(ev) {
    const { value } = ev.target;
    this.setState({ ...this.state, currentBulkStreamIsSecure: value });
    this.props.updateEventStreamIsSecureLocal(value);
  }

  onBulkMeetingURL(ev) {
    const { value } = ev.target;
    this.props.updateEventsMeetingURLLocal(value);
  }

  onBulkEtherpadURL(ev) {
    const { value } = ev.target;
    this.props.updateEventsEtherpadURLLocal(value);
  }

  render() {
    const { events, currentSummit } = this.props;
    const currentSummitStartDate = moment
      .tz(
        currentSummit.start_date * MILLISECONDS_IN_SECOND,
        currentSummit.time_zone.name
      )
      .hour(0)
      .minute(0)
      .second(0);
    const currentSummitEndDate = moment
      .tz(
        currentSummit.end_date * MILLISECONDS_IN_SECOND,
        currentSummit.time_zone.name
      )
      .hour(TIME_23)
      .minute(TIME_59)
      .second(TIME_59);

    if (!currentSummit) return null;
    const venuesOptions = [{ value: TBALocation, label: TBALocation.name }];

    const selectionPlanOptions = [];

    for (let i = 0; i < currentSummit.locations.length; i++) {
      const location = currentSummit.locations[i];
      if (location.class_name !== "SummitVenue") continue;
      const option = { value: location, label: location.name };
      venuesOptions.push(option);
      if (!location.hasOwnProperty("rooms")) continue;
      for (let j = 0; j < location.rooms.length; j++) {
        const subOption = {
          value: location.rooms[j],
          label: location.rooms[j].name
        };
        venuesOptions.push(subOption);
      }
    }

    for (let i = 0; i < currentSummit.selection_plans.length; i++) {
      const selection_plan = currentSummit.selection_plans[i];
      const option = { value: selection_plan, label: selection_plan.name };
      selectionPlanOptions.push(option);
    }

    const event_type_ddl = currentSummit.event_types
      ?.sort((a, b) => a.order - b.order)
      .map((t) => ({ label: t.name, value: t.id }));
    const track_ddl = currentSummit.tracks
      ?.sort((a, b) => a.order - b.order)
      .map((t) => ({ label: t.name, value: t.id }));
    const streaming_type_ddl = [
      { label: "LIVE", value: "LIVE" },
      { label: "VOD", value: "VOD" }
    ];
    const stream_is_secure_ddl = [
      { label: "True", value: true },
      { label: "False", value: false }
    ];

    const currentBulkLocation = venuesOptions
      .filter(
        (option) =>
          this.state.currentBulkLocation != null &&
          option.value.id === this.state.currentBulkLocation.id
      )
      .shift()?.value;
    const currentBulkSelectionPlan = selectionPlanOptions
      .filter(
        (option) =>
          this.state.currentBulkSelectionPlan != null &&
          option.value.id === this.state.currentBulkSelectionPlan.id
      )
      .shift();
    const {
      currentBulkStartDate,
      currentBulkEndDate,
      currentBulkActivityType,
      currentBulkActivityCategory,
      currentBulkDuration,
      currentBulkStreamingURL,
      currentBulkStreamingType,
      currentBulkStreamIsSecure,
      currentBulkMeetingURL,
      currentBulkEtherpadURL
    } = this.state;

    return (
      <form className="bulk-edit-form">
        <div className="bulk-edit-table">
          <div className="bulk-edit-row">
            <div className="bulk-edit-col-empty">&nbsp;</div>
            <div className="bulk-edit-col">
              <Select
                placeholder={T.translate(
                  "schedule.placeholders.select_presentation_selection_plan"
                )}
                className="selection_plan_selector_bulk"
                name="form-field-name"
                value={currentBulkSelectionPlan}
                onChange={this.onBulkSelectionPlanChange}
                options={selectionPlanOptions}
              />
            </div>
            <div className="bulk-edit-col">
              <SummitVenuesSelect
                currentValue={currentBulkLocation}
                onVenueChanged={this.onBulkLocationChange}
                venues={venuesOptions}
                placeholder={T.translate("schedule.placeholders.select_venue")}
              />
            </div>
            <div className="bulk-edit-col">
              <DateTimePicker
                id="start_date"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "bulk_actions_page.placeholders.start_date"
                  )
                }}
                timezone={currentSummit.time_zone.name}
                value={epochToMomentTimeZone(
                  currentBulkStartDate,
                  currentSummit.time_zone_id
                )}
                timeConstraints={{ hours: { min: 7, max: 22 } }}
                validation={{
                  before:
                    currentBulkEndDate ||
                    currentSummitEndDate.valueOf() / MILLISECONDS_IN_SECOND,
                  after:
                    currentSummitStartDate.valueOf() / MILLISECONDS_IN_SECOND
                }}
                onChange={this.handleChangeBulkStartDate}
                className="bulk-edit-date-picker"
              />
            </div>
            <div className="bulk-edit-col">
              <DateTimePicker
                id="end_date"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                timeConstraints={{ hours: { min: 7, max: 22 } }}
                inputProps={{
                  placeholder: T.translate(
                    "bulk_actions_page.placeholders.end_date"
                  )
                }}
                timezone={currentSummit.time_zone.name}
                value={epochToMomentTimeZone(
                  currentBulkEndDate,
                  currentSummit.time_zone_id
                )}
                validation={{
                  before:
                    currentSummitEndDate.valueOf() / MILLISECONDS_IN_SECOND,
                  after:
                    currentBulkStartDate ||
                    currentSummitStartDate.valueOf() / MILLISECONDS_IN_SECOND
                }}
                onChange={this.handleChangeBulkEndDate}
                className="bulk-edit-date-picker"
              />
            </div>
            <div className="bulk-edit-col">
              <Dropdown
                id="type_id"
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.event_type"
                )}
                value={currentBulkActivityType}
                onChange={this.onBulkActivityType}
                options={event_type_ddl}
              />
            </div>
            <div className="bulk-edit-col">
              <Dropdown
                id="track_id"
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.track"
                )}
                value={currentBulkActivityCategory}
                onChange={this.onBulkActivityCategory}
                options={track_ddl}
              />
            </div>
            <div className="bulk-edit-col">
              <Input
                id="duration"
                type="number"
                min="0"
                step="1"
                pattern="\d+"
                value={currentBulkDuration}
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.duration"
                )}
                onChange={this.onBulkDuration}
              />
            </div>
            <div className="bulk-edit-col">
              <Input
                id="streaming_url"
                value={currentBulkStreamingURL}
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.streaming_url"
                )}
                onChange={this.onBulkStreamingURL}
              />
            </div>
            <div className="bulk-edit-col">
              <Dropdown
                id="streaming_type"
                value={currentBulkStreamingType}
                onChange={this.onBulkStreamingType}
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.streaming_type"
                )}
                options={streaming_type_ddl}
              />
            </div>
            <div className="bulk-edit-col">
              <Dropdown
                id="stream_is_secure"
                value={currentBulkStreamIsSecure}
                onChange={this.onBulkStreamIsSecure}
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.stream_is_secure"
                )}
                options={stream_is_secure_ddl}
              />
            </div>
            <div className="bulk-edit-col">
              <Input
                id="meeting_url"
                value={currentBulkMeetingURL}
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.meeting_url"
                )}
                onChange={this.onBulkMeetingURL}
              />
            </div>
            <div className="bulk-edit-col">
              <Input
                id="etherpad_link"
                value={currentBulkEtherpadURL}
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.etherpad_link"
                )}
                onChange={this.onBulkEtherpadURL}
              />
            </div>
          </div>
          <div className="bulk-edit-row">
            <div className="bulk-edit-col-id bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_id_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_name_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_selection_plan_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_location_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_start_date_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_end_date_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_activity_type_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_activity_category_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_duration_label")} (minutes)
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_streaming_url_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_streaming_type_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_stream_is_secure_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_meeting_url_label")}
            </div>
            <div className="bulk-edit-col bulk-edit-col-title">
              {T.translate("bulk_actions_page.event_etherpad_link_label")}
            </div>
          </div>
          {events.map((event, idx) => (
            <SummitEventBulkEditorItem
              key={`item-${event.id}`}
              index={idx}
              venuesOptions={venuesOptions}
              activityTypeOptions={event_type_ddl}
              activtyCategoryOptions={track_ddl}
              streamingTypeOptions={streaming_type_ddl}
              streamIsSecureOptions={stream_is_secure_ddl}
              selectionPlanOptions={selectionPlanOptions}
              event={event}
              currentSummit={currentSummit}
              onLocationChanged={this.onLocationChanged}
              onTitleChanged={this.onTitleChanged}
              onStartDateChanged={this.onStartDateChanged}
              onEndDateChanged={this.onEndDateChanged}
              onSelectedEvent={this.onSelectedEvent}
              onSelectionPlanChanged={this.onSelectionPlanChanged}
              onActivityTypeLocalChanged={this.onActivityTypeLocalChanged}
              onActivityCategoryLocalChanged={
                this.onActivityCategoryLocalChanged
              }
              onDurationLocalChanged={this.onDurationLocalChanged}
              onStreamingURLLocalChanged={this.onStreamingURLLocalChanged}
              onStreamingTypeLocalChanged={this.onStreamingTypeLocalChanged}
              onStreamIsSecureLocalChanged={this.onStreamIsSecureLocalChanged}
              onMeetingURLLocalChanged={this.onMeetingURLLocalChanged}
              onEtherpadURLLocalChanged={this.onEtherpadURLLocalChanged}
            />
          ))}
        </div>
        <div className="row bulk-edit-buttons">
          <div className="col-md-12 col-form-buttons">
            <button
              className="btn btn-primary pull-left"
              onClick={this.onApplyChanges}
            >
              {T.translate("bulk_actions_page.btn_apply_changes")}
            </button>
            <button
              className="btn btn-success pull-left"
              onClick={this.onApplyChangesAndPublish}
            >
              {T.translate("bulk_actions_page.btn_apply_publish_changes")}
            </button>
          </div>
        </div>
      </form>
    );
  }
}

export default SummitEventBulkEditorForm;
