/**
 * Copyright 2023 OpenStack Foundation
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
import { connect } from "react-redux";
import {
  Dropdown,
  Input,
  PromocodeInput,
  TagInput,
  TicketTypesInput
} from "openstack-uicore-foundation/lib/components";
import BadgeFeatureInput from "../inputs/badge-feature-input";
import {
  resetPromoCodeSpecForm,
  updateSpecs,
  SPEAKERS_PROMO_CODE_CLASS_NAME,
  SPEAKERS_DISCOUNT_CODE_CLASS_NAME
} from "../../actions/promocode-specification-actions";
import {
  EXISTING_SPEAKERS_PROMO_CODE,
  EXISTING_SPEAKERS_DISCOUNT_CODE,
  AUTO_GENERATED_SPEAKERS_PROMO_CODE,
  AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE
} from "../../actions/promocode-actions";
import { hasErrors } from "../../utils/methods";

class SpeakerPromoCodeSpecForm extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleNewTag = this.handleNewTag.bind(this);
  }

  componentDidMount() {
    this.props.resetPromoCodeSpecForm();
  }

  handleChange(ev) {
    const { promoCodeStrategy } = this.props;
    const entity = { ...this.props.entity };
    const errors = { ...this.props.errors };
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    errors[id] = "";
    entity[id] = value;
    this.props.updateSpecs(promoCodeStrategy, entity);
  }

  handleNewTag(newTag) {
    const { promoCodeStrategy } = this.props;
    const entity = { ...this.props.entity };
    entity.tags = [...entity.tags, { tag: newTag }];
    this.props.updateSpecs(promoCodeStrategy, entity);
  }

  render() {
    const { entity, errors, promoCodeStrategy, summit } = this.props;

    const promoCodeTypeDDL = [
      {
        label: T.translate("promo_code_specification.select_promo_code_type"),
        value: ""
      },
      { label: "Accepted", value: "accepted" },
      { label: "Alternate", value: "alternate" }
    ];

    return (
      <form className="speakers-promo-code-spec-form">
        {[
          EXISTING_SPEAKERS_PROMO_CODE,
          EXISTING_SPEAKERS_DISCOUNT_CODE
        ].includes(promoCodeStrategy) && (
          <>
            <hr />
            <div className="row form-group">
              <div className="col-md-12">
                <PromocodeInput
                  id="existingPromoCode"
                  value={entity.existingPromoCode}
                  onChange={this.handleChange}
                  summitId={summit.id}
                  className="promocodes-filter"
                  placeholder={
                    promoCodeStrategy === 1
                      ? T.translate(
                          "promo_code_specification.placeholders.speakers_promo_code"
                        )
                      : T.translate(
                          "promo_code_specification.placeholders.speakers_discount_code"
                        )
                  }
                  isClearable
                  error={hasErrors("existingPromoCode", errors)}
                  extraFilters={[
                    `class_name==${
                      promoCodeStrategy === 1
                        ? SPEAKERS_PROMO_CODE_CLASS_NAME
                        : SPEAKERS_DISCOUNT_CODE_CLASS_NAME
                    }`
                  ]}
                />
              </div>
            </div>
            <hr />
          </>
        )}
        {[
          AUTO_GENERATED_SPEAKERS_PROMO_CODE,
          AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE
        ].includes(promoCodeStrategy) && (
          <>
            <hr />
            <div className="row form-group">
              <div className="col-md-12">
                <Dropdown
                  id="type"
                  value={entity.type}
                  onChange={this.handleChange}
                  options={promoCodeTypeDDL}
                  isClearable
                  error={hasErrors("type", errors)}
                />
              </div>
            </div>
            <div className="row form-group">
              <div className="col-md-12">
                <TagInput
                  id="tags"
                  clearable
                  isMulti
                  allowCreate
                  value={entity.tags}
                  onChange={this.handleChange}
                  onCreate={this.handleNewTag}
                  placeholder={T.translate(
                    "promo_code_specification.placeholders.tags"
                  )}
                />
              </div>
            </div>
            <div className="row form-group">
              <div className="col-md-12">
                <BadgeFeatureInput
                  id="badgeFeatures"
                  value={entity.badgeFeatures}
                  summitId={summit.id}
                  onChange={this.handleChange}
                  placeholder={T.translate(
                    "promo_code_specification.placeholders.badge_features"
                  )}
                  isMulti
                  isClearable
                />
              </div>
            </div>
            {(promoCodeStrategy === AUTO_GENERATED_SPEAKERS_PROMO_CODE ||
              promoCodeStrategy === AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE) && (
              <>
                <div className="row form-group">
                  <div className="col-md-12">
                    <TicketTypesInput
                      id="ticketTypes"
                      value={entity.ticketTypes}
                      summitId={summit.id}
                      onChange={this.handleChange}
                      placeholder={T.translate(
                        "promo_code_specification.placeholders.ticket_types"
                      )}
                      isMulti
                      isClearable
                    />
                  </div>
                </div>
                <div className="row form-group">
                  <div className="col-md-12">
                    <div className="form-check abc-checkbox">
                      <input
                        id="allowsToReassign"
                        className="form-check-input"
                        type="checkbox"
                        onChange={this.handleChange}
                        checked={entity.allowsToReassign}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="allowsToReassign"
                      >
                        {T.translate("summit_speakers_list.allows_to_reassign")}
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
            {promoCodeStrategy === AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE && (
              <>
                <div className="row form-group">
                  <div className="col-md-12">
                    <div className="form-check abc-checkbox">
                      <input
                        type="checkbox"
                        id="applyToAllTix"
                        checked={entity.applyToAllTix}
                        onChange={this.handleChange}
                        className="form-check-input"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="applyToAllTix"
                      >
                        {T.translate("edit_promocode.apply_to_all_tix")}
                      </label>
                    </div>
                  </div>
                </div>
                {!entity.applyToAllTix && (
                  <div className="row form-group">
                    <div className="col-md-12">
                      <TicketTypesInput
                        id="ticketTypes"
                        value={entity.ticketTypes}
                        summitId={summit.id}
                        onChange={this.handleChange}
                        placeholder={T.translate(
                          "promo_code_specification.placeholders.ticket_types"
                        )}
                        isMulti
                        isClearable
                      />
                    </div>
                  </div>
                )}
                <div className="row form-group">
                  <div className="col-md-5">
                    <Input
                      id="amount"
                      value={entity.rate ? "" : entity.amount}
                      readOnly={entity.rate}
                      type="number"
                      className="form-control"
                      placeholder={T.translate(
                        "promo_code_specification.placeholders.amount"
                      )}
                      onChange={this.handleChange}
                      error={hasErrors("amount", errors)}
                    />
                  </div>
                  <div className="col-md-2">OR</div>
                  <div className="col-md-5">
                    <Input
                      id="rate"
                      value={entity.amount ? "" : entity.rate}
                      readOnly={entity.amount}
                      type="number"
                      className="form-control"
                      placeholder={T.translate(
                        "promo_code_specification.placeholders.rate"
                      )}
                      onChange={this.handleChange}
                      error={hasErrors("rate", errors)}
                    />
                  </div>
                </div>
              </>
            )}
            <hr />
          </>
        )}
      </form>
    );
  }
}

export default connect(null, {
  resetPromoCodeSpecForm,
  updateSpecs
})(SpeakerPromoCodeSpecForm);
