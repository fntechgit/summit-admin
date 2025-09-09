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
import { Dropdown, Input } from "openstack-uicore-foundation/lib/components";
import { isEmpty, scrollToError, shallowEqual } from "../../utils/methods";

class EventRSVPForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      file: null,
      errors: props.errors
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
    const entity = { ...this.state.entity };
    const errors = { ...this.state.errors };
    const { value, id } = ev.target;

    errors[id] = "";
    entity[id] = value;

    this.setState({ entity, errors });
  }

  handleSubmit(ev) {
    const { entity } = this.state;
    ev.preventDefault();
    this.props.onSubmit(entity);
  }

  render() {
    const { entity } = this.state;

    const seat_type_ddl = [
      { label: "Regular", value: "Regular" },
      { label: "WaitList", value: "WaitList" }
    ];

    const status_ddl = [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" }
    ];

    return (
      <form className="event-rsvp-form">
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-6">
            <label> {T.translate("edit_event_rsvp.attendee_full_name")}</label>
            <Input
              id="attendee_full_name"
              value={entity.attendee_full_name}
              onChange={this.handleChange}
              className="form-control"
              disabled
            />
          </div>
          <div className="col-md-6">
            <label> {T.translate("edit_event_rsvp.attendee_email")}</label>
            <Input
              id="attendee_email"
              value={entity.attendee_email}
              onChange={this.handleChange}
              className="form-control"
              disabled
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label> {T.translate("edit_event_rsvp.confirmation_number")}</label>
            <Input
              id="confirmation_number"
              value={entity.confirmation_number}
              onChange={this.handleChange}
              className="form-control"
              disabled
            />
          </div>
          <div className="col-md-6">
            <label> {T.translate("edit_event_rsvp.action_source")}</label>
            <Input
              id="action_source"
              value={entity.action_source}
              onChange={this.handleChange}
              className="form-control"
              disabled
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-4">
            <label> {T.translate("edit_event_rsvp.seat_type")}</label>
            <Dropdown
              id="seat_type"
              key="seat_type_ddl"
              value={entity.seat_type}
              placeholder={T.translate(
                "edit_event_rsvp.placeholders.seat_type"
              )}
              options={seat_type_ddl}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_event_rsvp.status")}</label>
            <Dropdown
              id="status"
              key="status_ddl"
              value={entity.status}
              placeholder={T.translate("edit_event_rsvp.placeholders.status")}
              options={status_ddl}
              onChange={this.handleChange}
            />
          </div>
        </div>

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

export default EventRSVPForm;
