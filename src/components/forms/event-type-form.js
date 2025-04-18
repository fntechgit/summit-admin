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
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import {
  Dropdown,
  Input,
  SimpleLinkList,
  Panel,
  TicketTypesInput
} from "openstack-uicore-foundation/lib/components";
import {
  isEmpty,
  scrollToError,
  shallowEqual,
  hasErrors
} from "../../utils/methods";

class EventTypeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      errors: props.errors,
      showSection: "main"
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleShowAlwaysChange = this.handleShowAlwaysChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMediaUploadUnLink = this.handleMediaUploadUnLink.bind(this);
    this.handleMediaUploadLink = this.handleMediaUploadLink.bind(this);
  }

  componentDidUpdate(prevProps) {
    const state = {};
    scrollToError(this.props.errors);

    if (!shallowEqual(prevProps.entity, this.props.entity)) {
      state.entity = { ...this.props.entity };
      state.errors = {};
    }

    if (!shallowEqual(prevProps.errors, this.props.errors)) {
      state.errors = { ...this.props.errors };
    }

    if (!isEmpty(state)) {
      this.setState({ ...this.state, ...state });
    }
  }

  handleChange(ev) {
    const newEntity = { ...this.state.entity };
    const newErrors = { ...this.state.errors };
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (ev.target.type === "number") {
      value = parseInt(ev.target.value);
    }

    newErrors[id] = "";
    newEntity[id] = value;
    this.setState({ entity: newEntity, errors: newErrors });
  }

  handleShowAlwaysChange(ev) {
    const newEntity = { ...this.state.entity };
    const value = ev.target.checked;

    // if true then we clear allowed ticket types
    if (value) {
      newEntity.allowed_ticket_types = [];
    }

    newEntity.show_always_on_schedule = value;
    this.setState({ entity: newEntity });
  }

  handleSubmit(ev) {
    ev.preventDefault();

    this.props.onSubmit(this.state.entity);
  }

  handleMediaUploadLink(value) {
    const { entity } = this.state;
    this.props.onMediaUploadLink(value, entity.id);
  }

  handleMediaUploadUnLink(valueId) {
    const { entity } = this.state;
    this.props.onMediaUploadUnLink(valueId, entity.id);
  }

  toggleSection(section, ev) {
    const { showSection } = this.state;
    const newShowSection = showSection === section ? "main" : section;
    ev.preventDefault();

    this.setState({ showSection: newShowSection });
  }

  render() {
    const { entity, errors, showSection } = this.state;
    const { getMediaUploads, currentSummit } = this.props;
    const event_types_ddl = [
      { label: "Presentation", value: "PRESENTATION_TYPE" },
      { label: "Event", value: "EVENT_TYPE" }
    ];

    const blackout_times_ddl = [
      {
        label: T.translate("edit_event_type.blackout_time_final"),
        value: "Final"
      },
      {
        label: T.translate("edit_event_type.blackout_time_proposed"),
        value: "Proposed"
      },
      { label: T.translate("edit_event_type.blackout_time_all"), value: "All" },
      {
        label: T.translate("edit_event_type.blackout_time_none"),
        value: "None"
      }
    ];

    const allowedGroupsColumns = [
      { columnKey: "name", value: T.translate("general.name") },
      { columnKey: "type_name", value: T.translate("general.type") },
      {
        columnKey: "mandatory_text",
        value: T.translate("media_upload.is_mandatory")
      },
      {
        columnKey: "max_size",
        value: T.translate("media_upload.max_size_simple")
      }
    ];

    const allowedGroupsOptions = {
      title: T.translate("edit_event_type.media_upload_types"),
      valueKey: "id",
      labelKey: "name",
      actions: {
        search: getMediaUploads,
        delete: { onClick: this.handleMediaUploadUnLink },
        add: { onClick: this.handleMediaUploadLink }
      }
    };

    return (
      <form className="event-type-form">
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-4">
            <label> {T.translate("edit_event_type.class")} *</label>
            <Dropdown
              id="class_name"
              value={entity.class_name}
              placeholder={T.translate(
                "edit_event_type.placeholders.select_class"
              )}
              options={event_types_ddl}
              onChange={this.handleChange}
              disabled={entity.id !== 0}
            />
          </div>

          {entity.class_name === "EVENT_TYPE" && (
            <div className="col-md-4 checkboxes-div">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="allows_attachment"
                  checked={entity.allows_attachment}
                  onChange={this.handleChange}
                  className="form-check-input"
                />
                <label className="form-check-label" htmlFor="allows_attachment">
                  {T.translate("edit_event_type.allows_attachment")}
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="row form-group">
          <div className="col-md-4">
            <label> {T.translate("edit_event_type.name")} *</label>
            <Input
              id="name"
              value={entity.name}
              onChange={this.handleChange}
              className="form-control"
              error={hasErrors("name", errors)}
            />
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_event_type.color")}</label>
            <Input
              id="color"
              type="color"
              value={entity.color}
              onChange={this.handleChange}
              className="form-control"
              error={hasErrors("color", errors)}
            />
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_event_type.black_out_times")}</label>
            <Dropdown
              id="black_out_times"
              value={entity.black_out_times}
              placeholder={T.translate("edit_event_type.black_out_times")}
              options={blackout_times_ddl}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <div className="row form-group checkboxes-div">
          <div className="col-md-4">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="use_sponsors"
                checked={entity.use_sponsors}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="use_sponsors">
                {T.translate("edit_event_type.use_sponsors")}
              </label>
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="are_sponsors_mandatory"
                checked={entity.are_sponsors_mandatory}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label
                className="form-check-label"
                htmlFor="are_sponsors_mandatory"
              >
                {T.translate("edit_event_type.are_sponsors_mandatory")}
              </label>
            </div>
          </div>
          {entity.class_name === "PRESENTATION_TYPE" && (
            <div className="col-md-4">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="allows_speaker_event_collision"
                  checked={entity.allows_speaker_event_collision}
                  onChange={this.handleChange}
                  className="form-check-input"
                />
                <label
                  className="form-check-label"
                  htmlFor="allows_speaker_event_collision"
                >
                  {T.translate(
                    "edit_event_type.allows_speaker_event_collision"
                  )}
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="row form-group checkboxes-div">
          <div className="col-md-4">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="allows_location"
                checked={entity.allows_location}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="allows_location">
                {T.translate("edit_event_type.allows_location")}
              </label>
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="allows_publishing_dates"
                checked={entity.allows_publishing_dates}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label
                className="form-check-label"
                htmlFor="allows_publishing_dates"
              >
                {T.translate("edit_event_type.allows_publishing_dates")}
              </label>
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="allows_location_timeframe_collision"
                checked={entity.allows_location_timeframe_collision}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label
                className="form-check-label"
                htmlFor="allows_location_timeframe_collision"
              >
                {T.translate(
                  "edit_event_type.allows_location_timeframe_collision"
                )}
              </label>
            </div>
          </div>
        </div>
        {entity.class_name === "PRESENTATION_TYPE" && (
          <div>
            <hr />
            <div className="row form-group checkboxes-div">
              <div className="col-md-4">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="use_speakers"
                    checked={entity.use_speakers}
                    onChange={this.handleChange}
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor="use_speakers">
                    {T.translate("edit_event_type.use_speakers")}
                  </label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="are_speakers_mandatory"
                    checked={entity.are_speakers_mandatory}
                    onChange={this.handleChange}
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="are_speakers_mandatory"
                  >
                    {T.translate("edit_event_type.are_speakers_mandatory")}
                  </label>
                </div>
              </div>
            </div>
            <div className="row form-group">
              <div className="col-md-4">
                <label> {T.translate("edit_event_type.min_speakers")}</label>
                <Input
                  id="min_speakers"
                  type="number"
                  value={entity.min_speakers}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("min_speakers", errors)}
                />
              </div>
              <div className="col-md-4">
                <label> {T.translate("edit_event_type.max_speakers")}</label>
                <Input
                  id="max_speakers"
                  type="number"
                  value={entity.max_speakers}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("max_speakers", errors)}
                />
              </div>
            </div>
            <hr />
            <div className="row form-group checkboxes-div">
              <div className="col-md-4">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="use_moderator"
                    checked={entity.use_moderator}
                    onChange={this.handleChange}
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor="use_moderator">
                    {T.translate("edit_event_type.use_moderator")}
                  </label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="is_moderator_mandatory"
                    checked={entity.is_moderator_mandatory}
                    onChange={this.handleChange}
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="is_moderator_mandatory"
                  >
                    {T.translate("edit_event_type.moderator_mandatory")}
                  </label>
                </div>
              </div>
            </div>
            <div className="row form-group">
              <div className="col-md-4">
                <label> {T.translate("edit_event_type.moderator_label")}</label>
                <Input
                  id="moderator_label"
                  value={entity.moderator_label}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("moderator_label", errors)}
                />
              </div>
              <div className="col-md-4">
                <label> {T.translate("edit_event_type.min_moderators")}</label>
                <Input
                  id="min_moderators"
                  type="number"
                  value={entity.min_moderators}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("min_moderators", errors)}
                />
              </div>
              <div className="col-md-4">
                <label> {T.translate("edit_event_type.max_moderators")}</label>
                <Input
                  id="max_moderators"
                  type="number"
                  value={entity.max_moderators}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("max_moderators", errors)}
                />
              </div>
            </div>
            <hr />
            <div className="row form-group checkboxes-div">
              <div className="col-md-4">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="allow_custom_ordering"
                    checked={entity.allow_custom_ordering}
                    onChange={this.handleChange}
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="allow_custom_ordering"
                  >
                    {T.translate("edit_event_type.allow_custom_ordering")}
                  </label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="allow_attendee_vote"
                    checked={entity.allow_attendee_vote}
                    onChange={this.handleChange}
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="allow_attendee_vote"
                  >
                    {T.translate("edit_event_type.allow_attendee_vote")}
                  </label>
                </div>
              </div>
            </div>
            <hr />
            <div className="row form-group">
              <div className="col-md-4">
                <label>
                  {" "}
                  {T.translate("edit_event_type.min_duration")}&nbsp;
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate(
                      "edit_event_type.time_restrictions_info"
                    )}
                  />
                </label>
                <Input
                  id="min_duration"
                  type="number"
                  value={entity.min_duration}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("min_duration", errors)}
                />
              </div>
              <div className="col-md-4">
                <label>
                  {" "}
                  {T.translate("edit_event_type.max_duration")}&nbsp;
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate(
                      "edit_event_type.time_restrictions_info"
                    )}
                  />
                </label>
                <Input
                  id="max_duration"
                  type="number"
                  value={entity.max_duration}
                  onChange={this.handleChange}
                  className="form-control"
                  error={hasErrors("max_duration", errors)}
                />
              </div>
            </div>
            {entity.id !== 0 && (
              <>
                <hr />
                <div className="row form-group">
                  <div className="col-md-12">
                    <SimpleLinkList
                      values={entity.allowed_media_upload_types}
                      columns={allowedGroupsColumns}
                      options={allowedGroupsOptions}
                    />
                  </div>
                </div>
                <hr />
              </>
            )}
          </div>
        )}
        <Panel
          show={showSection === "schedule_settings"}
          title={T.translate("edit_event_type.schedule_settings")}
          handleClick={this.toggleSection.bind(this, "schedule_settings")}
        >
          <div className="row form-group checkboxes-div">
            <div className="col-md-4">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="show_always_on_schedule"
                  checked={entity.show_always_on_schedule}
                  onChange={this.handleShowAlwaysChange}
                  className="form-check-input"
                />
                <label
                  className="form-check-label"
                  htmlFor="show_always_on_schedule"
                >
                  {T.translate("edit_event_type.show_always_on_schedule")}
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <label>
                {" "}
                {T.translate("edit_event_type.allowed_ticket_types")}
              </label>
              <TicketTypesInput
                id="allowed_ticket_types"
                value={entity?.allowed_ticket_types}
                placeholder={T.translate(
                  "edit_event_type.placeholders.allowed_ticket_types"
                )}
                summitId={currentSummit.id}
                onChange={this.handleChange}
                optionsLimit={100}
                disabled={!!entity.show_always_on_schedule}
                defaultOptions
                isMulti
              />
            </div>
          </div>
        </Panel>
        <div className="row">
          <div className="col-md-12 submit-buttons">
            <input
              type="button"
              onClick={this.handleSubmit}
              className="btn btn-primary pull-right"
              value={T.translate("general.save")}
            />
          </div>
        </div>
      </form>
    );
  }
}

export default EventTypeForm;
