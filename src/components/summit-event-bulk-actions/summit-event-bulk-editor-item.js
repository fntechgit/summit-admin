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
import { FormGroup, FormControl } from "react-bootstrap";
import {
  DateTimePicker,
  SummitVenuesSelect,
  Dropdown
} from "openstack-uicore-foundation/lib/components";
import { SummitEvent } from "openstack-uicore-foundation/lib/models";
import moment from "moment-timezone";
import T from "i18n-react/dist/i18n-react";
import Select from "react-select";
import { adjustEventDuration } from "../../utils/methods";
import {
  MILLISECONDS_IN_SECOND,
  SECONDS_TO_MINUTES,
  TIME_23_HOURS,
  TIME_59_MINS,
  TIME_59_SECS
} from "../../utils/constants";

class SummitEventBulkEditorItem extends React.Component {
  constructor(props) {
    super(props);
    this.onTitleChanged = this.onTitleChanged.bind(this);
    this.onLocationChanged = this.onLocationChanged.bind(this);
    this.onSelectedEvent = this.onSelectedEvent.bind(this);
    this.onSelectionPlanChanged = this.onSelectionPlanChanged.bind(this);
    this.onActivityTypeLocalChanged =
      this.onActivityTypeLocalChanged.bind(this);
    this.onActivityCategoryLocalChanged =
      this.onActivityCategoryLocalChanged.bind(this);
    this.onStreamingURLLocalChanged =
      this.onStreamingURLLocalChanged.bind(this);
    this.onStreamingTypeLocalChanged =
      this.onStreamingTypeLocalChanged.bind(this);
    this.onStreamIsSecureLocalChanged =
      this.onStreamIsSecureLocalChanged.bind(this);
    this.onMeetingURLLocalChanged = this.onMeetingURLLocalChanged.bind(this);
    this.onEtherpadURLLocalChanged = this.onEtherpadURLLocalChanged.bind(this);
    this.onTimeLocalChanged = this.onTimeLocalChanged.bind(this);
  }

  onSelectedEvent(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.props.onSelectedEvent(this.props.event);
  }

  getFormattedTime(atime) {
    if (atime == null) return "";
    if (!atime) return atime;
    atime *= MILLISECONDS_IN_SECOND;
    return moment(atime).tz(this.props.currentSummit.time_zone.name);
  }

  getValidationEventTitle() {
    const { event, currentSummit } = this.props;
    const eventModel = new SummitEvent(event, currentSummit);
    const isValid = eventModel.isValidTitle(event.title);
    return isValid ? "success" : "warning";
  }

  getValidationEventSelectionPlan() {
    return null;
  }

  getValidationStateVenue() {
    return null;
  }

  getValidationStartDate() {
    const { event, currentSummit } = this.props;
    const eventModel = new SummitEvent(event, currentSummit);
    const isValid = eventModel.isValidStartDate(event.start_date);
    return isValid ? "success" : "warning";
  }

  getValidationEndDate() {
    const { event, currentSummit } = this.props;
    const eventModel = new SummitEvent(event, currentSummit);
    const isValid = eventModel.isValidEndDate(event.end_date);
    return isValid ? "success" : "warning";
  }

  onTitleChanged(ev) {
    const title = ev.target.value.trim();
    const { event, currentSummit } = this.props;
    const eventModel = new SummitEvent(event, currentSummit);
    this.props.onTitleChanged(
      this.props.index,
      title,
      eventModel.isValidTitle(title)
    );
  }

  onLocationChanged(location) {
    const isValid = location != null;
    this.props.onLocationChanged(this.props.index, location, isValid);
  }

  onSelectionPlanChanged(option) {
    const selectionPlan = option.value;
    const isValid = selectionPlan != null;
    this.props.onSelectionPlanChanged(this.props.index, selectionPlan, isValid);
  }

  onActivityTypeLocalChanged(ev) {
    const activityType = ev.target.value;
    const isValid = activityType != null;
    this.props.onActivityTypeLocalChanged(
      this.props.index,
      activityType,
      isValid
    );
  }

