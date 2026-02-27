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
import {
  Input,
  Dropdown,
  Panel,
  Table
} from "openstack-uicore-foundation/lib/components";
import { isEmpty, scrollToError, shallowEqual } from "../../utils/methods";
import { MILLISECONDS } from "../../utils/constants";

class PaymentProfileForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      errors: props.errors
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNewFeeType = this.handleNewFeeType.bind(this);
    this.handleEditFeeType = this.handleEditFeeType.bind(this);
    this.handleDeleteFeeType = this.handleDeleteFeeType.bind(this);
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
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (ev.target.type === "datetime") {
      value = value.valueOf() / MILLISECONDS;
    }

    errors[id] = "";
    entity[id] = value;
    this.setState({ entity, errors });
  }

  handleSubmit(ev) {
    ev.preventDefault();
    this.props.onSubmit(this.state.entity);
  }

  hasErrors(field) {
    const { errors } = this.state;
    if (field in errors) {
      return errors[field];
    }

    return "";
  }

  handleNewFeeType() {
    const { currentSummit, entity, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/payment-profiles/${entity.id}/payment-fee-type/new`
    );
  }

  handleEditFeeType(valueId) {
    const { currentSummit, entity, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/payment-profiles/${entity.id}/payment-fee-type/${valueId}`
    );
  }

  handleDeleteFeeType(valueId) {
    this.props.onDeleteFeeType(valueId);
  }

  render() {
    const { entity } = this.state;
    const { paymentFeeTypes } = this.props;
    const application_type_ddl = [
      { label: "Registration", value: "Registration" },
      { label: "Bookable Rooms", value: "BookableRooms" },
      { label: "Sponsor Services", value: "SponsorServices" }
    ];

    const provider_ddl = [
      { label: "Stripe", value: "Stripe" },
      { label: "LawPay", value: "LawPay" }
    ];

    const fee_types_options = {
      sortCol: paymentFeeTypes.order,
      sortDir: paymentFeeTypes.orderDir,
      actions: {
        edit: { onClick: this.handleEditFeeType },
        delete: { onClick: this.handleDeleteFeeType }
      }
    };

    const fee_types_columns = [
      {
        columnKey: "name",
        value: T.translate("edit_payment_profile.payment_type_fee_name")
      },
      {
        columnKey: "kind",
        value: T.translate("edit_payment_profile.payment_type_fee_kind")
      },
      {
        columnKey: "payment_method",
        value: T.translate("edit_payment_profile.payment_type_fee_method")
      },
      {
        columnKey: "value",
        value: T.translate("edit_payment_profile.payment_type_fee_value")
      },
      {
        columnKey: "max_cents",
        value: T.translate("edit_payment_profile.payment_type_fee_max_cents")
      },
      {
        columnKey: "min_cents",
        value: T.translate("edit_payment_profile.payment_type_fee_min_cents")
      }
    ];

    return (
      <form className="payment-profile-form">
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.application_type")}
            </label>
            <Dropdown
              id="application_type"
              value={entity.application_type}
              isDisabled={entity.id !== 0}
              onChange={this.handleChange}
              options={application_type_ddl}
            />
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_payment_profile.provider")}</label>
            <Dropdown
              id="provider"
              value={entity.provider}
              onChange={this.handleChange}
              options={provider_ddl}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-4 checkboxes-div">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="is_active"
                checked={entity.is_active}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="is_active">
                {T.translate("edit_payment_profile.active")}
              </label>
            </div>
          </div>
          <div className="col-md-4 checkboxes-div">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="test_mode_enabled"
                checked={entity.test_mode_enabled}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="test_mode_enabled">
                {T.translate("edit_payment_profile.test_mode_enabled")}
              </label>
              &nbsp;
              <i
                className="fa fa-info-circle pointable"
                aria-hidden="true"
                title={T.translate(
                  "edit_payment_profile.info_stripe_test_mode"
                )}
              />
            </div>
          </div>
          {entity.provider === "Stripe" && (
            <div className="col-md-4 checkboxes-div">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="send_email_receipt"
                  checked={entity.send_email_receipt}
                  onChange={this.handleChange}
                  className="form-check-input"
                />
                <label
                  className="form-check-label"
                  htmlFor="send_email_receipt"
                >
                  {T.translate("edit_payment_profile.send_email_receipt")}
                </label>
                &nbsp;
                <i
                  className="fa fa-info-circle pointable"
                  aria-hidden="true"
                  title={T.translate(
                    "edit_payment_profile.info_send_email_receipt"
                  )}
                />
              </div>
            </div>
          )}

          {entity.provider === "LawPay" && (
            <div className="col-md-4">
              <label>
                {" "}
                {T.translate("edit_payment_profile.merchant_account_id")}
              </label>
              <Input
                className="form-control"
                id="merchant_account_id"
                onChange={this.handleChange}
                value={entity.merchant_account_id}
              />
            </div>
          )}
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {" "}
              {T.translate("edit_payment_profile.live_secret_key")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("edit_payment_profile.info_stripe_keys")}
            />
            <Input
              id="live_secret_key"
              className="form-control"
              error={this.hasErrors("live_secret_key")}
              onChange={this.handleChange}
              value={entity.live_secret_key}
            />
          </div>
          <div className="col-md-6">
            <label>
              {" "}
              {T.translate("edit_payment_profile.live_publishable_key")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("edit_payment_profile.info_stripe_keys")}
            />
            <Input
              id="live_publishable_key"
              className="form-control"
              error={this.hasErrors("live_publishable_key")}
              onChange={this.handleChange}
              value={entity.live_publishable_key}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {" "}
              {T.translate("edit_payment_profile.test_secret_key")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("edit_payment_profile.info_stripe_keys")}
            />
            <Input
              id="test_secret_key"
              className="form-control"
              error={this.hasErrors("test_secret_key")}
              onChange={this.handleChange}
              value={entity.test_secret_key}
            />
          </div>
          <div className="col-md-6">
            <label>
              {" "}
              {T.translate("edit_payment_profile.test_publishable_key")}
            </label>
            &nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("edit_payment_profile.info_stripe_keys")}
            />
            <Input
              id="test_publishable_key"
              className="form-control"
              error={this.hasErrors("test_publishable_key")}
              onChange={this.handleChange}
              value={entity.test_publishable_key}
            />
          </div>
        </div>
        {entity.id !== 0 &&
          entity.provider === "Stripe" &&
          entity.application_type === "SponsorServices" && (
            <Panel
              title={T.translate("edit_payment_profile.payment_type_fee")}
              show
            >
              <div className="row form-group">
                <div className="col-md-12 submit-buttons">
                  <input
                    type="button"
                    onClick={this.handleNewFeeType}
                    className="btn btn-primary pull-right"
                    value={T.translate("edit_payment_profile.new_fee_type")}
                  />
                </div>
              </div>
              <div className="row form-group col-md-12">
                <Table
                  options={fee_types_options}
                  data={paymentFeeTypes.paymentFeeTypes}
                  columns={fee_types_columns}
                />
              </div>
            </Panel>
          )}
        <hr />
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

export default PaymentProfileForm;
