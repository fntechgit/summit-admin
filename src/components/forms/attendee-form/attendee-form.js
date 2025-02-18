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
  MemberInput,
  AttendeeInput,
  Input,
  Panel,
  TagInput,
  Dropdown
} from "openstack-uicore-foundation/lib/components";
import ExtraQuestionsForm from "openstack-uicore-foundation/lib/components/extra-questions";
import QuestionsSet from "openstack-uicore-foundation/lib/utils/questions-set";
import TicketComponent from "./ticket-component";
import OrderComponent from "./order-component";
import RsvpComponent from "./rsvp-component";
import { AffiliationsTable } from "../../tables/affiliationstable";
import { isEmpty, scrollToError, shallowEqual } from "../../../utils/methods";
import Notes from "../../notes";
import CopyClipboard from "../../buttons/copy-clipboard";
import { MILLISECONDS_IN_SECOND } from "../../../utils/constants";

class AttendeeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      originalEntity: { ...props.entity },
      errors: props.errors,
      showSection: "main"
    };

    this.formRef = React.createRef();

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.triggerFormSubmit = this.triggerFormSubmit.bind(this);
    this.removeUnchangedFields = this.removeUnchangedFields.bind(this);
  }

  componentDidUpdate(prevProps) {
    const state = {};
    scrollToError(this.props.errors);

    if (!shallowEqual(prevProps.entity, this.props.entity)) {
      state.entity = { ...this.props.entity };
      state.originalEntity = { ...this.props.entity };
      state.errors = {};
    }

    if (!shallowEqual(prevProps.errors, this.props.errors)) {
      state.errors = { ...this.props.errors };
    }

    if (!isEmpty(state)) {
      this.setState({ ...this.state, ...state });
    }
  }

  toggleSection(section, ev) {
    const { showSection } = this.state;
    const newShowSection = showSection === section ? "main" : section;
    ev.preventDefault();

    this.setState({ showSection: newShowSection });
  }

  handleChange(ev) {
    const entity = { ...this.state.entity };
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (ev.target.type === "number") {
      value = parseInt(ev.target.value);
    }

    if (ev.target.type === "datetime") {
      value = value.valueOf() / MILLISECONDS_IN_SECOND;
    }

    if (id === "member") {
      entity.email = value?.email || "";
      entity.first_name = value?.first_name || "";
      entity.last_name = value?.last_name || "";
    }

    entity[id] = value;
    this.setState({ entity, errors: {} });
  }

  removeUnchangedFields(entity, originalEntity) {
    const copyOfEntity = { ...entity };

    const fields = [
      "summit_hall_checked_in",
      "disclaimer_accepted",
      "has_virtual_check_in",
      "first_name",
      "last_name",
      "company",
      "shared_contact_info",
      "admin_notes",
      "email"
    ];

    fields.forEach((f) => {
      if (copyOfEntity[f] === originalEntity[f]) {
        // field dint change , so remove it from submit
        delete copyOfEntity[f];
      }
    });

    return copyOfEntity;
  }

  triggerFormSubmit() {
    if (!this.validate()) return false;

    // check current ( could not be rendered)
    if (this.formRef.current) {
      this.formRef.current.doSubmit();
      return true;
    }

    // do regular submit

    const { originalEntity, entity } = this.state;

    if (entity.extra_questions) {
      entity.extra_questions = entity.extra_questions.map((q) => ({
        question_id: q.question_id,
        answer: q.value
      }));
    }

    this.props.onSubmit(this.removeUnchangedFields(entity, originalEntity));

    return true;
  }

  handleSubmit(formValues) {
    const qs = new QuestionsSet(this.state.entity.allowed_extra_questions);
    const formattedAnswers = [];

    Object.keys(formValues).map((name) => {
      const question = qs.getQuestionByName(name);
      const newQuestion = {
        question_id: question.id,
        answer: `${formValues[name]}`
      };
      formattedAnswers.push(newQuestion);
    });

    this.setState(
      {
        ...this.state,
        entity: { ...this.state.entity, extra_questions: formattedAnswers }
      },
      () => {
        const { originalEntity, entity } = this.state;
        this.props.onSubmit(this.removeUnchangedFields(entity, originalEntity));
      }
    );
  }

  handleSpeakerLink(speaker_id, ev) {
    const { history } = this.props;
    ev.preventDefault();

    history.push(`/app/speakers/${speaker_id}`);
  }

  hasErrors(field) {
    const { errors } = this.state;
    if (field in errors) {
      return errors[field];
    }

    return "";
  }

  handleNewTag(newTag) {
    this.setState({
      ...this.state,
      entity: {
        ...this.state.entity,
        tags: [...this.state.entity.tags, { tag: newTag }]
      }
    });
  }

  validate = () => {
    const { entity, errors } = this.state;
    const required = ["first_name", "last_name", "email"];

    if (!entity.member) {
      required.forEach((fieldId) => {
        if (!entity[fieldId]) {
          errors[fieldId] = "This field is required";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return false;
    }

    return true;
  };

  render() {
    const { entity, showSection } = this.state;
    const { currentSummit } = this.props;
    const disableMemberInput = !entity.member && entity.email;

    return (
      <>
        {/* First Form ( Main Attendee Form ) */}
        <form className="summit-attendee-form">
          <input type="hidden" id="id" value={entity.id} />
          {entity.speaker != null && (
            <div className="row form-group">
              <div className="col-md-4">
                <label> {T.translate("general.speaker")} </label>
                <br />
                <a
                  href=""
                  onClick={this.handleSpeakerLink.bind(this, entity.speaker.id)}
                >
                  {entity.speaker.first_name} {entity.speaker.last_name}
                </a>
              </div>
            </div>
          )}
          <div className="row form-group">
            <div className="col-md-5">
              <label> {T.translate("general.member")} *</label>
              <div
                className="member-input"
                style={{ display: "flex", alignItems: "center" }}
              >
                <MemberInput
                  id="member"
                  value={entity.member}
                  getOptionLabel={(member) =>
                    `${member.first_name || ""} ${member.last_name || ""} (${
                      member.email || member.id
                    })`
                  }
                  onChange={this.handleChange}
                  isClearable
                  isDisabled={disableMemberInput}
                />
                <span style={{ marginLeft: 10 }}>
                  <CopyClipboard
                    text={`${entity.member.first_name || ""} ${
                      entity.member.last_name || ""
                    } (${entity.member.email || entity.member.id})`}
                  />
                </span>
              </div>
            </div>
            <div className="col-md-1" style={{ marginTop: 20 }}>
              -- OR --
            </div>
            <div className="col-md-4">
              <label>
                {T.translate("edit_attendee.email")}
                {"  "}
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate("edit_attendee.email_disclaimer")}
                />
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Input
                  id="email"
                  value={entity.email}
                  onChange={this.handleChange}
                  className="form-control"
                  error={this.hasErrors("email")}
                  disabled={!!entity.member}
                />
                <span style={{ marginLeft: 10 }}>
                  <CopyClipboard text={entity.email} />
                </span>
              </div>
            </div>
          </div>

          <div className="row form-group">
            <div className="col-md-4">
              <label> {T.translate("edit_attendee.first_name")}</label>
              <Input
                id="first_name"
                value={entity.first_name}
                onChange={this.handleChange}
                className="form-control"
                error={this.hasErrors("first_name")}
              />
            </div>
            <div className="col-md-4">
              <label> {T.translate("edit_attendee.last_name")}</label>
              <Input
                id="last_name"
                value={entity.last_name}
                onChange={this.handleChange}
                className="form-control"
                error={this.hasErrors("last_name")}
              />
            </div>
            <div className="col-md-4">
              <label> {T.translate("edit_attendee.manager")}</label>
              <AttendeeInput
                id="manager"
                summitId={currentSummit.id}
                value={entity.manager}
                getOptionLabel={(attendee) =>
                  `${attendee.first_name || ""} ${attendee.last_name || ""} (${
                    attendee.email || attendee.id
                  })`
                }
                onChange={this.handleChange}
                isClearable
              />
            </div>
          </div>
          <div className="row form-group">
            <div className="col-md-4">
              <label> {T.translate("edit_attendee.company")}</label>
              <Input
                id="company"
                value={entity?.company}
                onChange={this.handleChange}
                className="form-control"
                error={this.hasErrors("company")}
              />
            </div>
            <div className="col-md-8">
              <label> {T.translate("edit_attendee.tags")}</label>
              <TagInput
                id="tags"
                clearable
                allowCreate
                isMulti
                value={entity.tags}
                onChange={this.handleChange}
                onCreate={this.handleNewTag}
                placeholder={T.translate("edit_attendee.placeholders.tags")}
              />
            </div>
          </div>
          <div className="row form-group">
            <div className="col-md-3 form-group">
              <label htmlFor="shared_contact_info">
                {T.translate("edit_attendee.shared_contact_info")}
              </label>
              <Dropdown
                id="shared_contact_info"
                value={entity.shared_contact_info}
                onChange={this.handleChange}
                options={[
                  { label: "Yes", value: true },
                  { label: "No", value: false }
                ]}
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="summit_hall_checked_in">
                {T.translate("edit_attendee.checked_in")}
              </label>
              <Dropdown
                id="summit_hall_checked_in"
                value={entity.summit_hall_checked_in}
                onChange={this.handleChange}
                options={[
                  { label: "Yes", value: true },
                  { label: "No", value: false }
                ]}
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="disclaimer_accepted">
                {T.translate("edit_attendee.disclaimer_accepted")}
              </label>
              <Dropdown
                id="disclaimer_accepted"
                value={entity.disclaimer_accepted}
                onChange={this.handleChange}
                options={[
                  { label: "Yes", value: true },
                  { label: "No", value: false }
                ]}
              />
            </div>
          </div>

          <div>
            {entity.member != null && entity.member.affiliations && (
              <div className="row form-group">
                <div className="col-md-12">
                  <legend>{T.translate("edit_attendee.affiliations")}</legend>
                  <AffiliationsTable
                    ownerId={entity.member.id}
                    data={entity.member.affiliations}
                  />
                </div>
              </div>
            )}

            {entity.tickets && entity.tickets.length > 0 && (
              <TicketComponent
                attendeeId={entity.id}
                tickets={entity.tickets}
                summit={currentSummit}
                onReassign={this.props.onTicketReassign}
                onSave={this.props.onSaveTicket}
              />
            )}
            {entity.orders?.length > 0 && (
              <OrderComponent
                orders={entity.orders}
                summitId={entity.summit_id}
              />
            )}

            {entity.member?.rsvp?.length > 0 && (
              <RsvpComponent
                member={entity.member}
                onDelete={this.props.onDeleteRsvp}
              />
            )}
          </div>
        </form>
        {/* Second Form ( Extra Questions ) */}
        {entity.id !== 0 && entity.allowed_extra_questions?.length > 0 && (
          <Panel
            show={showSection === "extra_questions"}
            title={T.translate("edit_attendee.extra_questions")}
            handleClick={this.toggleSection.bind(this, "extra_questions")}
          >
            <ExtraQuestionsForm
              readOnly={this.props.ExtraQuestionsFormReadOnly}
              extraQuestions={entity.allowed_extra_questions}
              userAnswers={entity.extra_questions}
              onAnswerChanges={this.handleSubmit}
              ref={this.formRef}
              className="extra-questions"
            />
          </Panel>
        )}
        {entity.id !== 0 && (
          <Panel
            show={showSection === "admin_notes"}
            title={T.translate("edit_attendee.admin_notes")}
            handleClick={this.toggleSection.bind(this, "admin_notes")}
          >
            <Notes attendeeId={entity.id} />
          </Panel>
        )}
        <div className="row">
          <div className="col-md-12 submit-buttons">
            <input
              type="button"
              onClick={() => this.triggerFormSubmit()}
              className="btn btn-primary pull-right"
              value={T.translate("general.save")}
            />
          </div>
        </div>
      </>
    );
  }
}

export default AttendeeForm;
