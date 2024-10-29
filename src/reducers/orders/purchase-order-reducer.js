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
import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

import _ from "lodash";

import history from "../../history";
import {
  RECEIVE_PURCHASE_ORDER,
  RESET_PURCHASE_ORDER_FORM,
  UPDATE_PURCHASE_ORDER,
  PURCHASE_ORDER_CANCEL_REFUND,
  PURCHASE_ORDER_UPDATED,
  RECEIVE_PURCHASE_ORDER_REFUNDS,
  RECEIVE_PURCHASE_ORDER_TICKETS
} from "../../actions/order-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

import { DECIMAL_DIGITS } from "../../utils/constants";
import {
  TICKET_MEMBER_REASSIGNED,
  TICKET_SAVED
} from "../../actions/ticket-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  number: "",
  ticket_qty: 1,
  owner_company: "",
  owner_email: "",
  owner_first_name: "",
  owner_last_name: "",
  owner: { id: 0, first_name: "", last_name: "", email: "" },
  payment_method: "",
  status: "",
  billing_address_1: "",
  billing_address_2: "",
  billing_address_zip_code: "",
  billing_address_city: "",
  billing_address_state: "",
  billing_address_country_iso_code: "",
  extra_question_answers: [],
  tickets: [],
  promo_code: "",
  credit_card_type: "",
  credit_card_4number: "",
  applied_taxes: [],
  approved_refunds: [],
  approved_refunds_taxes: [],
  currency_symbol: "$"
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  ticketsCurrentPage: 1,
  ticketsTotal: 0,
  ticketsLastPage: 1,
  errors: {}
};

const assembleTicketsState = (tickets, currencySymbol, summitId) =>
  tickets.map((t) => {
    let owner_full_name = "N/A";
    let owner_email = "N/A";
    let owner_link = "N/A";
    let email_link = "N/A";
    const promo_code = t.promo_code?.code || "N/A";
    const ticket_type_name = t.ticket_type ? t.ticket_type.name : "N/A";

    const final_amount_formatted = `${currencySymbol}${t.final_amount.toFixed(
      DECIMAL_DIGITS
    )}`;
    const refunded_amount_formatted = `${currencySymbol}${t.refunded_amount.toFixed(
      DECIMAL_DIGITS
    )}`;
    const final_amount_adjusted_formatted = `${currencySymbol}${(
      t.final_amount - t.refunded_amount
    ).toFixed(DECIMAL_DIGITS)}`;

    if (t.owner) {
      owner_email = t.owner.email;

      if (t.owner.first_name || t.owner.last_name) {
        owner_full_name = `${t.owner.first_name} ${t.owner.last_name}`;
      } else if (t.owner.member?.first_name || t.owner.member?.last_name) {
        owner_full_name = `${t.owner.member.first_name} ${t.owner.member.last_name}`;
      }

      owner_link = (
        <button
          type="button"
          className="text-table-link"
          onClick={(ev) => {
            ev.stopPropagation();
            history.push(`/app/summits/${summitId}/attendees/${t.owner.id}`);
          }}
        >
          {owner_full_name}
        </button>
      );
      email_link = (
        <button
          type="button"
          className="text-table-link"
          onClick={(ev) => {
            ev.stopPropagation();
            window.open(`mailto:${owner_email}`, "_blank");
          }}
        >
          {owner_email}
        </button>
      );
    }

    return {
      ...t,
      ticket_type_name,
      owner_full_name,
      owner_email,
      owner_link,
      email_link,
      promo_code,
      final_amount_formatted,
      refunded_amount_formatted,
      final_amount_adjusted_formatted
    };
  });

