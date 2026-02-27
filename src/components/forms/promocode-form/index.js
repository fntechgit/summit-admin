/**
 * Copyright 2026 OpenStack Foundation
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
  TagInput
} from "openstack-uicore-foundation/lib/components";
import {
  SpeakerPCForm,
  MemberPCForm,
  SponsorPCForm,
  MemberDiscountPCForm,
  SpeakerDiscountPCForm,
  SponsorDiscountPCForm,
  SummitPCForm,
  SummitDiscountPCForm,
  SpeakersPCForm,
  SpeakersDiscountPCForm
} from "./forms";
import {
  isEmpty,
  scrollToError,
  shallowEqual,
  validateEmail
} from "../../../utils/methods";
import { DEFAULT_ENTITY } from "../../../reducers/promocodes/promocode-reducer";
import FragmentParser from "../../../utils/fragmen-parser";
import TextAreaInputWithCounter from "../../inputs/text-area-input-with-counter";
import {
  INDEX_NOT_FOUND,
  MILLISECONDS
} from "../../../utils/constants";

class PromocodeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      errors: props.errors
    };

    this.fragmentParser = new FragmentParser();

    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSendEmail = this.handleSendEmail.bind(this);
    this.hasErrors = this.hasErrors.bind(this);
    this.handleBadgeFeatureLink = this.handleBadgeFeatureLink.bind(this);
    this.handleBadgeFeatureUnLink = this.handleBadgeFeatureUnLink.bind(this);
    this.queryBadgeFeatures = this.queryBadgeFeatures.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewTag = this.handleNewTag.bind(this);
    this.validate = this.validate.bind(this);
  }

  componentDidUpdate(prevProps) {
    const state = {};
    const { errors, entity } = this.props;
    scrollToError(errors);

    if (!shallowEqual(prevProps.entity, entity)) {
      state.entity = { ...entity };
      state.errors = {};
    }

    if (!shallowEqual(prevProps.errors, errors)) {
      state.errors = { ...errors };
    }

    if (!isEmpty(state)) {
      this.setState((prevState) => ({ ...prevState, ...state }));
    }
  }

  handleChange(ev) {
    const { entity, errors } = this.state;
    const newEntity = { ...entity };
    const newErrors = { ...errors };
    const { id } = ev.target;
    let { value } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (id === "apply_to_all_tix" && value === false) {
      newEntity.amount = 0;
      newEntity.rate = 0;
    }

    if (ev.target.type === "datetime") {
      value = value.valueOf() / MILLISECONDS;
    }

    newErrors[id] = "";
    newEntity[id] = value;
    this.setState({ entity: newEntity, errors: newErrors });
  }

  handleClassChange(ev) {
    const { entity } = this.state;
    let newEntity = { ...entity };
    const { value } = ev.target;

    newEntity = { ...DEFAULT_ENTITY };
    newEntity.class_name = value;

    this.setState({ entity: newEntity });
  }

  handleSendEmail(ev) {
    const { onSendEmail } = this.props;
    const { entity } = this.state;
    ev.preventDefault();

    onSendEmail(entity.id);
  }

  handleSubmit(ev) {
    ev.preventDefault();
    const { onSubmit } = this.props;
    const { entity } = this.state;
    const typeScope = this.fragmentParser.getParam("type");

    if (entity.allowed_ticket_types.length > 0) {
      entity.allowed_ticket_types = entity.allowed_ticket_types.map(
        (tt) => tt.id
      );
    }

    if (this.validate()) {
      onSubmit(entity, typeScope === "sponsor");
    }
  }

  handleBadgeFeatureLink(valueId) {
    const { entity } = this.state;
    const { onBadgeFeatureLink } = this.props;
    onBadgeFeatureLink(entity.id, valueId);
  }

  handleBadgeFeatureUnLink(valueId) {
    const { entity } = this.state;
    const { onBadgeFeatureUnLink } = this.props;
    onBadgeFeatureUnLink(entity.id, valueId);
  }

  handleNewTag(newTag) {
    this.setState((prevState) => ({
      ...prevState,
      entity: {
        ...prevState.entity,
        tags: [...prevState.entity.tags, { tag: newTag }]
      }
    }));
  }

  queryBadgeFeatures(input, callback) {
    const { currentSummit } = this.props;
    let badgeFeatures = [];

    badgeFeatures = currentSummit.badge_features.filter(
      (f) =>
        f.name.toLowerCase().indexOf(input.toLowerCase()) !== INDEX_NOT_FOUND
    );

    callback(badgeFeatures);
  }

  hasErrors(field) {
    const { errors } = this.state;
    if (field in errors) {
      return errors[field];
    }

    return "";
  }

  validate() {
    const { entity, errors } = this.state;
    const validEmail = validateEmail(entity.contact_email);

    if (entity.contact_email && !validEmail) {
      errors.contact_email = "Please enter a valid email.";
      this.setState({ errors });
      return false;
    }

    return true;
  }

  render() {
    const { entity } = this.state;
    const {
      currentSummit,
      allClasses,
      onCreateCompany,
      assignSpeaker,
      getAssignedSpeakers,
      unAssignSpeaker,
      resetPromocodeForm
    } = this.props;
    const typeScope = this.fragmentParser.getParam("type");

    let promocode_class_ddl = allClasses.map((c) => ({
      label: c.class_name,
      value: c.class_name
    }));
    let promocode_types_ddl = [];

    if (typeScope === "sponsor") {
      promocode_class_ddl = promocode_class_ddl.filter((pc) =>
        pc.value.includes("SPONSOR")
      );
    }

    if (entity.class_name) {
      const classTypes = allClasses.find(
        (c) => c.class_name === entity.class_name
      ).type;

      if (classTypes) {
        promocode_types_ddl = classTypes.map((t) => ({ label: t, value: t }));
      }
    }

    const badgeFeatureColumns = [
      { columnKey: "name", value: T.translate("edit_promocode.name") },
      {
        columnKey: "description",
        value: T.translate("edit_promocode.description")
      }
    ];

    const badgeFeatureOptions = {
      title: T.translate("edit_promocode.badge_features"),
      valueKey: "name",
      labelKey: "name",
      actions: {
        search: this.queryBadgeFeatures,
        delete: { onClick: this.handleBadgeFeatureUnLink },
        add: { onClick: this.handleBadgeFeatureLink }
      }
    };

    return (
      <form className="promocode-form">
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-3">
            <label htmlFor="class_name">
              {" "}
              {T.translate("edit_promocode.class_name")} *
            </label>
            <Dropdown
              id="class_name"
              value={entity.class_name}
              placeholder={T.translate(
                "edit_promocode.placeholders.select_class_name"
              )}
              options={promocode_class_ddl}
              onChange={this.handleClassChange}
              disabled={entity.id !== 0}
              error={this.hasErrors("class_name")}
            />
          </div>
          {promocode_types_ddl.length > 0 && (
            <div className="col-md-3">
              <label htmlFor="type">
                {" "}
                {T.translate("edit_promocode.type")} *
              </label>
              <Dropdown
                id="type"
                value={entity.type}
                placeholder={T.translate(
                  "promocode_list.placeholders.select_type"
                )}
                options={promocode_types_ddl}
                onChange={this.handleChange}
                disabled={entity.id !== 0}
                error={this.hasErrors("type")}
              />
            </div>
          )}
          <div className="col-md-3">
            <label htmlFor="code">
              {" "}
              {T.translate("edit_promocode.code")} *
            </label>
            <Input
              id="code"
              value={entity.code}
              onChange={this.handleChange}
              className="form-control"
              error={this.hasErrors("code")}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="tags"> {T.translate("edit_promocode.tags")}</label>
            <TagInput
              id="tags"
              clearable
              isMulti
              allowCreate
              value={entity.tags}
              onChange={this.handleChange}
              onCreate={this.handleNewTag}
              placeholder={T.translate(
                "edit_promocode.placeholders.select_tags"
              )}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-8">
            <label htmlFor="description">
              {" "}
              {T.translate("edit_promocode.description")}
            </label>
            <TextAreaInputWithCounter
              className="form-control"
              rows={4}
              maxLength={255}
              id="description"
              value={entity.description}
              onChange={this.handleChange}
              error={this.hasErrors("description")}
            />
          </div>
          <div className="col-md-4 checkboxes-div">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="allows_to_delegate"
                checked={entity.allows_to_delegate}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="allows_to_delegate">
                {T.translate("edit_promocode.allows_to_delegate")}&nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate("edit_promocode.allows_to_delegate_info")}
                />
              </label>
            </div>
            <div
              className="form-check abc-checkbox"
              style={{ marginTop: "10px" }}
            >
              <input
                type="checkbox"
                id="allows_to_reassign"
                checked={entity.allows_to_reassign}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="allows_to_reassign">
                {T.translate("edit_promocode.allows_to_reassign")}&nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate("edit_promocode.allows_to_reassign_info")}
                />
              </label>
            </div>
          </div>
        </div>

        {entity.class_name === "SPEAKER_PROMO_CODE" && (
          <SpeakerPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {entity.class_name === "SPONSOR_PROMO_CODE" && (
          <SponsorPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            onCreateCompany={onCreateCompany}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {entity.class_name === "MEMBER_PROMO_CODE" && (
          <MemberPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {entity.class_name === "SPEAKER_DISCOUNT_CODE" && (
          <SpeakerDiscountPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {entity.class_name === "SPONSOR_DISCOUNT_CODE" && (
          <SponsorDiscountPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            onCreateCompany={onCreateCompany}
            hasErrors={this.hasErrors}
          />
        )}

        {entity.class_name === "MEMBER_DISCOUNT_CODE" && (
          <MemberDiscountPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {["SUMMIT_PROMO_CODE", "PRE_PAID_PROMO_CODE"].includes(
          entity.class_name
        ) && (
          <SummitPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {["SUMMIT_DISCOUNT_CODE", "PRE_PAID_DISCOUNT_CODE"].includes(
          entity.class_name
        ) && (
          <SummitDiscountPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
          />
        )}

        {entity.class_name === "SPEAKERS_PROMO_CODE" && (
          <SpeakersPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
            assignSpeaker={assignSpeaker}
            getAssignedSpeakers={getAssignedSpeakers}
            unAssignSpeaker={unAssignSpeaker}
            resetPromocodeForm={resetPromocodeForm}
          />
        )}

        {entity.class_name === "SPEAKERS_DISCOUNT_CODE" && (
          <SpeakersDiscountPCForm
            entity={entity}
            summit={currentSummit}
            handleChange={this.handleChange}
            handleSendEmail={this.handleSendEmail}
            badgeFeatureColumns={badgeFeatureColumns}
            badgeFeatureOptions={badgeFeatureOptions}
            hasErrors={this.hasErrors}
            assignSpeaker={assignSpeaker}
            getAssignedSpeakers={getAssignedSpeakers}
            unAssignSpeaker={unAssignSpeaker}
            resetPromocodeForm={resetPromocodeForm}
          />
        )}

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

export default PromocodeForm;
