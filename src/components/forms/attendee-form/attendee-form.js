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

import React, { useEffect, useRef, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import MemberInput from "openstack-uicore-foundation/lib/components/inputs/member-input";
import AttendeeInput from "openstack-uicore-foundation/lib/components/inputs/attendee-input";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input";
import Panel from "openstack-uicore-foundation/lib/components/sections/panel";
import TagInput from "openstack-uicore-foundation/lib/components/inputs/tag-input";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import ExtraQuestionsForm from "openstack-uicore-foundation/lib/components/extra-questions";
import QuestionsSet from "openstack-uicore-foundation/lib/utils/questions-set";
import TicketComponent from "./ticket-component";
import OrderComponent from "./order-component";
import RsvpComponent from "./rsvp-component";
import { AffiliationsTable } from "../../tables/affiliationstable";
import { scrollToError, shallowEqual } from "../../../utils/methods";
import NotesPanel from "../../notes/notes-panel";
import CopyClipboard from "../../buttons/copy-clipboard";
import { MILLISECONDS_IN_SECOND } from "../../../utils/constants";

const removeUnchangedFields = (entity, originalEntity) => {
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
      // field didn't change, so remove it from submit
      delete copyOfEntity[f];
    }
  });

  return copyOfEntity;
};

const AttendeeForm = ({
  entity: entityProp,
  errors: errorsProp,
  currentSummit,
  history,
  onSubmit,
  onTicketReassign,
  onSaveTicket,
  onDeleteRsvp,
  ExtraQuestionsFormReadOnly
}) => {
  const [entity, setEntity] = useState({ ...entityProp });
  const [originalEntity, setOriginalEntity] = useState({ ...entityProp });
  const [errors, setErrors] = useState(errorsProp);
  const [openSections, setOpenSections] = useState({
    admin_notes: false,
    extra_questions: false
  });
  const formRef = useRef(null);

  useEffect(() => {
    if (!shallowEqual(originalEntity, entityProp)) {
      setEntity({ ...entityProp });
      setOriginalEntity({ ...entityProp });
      setErrors({});
    }
  }, [entityProp]);

  useEffect(() => {
    scrollToError(errorsProp);
    setErrors((prevErrors) =>
      shallowEqual(prevErrors, errorsProp) ? prevErrors : { ...errorsProp }
    );
  }, [errorsProp]);

  const toggleSection = (section, ev) => {
    ev?.preventDefault();
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenNotes = () => {
    setOpenSections((prev) =>
      prev.admin_notes ? prev : { ...prev, admin_notes: true }
    );
  };

  const handleChange = (ev) => {
    const updatedEntity = { ...entity };
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
      updatedEntity.email = value?.email || "";
      updatedEntity.first_name = value?.first_name || "";
      updatedEntity.last_name = value?.last_name || "";
    }

    updatedEntity[id] = value;
    setEntity(updatedEntity);
    setErrors({});
  };

  const validate = () => {
    const newErrors = { ...errors };
    const required = ["first_name", "last_name", "email"];

    if (!entity.member) {
      required.forEach((fieldId) => {
        if (!entity[fieldId]) {
          newErrors[fieldId] = "This field is required";
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const triggerFormSubmit = () => {
    if (!validate()) return false;

    // check current ( could not be rendered)
    if (formRef.current) {
      formRef.current.doSubmit();
      return true;
    }

    // do regular submit
    const updatedEntity = { ...entity };

    if (updatedEntity.extra_questions) {
      updatedEntity.extra_questions = updatedEntity.extra_questions.map(
        (q) => ({
          question_id: q.question_id,
          answer: q.value
        })
      );
    }

    onSubmit(removeUnchangedFields(updatedEntity, originalEntity));

    return true;
  };

  const handleSubmit = (formValues) => {
    const qs = new QuestionsSet(entity.allowed_extra_questions);
    const formattedAnswers = Object.keys(formValues).map((name) => {
      const question = qs.getQuestionByName(name);
      return {
        question_id: question.id,
        answer: `${formValues[name]}`
      };
    });

    const updatedEntity = { ...entity, extra_questions: formattedAnswers };
    setEntity(updatedEntity);
    onSubmit(removeUnchangedFields(updatedEntity, originalEntity));
  };

  const handleSpeakerLink = (speaker_id, ev) => {
    ev.preventDefault();
    history.push(`/app/speakers/${speaker_id}`);
  };

  const hasErrors = (field) => {
    if (field in errors) {
      return errors[field];
    }

    return "";
  };

  const handleNewTag = (newTag) => {
    setEntity({
      ...entity,
      tags: [...entity.tags, { tag: newTag }]
    });
  };

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
                onClick={(ev) => handleSpeakerLink(entity.speaker.id, ev)}
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
                onChange={handleChange}
                isClearable
                isDisabled={disableMemberInput}
              />
              {entity?.member && (
                <span style={{ marginLeft: 10 }}>
                  <CopyClipboard
                    text={`${entity.member.first_name || ""} ${
                      entity.member.last_name || ""
                    } (${entity.member.email || entity.member.id})`}
                  />
                </span>
              )}
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
                onChange={handleChange}
                className="form-control"
                error={hasErrors("email")}
                disabled={!!entity.member}
              />
              <span style={{ marginLeft: 10 }}>
                <CopyClipboard text={entity?.email} />
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
              onChange={handleChange}
              className="form-control"
              error={hasErrors("first_name")}
            />
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_attendee.last_name")}</label>
            <Input
              id="last_name"
              value={entity.last_name}
              onChange={handleChange}
              className="form-control"
              error={hasErrors("last_name")}
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="form-control"
              error={hasErrors("company")}
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
              onChange={handleChange}
              onCreate={handleNewTag}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false }
              ]}
            />
          </div>
        </div>

        <div>
          {entity.id !== 0 && (
            <NotesPanel
              key={entity.id}
              attendeeId={entity.id}
              open={openSections.admin_notes}
              onToggle={(ev) => toggleSection("admin_notes", ev)}
              onOpen={handleOpenNotes}
            />
          )}

          {entity.tickets && entity.tickets.length > 0 && (
            <TicketComponent
              attendeeId={entity.id}
              tickets={entity.tickets}
              summit={currentSummit}
              onReassign={onTicketReassign}
              onSave={onSaveTicket}
            />
          )}
          {entity.orders?.length > 0 && (
            <OrderComponent
              orders={entity.orders}
              summitId={entity.summit_id}
            />
          )}

          {entity.member?.rsvp?.length > 0 && (
            <RsvpComponent member={entity.member} onDelete={onDeleteRsvp} />
          )}
        </div>
      </form>
      {/* Second Form ( Extra Questions ) */}
      {entity.id !== 0 && entity.allowed_extra_questions?.length > 0 && (
        <Panel
          show={openSections.extra_questions}
          title={T.translate("edit_attendee.extra_questions")}
          handleClick={(ev) => toggleSection("extra_questions", ev)}
        >
          <ExtraQuestionsForm
            readOnly={ExtraQuestionsFormReadOnly}
            extraQuestions={entity.allowed_extra_questions}
            userAnswers={entity.extra_questions}
            onAnswerChanges={handleSubmit}
            ref={formRef}
            className="extra-questions"
          />
        </Panel>
      )}
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
      <div className="row">
        <div className="col-md-12 submit-buttons">
          <input
            type="button"
            onClick={() => triggerFormSubmit()}
            className="btn btn-primary pull-right"
            value={T.translate("general.save")}
          />
        </div>
      </div>
    </>
  );
};

export default AttendeeForm;