// eslint-disable-next-line default-param-last
const purchaseOrderReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case SET_CURRENT_SUMMIT:
    case RESET_PURCHASE_ORDER_FORM:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case RECEIVE_PURCHASE_ORDER: {
      const entity = { ...payload.response, tickets: [] };

      const final_amount_formatted = `${
        entity.currency_symbol
      }${entity.amount.toFixed(DECIMAL_DIGITS)}`;
      const refunded_amount_formatted = `${
        entity.currency_symbol
      }${entity.total_refunded_amount.toFixed(DECIMAL_DIGITS)}`;
      const final_amount_adjusted_formatted = `${entity.currency_symbol}${(
        entity.amount - entity.total_refunded_amount
      ).toFixed(DECIMAL_DIGITS)}`;

      Object.entries(entity).forEach(([key, value]) => {
        entity[key] = value == null ? "" : value;
      });

      entity.owner = {
        email: entity.owner_email,
        first_name: entity.owner_first_name,
        last_name: entity.owner_last_name
      };

      return {
        ...state,
        entity: {
          ...entity,
          final_amount_formatted,
          refunded_amount_formatted,
          final_amount_adjusted_formatted
        },
        errors: {}
      };
    }
    case RECEIVE_PURCHASE_ORDER_TICKETS: {
      const {
        current_page: ticketsCurrentPage,
        total,
        last_page: ticketsLastPage,
        data
      } = payload.response;
      const entity = { ...state.entity };

      entity.tickets = assembleTicketsState(
        data,
        entity.currency_symbol,
        entity.summit_id
      );

      return {
        ...state,
        entity,
        ticketsCurrentPage,
        ticketsTotal: total,
        ticketsLastPage
      };
    }
    case UPDATE_PURCHASE_ORDER: {
      return { ...state, entity: { ...payload }, errors: {} };
    }
    case PURCHASE_ORDER_UPDATED: {
      const updatedPurchaseOrder = payload.response;

      updatedPurchaseOrder.tickets = assembleTicketsState(
        updatedPurchaseOrder.tickets,
        updatedPurchaseOrder.currency_symbol,
        updatedPurchaseOrder.summit_id
      );

      const newRawCost = updatedPurchaseOrder.tickets?.reduce(
        (sum, ticket) => sum + ticket.raw_cost,
        0
      );

      const amount = newRawCost;
      const raw_amount = newRawCost;
      const final_amount_formatted = `${
        updatedPurchaseOrder.currency_symbol
      }${newRawCost.toFixed(DECIMAL_DIGITS)}`;
      const final_amount_adjusted_formatted = `${
        updatedPurchaseOrder.currency_symbol
      }${(newRawCost - state.entity.total_refunded_amount).toFixed(
        DECIMAL_DIGITS
      )}`;
      const adjusted_total_order_purchase_price =
        newRawCost - state.entity.total_refunded_amount;

      return {
        ...state,
        entity: {
          ...state.entity,
          amount,
          raw_amount,
          final_amount_formatted,
          final_amount_adjusted_formatted,
          adjusted_total_order_purchase_price,
          ...updatedPurchaseOrder
        },
        errors: {}
      };
    }
    case RECEIVE_PURCHASE_ORDER_REFUNDS: {
      const approved_refunds = payload.response.data;
      const currencySymbol = state.entity.currency_symbol;
      const approved_refunds_taxes = [];
      const purchaseOrder = { ...state.entity };
      let adjusted_order_price = purchaseOrder.amount;
      let adjusted_net_price =
        purchaseOrder.raw_amount - purchaseOrder.discount_amount;
      let adjusted_total_order_purchase_price = 0;
      // use deep copy to avoid mutations on elements of the array
      const adjusted_applied_taxes = _.cloneDeep(purchaseOrder.applied_taxes);
      approved_refunds.forEach((refund) => {
        refund.ticket_id = refund.ticket.id;
        refund.refunded_amount_formatted = `${currencySymbol}${refund.refunded_amount.toFixed(
          DECIMAL_DIGITS
        )}`;
        refund.total_refunded_amount_formatted = `${currencySymbol}${refund.total_refunded_amount.toFixed(
          DECIMAL_DIGITS
        )}`;
        adjusted_total_order_purchase_price += refund.total_refunded_amount;
        adjusted_net_price -= refund.refunded_amount;
        refund.adjusted_net_price_formatted = `${currencySymbol}${adjusted_net_price.toFixed(
          DECIMAL_DIGITS
        )}`;
        adjusted_order_price -= refund.total_refunded_amount;
        refund.adjusted_order_price_formatted = `${currencySymbol}${adjusted_order_price.toFixed(
          DECIMAL_DIGITS
        )}`;
        refund.refunded_taxes.forEach((rt) => {
          // field for the tax column of that refund
          refund[
            `tax_${rt.tax.id}_refunded_amount`
          ] = `${currencySymbol}${rt.refunded_amount.toFixed(DECIMAL_DIGITS)}`;
          adjusted_applied_taxes.forEach((t) => {
            if (t.id === rt.tax.id) {
              t.amount -= rt.refunded_amount;
              // prevent -0 values
              refund[
                `tax_${rt.tax.id}_adjusted_refunded_amount`
              ] = `${currencySymbol}${Math.abs(t.amount).toFixed(
                DECIMAL_DIGITS
              )}`;
            }
          });
          // add tax type to array
          approved_refunds_taxes.push(rt.tax);
        });
      });
      adjusted_total_order_purchase_price =
        purchaseOrder.amount - adjusted_total_order_purchase_price;
      const unique_approved_refunds_taxes = approved_refunds_taxes.filter(
        (tax, idx, arr) => idx === arr.findIndex((obj) => obj.id === tax.id)
      );
      return {
        ...state,
        entity: {
          ...state.entity,
          approved_refunds,
          adjusted_total_order_purchase_price,
          approved_refunds_taxes: unique_approved_refunds_taxes
        }
      };
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    case PURCHASE_ORDER_CANCEL_REFUND: {
      const { entity } = state;
      return { ...state, entity: { ...entity, status: "Paid" } };
    }
    case TICKET_SAVED:
    case TICKET_MEMBER_REASSIGNED: {
      const savedTicket = payload.response;
      const _tickets = state.entity.tickets.map((t) => {
        if (t.id === savedTicket.id) return savedTicket;
        return t;
      });
      const tickets = assembleTicketsState(
        _tickets,
        state.entity.currency_symbol,
        state.entity.summit_id
      );

      return { ...state, entity: { ...state.entity, tickets } };
    }
    default:
      return state;
  }
};

export default purchaseOrderReducer;