  onActivityCategoryLocalChanged(ev) {
    const activityCategory = ev.target.value;
    const isValid = activityCategory != null;
    this.props.onActivityCategoryLocalChanged(
      this.props.index,
      activityCategory,
      isValid
    );
  }

  onTimeLocalChanged(ev) {
    let { event, currentSummit } = this.props;
    event = adjustEventDuration(ev, event);
    const eventModel = new SummitEvent(event, currentSummit);

    if (event.start_date)
      this.props.onStartDateChanged(
        this.props.index,
        event.start_date,
        eventModel.isValidEndDate(event.start_date)
      );
    if (event.end_date)
      this.props.onEndDateChanged(
        this.props.index,
        event.end_date,
        eventModel.isValidStartDate(event.end_date)
      );
    if (event.duration) {
      const isValid = typeof event.duration === "number";
      this.props.onDurationLocalChanged(
        this.props.index,
        event.duration,
        isValid
      );
    }
  }

  onStreamingURLLocalChanged(ev) {
    const streamingURL = ev.target.value;
    const isValid = streamingURL != null;
    this.props.onStreamingURLLocalChanged(
      this.props.index,
      streamingURL,
      isValid
    );
  }

  onStreamingTypeLocalChanged(ev) {
    const { streamingTypeOptions } = this.props;
    const streamingType = ev.target.value;
    const isValid = streamingTypeOptions.some(
      (st) => streamingType === st.value
    );
    this.props.onStreamingTypeLocalChanged(
      this.props.index,
      streamingType,
      isValid
    );
  }

  onStreamIsSecureLocalChanged(ev) {
    const { streamIsSecureOptions } = this.props;
    const streamIsSecure = ev.target.value;
    const isValid = streamIsSecureOptions.some(
      (st) => streamIsSecure === st.value
    );
    this.props.onStreamIsSecureLocalChanged(
      this.props.index,
      streamIsSecure,
      isValid
    );
  }

  onMeetingURLLocalChanged(ev) {
    const meetingURL = ev.target.value;
    const isValid = meetingURL != null;
    this.props.onMeetingURLLocalChanged(this.props.index, meetingURL, isValid);
  }

  onEtherpadURLLocalChanged(ev) {
    const etherpadURL = ev.target.value;
    const isValid = etherpadURL != null;
    this.props.onEtherpadURLLocalChanged(
      this.props.index,
      etherpadURL,
      isValid
    );
  }

