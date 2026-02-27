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
import { Input, Dropdown } from "openstack-uicore-foundation/lib/components";
import { isEmpty, scrollToError, shallowEqual } from "../../utils/methods";
import { MILLISECONDS } from "../../utils/constants";

class PaymentFeeTypeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
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

  render() {
    const { entity } = this.state;

    const payment_type_fee_kind_ddl = [
      { label: "Rate", value: "Rate" },
      { label: "Amount", value: "Amount" }
    ];

    const payment_type_fee_method = [
      // # Cards & wallets
      { label: "Card", value: "card" },
      { label: "Link", value: "link" },
      { label: "CashApp", value: "cashapp" },
      { label: "Paypal", value: "paypal" },
      // # Bank debits
      { label: "UsBankAccount", value: "us_bank_account" },
      { label: "SepaDebit", value: "sepa_debit" },
      { label: "BacsDebit", value: "bacs_debit" },
      { label: "AuBecsDebit", value: "au_becs_debit" },
      { label: "AcssDebit", value: "acss_debit" },
      // # Bank redirects
      { label: "Ideal", value: "ideal" },
      { label: "Sofort", value: "sofort" },
      { label: "Bancontact", value: "bancontact" },
      { label: "Giropay", value: "giropay" },
      { label: "Eps", value: "eps" },
      { label: "P24", value: "p24" },
      { label: "Blik", value: "blik" },
      // # Buy Now, Pay Later
      { label: "Klarna", value: "klarna" },
      { label: "AfterpayClearpay", value: "afterpay_clearpay" },
      { label: "Affirm", value: "affirm" },
      // # Regional / other
      { label: "Alipay", value: "alipay" },
      { label: "WechatPay", value: "wechat_pay" },
      { label: "Grabpay", value: "grabpay" },
      { label: "Oxxo", value: "oxxo" },
      { label: "Boleto", value: "boleto" },
      { label: "Konbini", value: "konbini" }
    ];

    return (
      <form className="payment-profile-form">
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.payment_type_fee_name")}
            </label>
            <Input
              className="form-control"
              id="name"
              onChange={this.handleChange}
              value={entity.name}
            />
          </div>
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.payment_type_fee_kind")}
            </label>
            <Dropdown
              id="kind"
              value={entity.kind}
              onChange={this.handleChange}
              options={payment_type_fee_kind_ddl}
            />
          </div>
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.payment_type_fee_method")}
            </label>
            <Dropdown
              id="payment_method"
              value={entity.payment_method}
              onChange={this.handleChange}
              options={payment_type_fee_method}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.payment_type_fee_value")}
            </label>
            <Input
              className="form-control"
              id="value"
              onChange={this.handleChange}
              value={entity.value}
            />
          </div>
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.payment_type_fee_max_cents")}
            </label>
            <Input
              className="form-control"
              id="max_cents"
              onChange={this.handleChange}
              value={entity.max_cents}
            />
          </div>
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_payment_profile.payment_type_fee_min_cents")}
            </label>
            <Input
              className="form-control"
              id="min_cents"
              onChange={this.handleChange}
              value={entity.min_cents}
            />
          </div>
        </div>
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

export default PaymentFeeTypeForm;