  render() {
    const {
      event,
      currentSummit,
      venuesOptions,
      selectionPlanOptions,
      activityTypeOptions,
      activtyCategoryOptions,
      streamingTypeOptions,
      streamIsSecureOptions
    } = this.props;
    const currentLocation = venuesOptions
      .filter((option) => option.value.id === event.location_id)
      .shift()?.value;
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
      .hour(TIME_23_HOURS)
      .minute(TIME_59_MINS)
      .second(TIME_59_SECS);
    const currentSelectionPlan = selectionPlanOptions
      .filter((option) => option.value.id === event.selection_plan_id)
      .shift();

    return (
      <div className="bulk-edit-row event-bulk-editor-item">
        <div className="bulk-edit-col-id">
          <a
            className="event-edit"
            title={T.translate("bulk_actions_page.titles.view_event")}
            onClick={this.onSelectedEvent}
            href="#"
          >
            {event.id}
          </a>
        </div>
        <div className="bulk-edit-col">
          <FormGroup validationState={this.getValidationEventTitle()}>
            <FormControl
              type="text"
              placeholder={T.translate(
                "bulk_actions_page.placeholders.event_title"
              )}
              onChange={this.onTitleChanged}
              defaultValue={event.title}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup validationState={this.getValidationEventSelectionPlan()}>
            <Select
              placeholder={T.translate(
                "schedule.placeholders.select_presentation_selection_plan"
              )}
              className="selection_plan_selector"
              name="form-field-name"
              value={currentSelectionPlan}
              onChange={this.onSelectionPlanChanged}
              options={selectionPlanOptions}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup validationState={this.getValidationStateVenue()}>
            <SummitVenuesSelect
              onVenueChanged={this.onLocationChanged}
              currentValue={currentLocation}
              venues={venuesOptions}
              placeholder={T.translate("schedule.placeholders.select_venue")}
              styles={{
                container: (baseStyles) => ({
                  ...baseStyles,
                  position: "initial"
                })
              }}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup validationState={this.getValidationStartDate()}>
            <DateTimePicker
              id="start_date"
              format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
              inputProps={{
                placeholder: T.translate(
                  "bulk_actions_page.placeholders.start_date"
                )
              }}
              timezone={currentSummit.time_zone.name}
              timeConstraints={{ hours: { min: 7, max: 22 } }}
              validation={{
                after:
                  currentSummitStartDate.valueOf() / MILLISECONDS_IN_SECOND,
                before: currentSummitEndDate.valueOf() / MILLISECONDS_IN_SECOND
              }}
              onChange={this.onTimeLocalChanged}
              value={this.getFormattedTime(event.start_date)}
              className="bulk-edit-date-picker"
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup validationState={this.getValidationEndDate()}>
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
              validation={{
                after:
                  currentSummitStartDate.valueOf() / MILLISECONDS_IN_SECOND,
                before: currentSummitEndDate.valueOf() / MILLISECONDS_IN_SECOND
              }}
              onChange={this.onTimeLocalChanged}
              value={this.getFormattedTime(event.end_date)}
              className="bulk-edit-date-picker"
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <Dropdown
              id="type_id"
              placeholder={T.translate(
                "bulk_actions_page.placeholders.event_type"
              )}
              value={event.type_id}
              onChange={this.onActivityTypeLocalChanged}
              options={activityTypeOptions}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <Dropdown
              id="track_id"
              placeholder={T.translate("bulk_actions_page.placeholders.track")}
              value={event.track_id}
              onChange={this.onActivityCategoryLocalChanged}
              options={activtyCategoryOptions}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <FormControl
              id="duration"
              type="number"
              placeholder={T.translate(
                "bulk_actions_page.placeholders.duration"
              )}
              onChange={this.onTimeLocalChanged}
              value={
                event.duration === 0
                  ? ""
                  : (event.duration / SECONDS_TO_MINUTES).toString()
              }
              min="0"
              step="1"
              pattern="\d+"
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <FormControl
              type="text"
              placeholder={T.translate(
                "bulk_actions_page.placeholders.streaming_url"
              )}
              onChange={this.onStreamingURLLocalChanged}
              defaultValue={event.streaming_url}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <Dropdown
              id="streaming_type"
              value={event.streaming_type}
              onChange={this.onStreamingTypeLocalChanged}
              placeholder={T.translate(
                "bulk_actions_page.placeholders.streaming_type"
              )}
              options={streamingTypeOptions}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <Dropdown
              id="streaming_type"
              value={event.stream_is_secure}
              onChange={this.onStreamIsSecureLocalChanged}
              placeholder={T.translate(
                "bulk_actions_page.placeholders.stream_is_secure"
              )}
              options={streamIsSecureOptions}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <FormControl
              type="text"
              placeholder={T.translate(
                "bulk_actions_page.placeholders.meeting_url"
              )}
              onChange={this.onMeetingURLLocalChanged}
              defaultValue={event.meeting_url}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
        <div className="bulk-edit-col">
          <FormGroup>
            <FormControl
              type="text"
              placeholder={T.translate(
                "bulk_actions_page.placeholders.etherpad_link"
              )}
              onChange={this.onEtherpadURLLocalChanged}
              defaultValue={event.etherpad_link}
            />
            <FormControl.Feedback />
          </FormGroup>
        </div>
      </div>
    );
  }
}

export default SummitEventBulkEditorItem;
