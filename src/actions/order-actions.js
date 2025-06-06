/**
 * Copyright 2018 OpenStack Foundation
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

import T from "i18n-react/dist/i18n-react";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
  createAction,
  stopLoading,
  startLoading,
  showMessage,
  showSuccessMessage,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import URI from "urijs";

import history from "../history";
import {
  checkOrFilter,
  getAccessTokenSafely,
  parseDateRangeFilter
} from "../utils/methods";

import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_EXTRA_QUESTIONS_PER_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE
} from "../utils/constants";

export const REQUEST_ORDER_EXTRA_QUESTIONS = "REQUEST_ORDER_EXTRA_QUESTIONS";
export const RECEIVE_ORDER_EXTRA_QUESTIONS = "RECEIVE_ORDER_EXTRA_QUESTIONS";
export const RECEIVE_ORDER_EXTRA_QUESTION = "RECEIVE_ORDER_EXTRA_QUESTION";
export const RESET_ORDER_EXTRA_QUESTION_FORM =
  "RESET_ORDER_EXTRA_QUESTION_FORM";
export const UPDATE_ORDER_EXTRA_QUESTION = "UPDATE_ORDER_EXTRA_QUESTION";
export const ORDER_EXTRA_QUESTION_UPDATED = "ORDER_EXTRA_QUESTION_UPDATED";
export const ORDER_EXTRA_QUESTION_ADDED = "ORDER_EXTRA_QUESTION_ADDED";
export const ORDER_EXTRA_QUESTION_DELETED = "ORDER_EXTRA_QUESTION_DELETED";
export const RECEIVE_ORDER_EXTRA_QUESTION_META =
  "RECEIVE_ORDER_EXTRA_QUESTION_META";
export const QUESTION_VALUE_ORDER_UPDATED = "QUESTION_VALUE_ORDER_UPDATED";
export const ORDER_EXTRA_QUESTION_VALUE_DELETED =
  "ORDER_EXTRA_QUESTION_VALUE_DELETED";
export const ORDER_EXTRA_QUESTION_VALUE_ADDED =
  "ORDER_EXTRA_QUESTION_VALUE_ADDED";
export const ORDER_EXTRA_QUESTION_VALUE_UPDATED =
  "ORDER_EXTRA_QUESTION_VALUE_UPDATED";
export const UPDATE_ORDER_EXTRA_QUESTION_VALUE =
  "UPDATE_ORDER_EXTRA_QUESTION_VALUE";
export const ORDER_EXTRA_QUESTION_ORDER_UPDATED =
  "ORDER_EXTRA_QUESTION_ORDER_UPDATED";
export const RECEIVE_MAIN_ORDER_EXTRA_QUESTIONS =
  "RECEIVE_MAIN_ORDER_EXTRA_QUESTIONS";

export const REQUEST_PURCHASE_ORDERS = "REQUEST_PURCHASE_ORDERS";
export const RECEIVE_PURCHASE_ORDERS = "RECEIVE_PURCHASE_ORDERS";
export const RECEIVE_PURCHASE_ORDER = "RECEIVE_PURCHASE_ORDER";
export const RECEIVE_PURCHASE_ORDER_TICKETS = "RECEIVE_PURCHASE_ORDER_TICKETS";
export const UPDATE_PURCHASE_ORDER = "UPDATE_PURCHASE_ORDER";
export const PURCHASE_ORDER_UPDATED = "PURCHASE_ORDER_UPDATED";
export const PURCHASE_ORDER_ADDED = "PURCHASE_ORDER_ADDED";
export const PURCHASE_ORDER_DELETED = "PURCHASE_ORDER_DELETED";
export const PURCHASE_ORDER_CANCEL_REFUND = "PURCHASE_ORDER_CANCEL_REFUND";
export const RESET_PURCHASE_ORDER_FORM = "RESET_PURCHASE_ORDER_FORM";
export const ORDER_EMAIL_SENT = "ORDER_EMAIL_SENT";
export const RECEIVE_PURCHASE_ORDER_REFUNDS = "RECEIVE_PURCHASE_ORDER_REFUNDS";

export const RESET_ORDER_EXTRA_QUESTION_SUB_QUESTION_FORM =
  "RESET_ORDER_EXTRA_QUESTION_SUB_QUESTION_FORM";
export const REQUEST_ORDER_EXTRA_QUESTION_SUB_QUESTION =
  "REQUEST_ORDER_EXTRA_QUESTION_SUB_QUESTION";
export const RECEIVE_ORDER_EXTRA_QUESTION_SUB_QUESTION =
  "RECEIVE_ORDER_EXTRA_QUESTION_SUB_QUESTION";
export const UPDATE_ORDER_EXTRA_QUESTION_SUB_QUESTION =
  "UPDATE_ORDER_EXTRA_QUESTION_SUB_QUESTION";
export const ORDER_EXTRA_QUESTION_SUB_QUESTION_UPDATED =
  "ORDER_EXTRA_QUESTION_SUB_QUESTION_UPDATED";
export const ORDER_EXTRA_QUESTION_SUB_QUESTION_ADDED =
  "ORDER_EXTRA_QUESTION_SUB_QUESTION_ADDED";
export const ORDER_EXTRA_QUESTION_SUB_QUESTION_DELETED =
  "ORDER_EXTRA_QUESTION_SUB_QUESTION_DELETED";
export const ORDER_EXTRA_QUESTION_SUB_QUESTION_ORDER_UPDATED =
  "ORDER_EXTRA_QUESTION_SUB_QUESTION_ORDER_UPDATED";

/** *********************  ORDER EXTRA QUESTIONS  ****************************************** */

const normalizeQuestion = (entity) => {
  const normalizedEntity = { ...entity };
  if (normalizedEntity.max_selected_values) {
    normalizedEntity.max_selected_values = parseInt(
      normalizedEntity.max_selected_values
    );
  }
  if (normalizedEntity.allowed_ticket_types?.length > 0) {
    normalizedEntity.allowed_ticket_types = entity.allowed_ticket_types.map(
      (tt) => (tt.hasOwnProperty("id") ? tt.id : tt)
    );
  }
  return normalizedEntity;
};

export const getOrderExtraQuestionMeta = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_ORDER_EXTRA_QUESTION_META),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/metadata`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const getOrderExtraQuestions = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    page: 1,
    per_page: 100,
    order: "+order",
    access_token: accessToken,
    expand: "values"
  };

  return getRequest(
    createAction(REQUEST_ORDER_EXTRA_QUESTIONS),
    createAction(RECEIVE_ORDER_EXTRA_QUESTIONS),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const getMainOrderExtraQuestions = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const apiUrl = URI(
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions`
  );
  apiUrl.addQuery("filter[]", "class==MainQuestion");
  apiUrl.addQuery("filter[]", "usage==Ticket");
  apiUrl.addQuery("expand", "*sub_question_rules,*sub_question,*values");
  apiUrl.addQuery("access_token", accessToken);
  apiUrl.addQuery("order", "order");
  apiUrl.addQuery("page", DEFAULT_CURRENT_PAGE);
  apiUrl.addQuery("per_page", DEFAULT_EXTRA_QUESTIONS_PER_PAGE);

  return getRequest(
    null,
    createAction(RECEIVE_MAIN_ORDER_EXTRA_QUESTIONS),
    `${apiUrl}`,
    authErrorHandler
  )({})(dispatch)
    .then(() => {
      dispatch(stopLoading());
    })
    .catch((e) => {
      dispatch(stopLoading());
      return Promise.reject(e);
    });
};

export const getOrderExtraQuestion =
  (orderExtraQuestionId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand:
        "values,sub_question_rules,allowed_ticket_types,sub_question_rules.sub_question",
      fields:
        "allowed_ticket_types.id, allowed_ticket_types.name,sub_question_rules.sub_question.name"
    };

    return getRequest(
      null,
      createAction(RECEIVE_ORDER_EXTRA_QUESTION),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetOrderExtraQuestionForm = () => (dispatch) => {
  dispatch(createAction(RESET_ORDER_EXTRA_QUESTION_FORM)({}));
};

export const saveOrderExtraQuestion =
  (entity) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    const normalizedEntity = normalizeQuestion(entity);

    if (entity.id) {
      return putRequest(
        createAction(UPDATE_ORDER_EXTRA_QUESTION),
        createAction(ORDER_EXTRA_QUESTION_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(
          showSuccessMessage(
            T.translate("edit_order_extra_question.order_extra_question_saved")
          )
        );
      });
    }

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate(
        "edit_order_extra_question.order_extra_question_created"
      ),
      type: "success"
    };

    return postRequest(
      createAction(UPDATE_ORDER_EXTRA_QUESTION),
      createAction(ORDER_EXTRA_QUESTION_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/order-extra-questions/${payload.response.id}`
          );
        })
      );
    });
  };

export const deleteOrderExtraQuestion =
  (orderExtraQuestionId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ORDER_EXTRA_QUESTION_DELETED)({ orderExtraQuestionId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const updateOrderExtraQuestionOrder =
  (questions, questionId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    const question = questions.find((q) => q.id === questionId);

    putRequest(
      null,
      createAction(ORDER_EXTRA_QUESTION_ORDER_UPDATED)(questions),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${questionId}`,
      question,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/**
 * @param orderExtraQuestionId
 * @param entity
 * @returns {(function(*=, *): Promise<*>)|*}
 */
export const saveOrderExtraQuestionValue =
  (orderExtraQuestionId, entity) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    if (entity.id) {
      return putRequest(
        createAction(UPDATE_ORDER_EXTRA_QUESTION_VALUE),
        createAction(ORDER_EXTRA_QUESTION_VALUE_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}/values/${entity.id}`,
        entity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(stopLoading());
      });
    }

    return postRequest(
      createAction(UPDATE_ORDER_EXTRA_QUESTION_VALUE),
      createAction(ORDER_EXTRA_QUESTION_VALUE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}/values`,
      entity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/**
 *
 * @param values
 * @param valueId
 * @param newOrder
 * @returns {function(*=, *): *}
 */
export const updateOrderExtraQuestionValueOrder =
  (values, valueId, newOrder) => async (dispatch, getState) => {
    const { currentOrderExtraQuestionState } = getState();
    const accessToken = await getAccessTokenSafely();
    const {
      entity: { summit_id, id }
    } = currentOrderExtraQuestionState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return putRequest(
      createAction(UPDATE_ORDER_EXTRA_QUESTION_VALUE),
      createAction(ORDER_EXTRA_QUESTION_VALUE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${summit_id}/order-extra-questions/${id}/values/${valueId}`,
      { order: newOrder },
      authErrorHandler,
      { order: newOrder, id: valueId }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteOrderExtraQuestionValue =
  (orderExtraQuestionId, orderExtraQuestionValueId) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ORDER_EXTRA_QUESTION_VALUE_DELETED)({
        orderExtraQuestionValueId
      }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/order-extra-questions/${orderExtraQuestionId}/values/${orderExtraQuestionValueId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const parsePurchaseOrdersFilters = (filters, term = null) => {
  const filter = [];

  if (filters.amount_paid_filter) {
    filter.push(
      `amount${filters.amount_paid_filter === "free" ? "==0" : ">0"}`
    );
  }

  if (
    filters.hasOwnProperty("company_filter") &&
    Array.isArray(filters.company_filter) &&
    filters.company_filter.length > 0
  ) {
    filter.push(
      `owner_company==${filters.company_filter
        .map((c) => escapeFilterValue(c.name))
        .join("||")}`
    );
  }

  if (filters.purchase_date_filter) {
    parseDateRangeFilter(filter, filters.purchase_date_filter, "created");
  }

  if (filters.payment_method_filter) {
    filter.push(`payment_method==${filters.payment_method_filter}`);
  }

  if (term) {
    const escapedTerm = escapeFilterValue(term);

    const searchString =
      `ticket_number=@${escapedTerm},` +
      `ticket_owner_email=@${escapedTerm},` +
      `ticket_owner_name=@${escapedTerm},` +
      `number=@${escapedTerm},` +
      `owner_name=@${escapedTerm},` +
      `owner_email=@${escapedTerm},`;

    filter.push(searchString);
  }

  return checkOrFilter(filters, filter);
};

/** ************************  PURCHASE ORDERS  ***************************** */

const normalizePurchaseOrder = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.amount;
  delete normalizedEntity.created;
  delete normalizedEntity.discount_amount;
  delete normalizedEntity.extra_question_answers;
  delete normalizedEntity.hash_creation_date;
  delete normalizedEntity.hash;
  delete normalizedEntity.id;
  delete normalizedEntity.last_edited;
  delete normalizedEntity.payment_gateway_cart_id;
  delete normalizedEntity.payment_gateway_client_token;
  delete normalizedEntity.payment_method;
  delete normalizedEntity.raw_amount;
  delete normalizedEntity.status;
  delete normalizedEntity.taxes_amount;
  delete normalizedEntity.owner_id;

  if (normalizedEntity.owner != null) {
    normalizedEntity.owner_email = normalizedEntity.owner.email;
    normalizedEntity.owner_first_name = normalizedEntity.owner.first_name;
    normalizedEntity.owner_last_name = normalizedEntity.owner.last_name;
    delete normalizedEntity.owner;
  }

  if (normalizedEntity.promo_code != null) {
    normalizedEntity.promo_code = normalizedEntity.promo_code.code;
  }

  if (!normalizedEntity.owner_company_id) {
    delete normalizedEntity.owner_company_id;
  }

  if (normalizedEntity.ticket_type_id != null) {
    normalizedEntity.ticket_type_id = normalizedEntity.ticket_type_id.id;
  }

  delete normalizedEntity.extra_questions;

  return normalizedEntity;
};

export const getPurchaseOrders =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const summitTZ = currentSummit.time_zone.name;

    dispatch(startLoading());

    const params = {
      expand: "",
      fields:
        "id,created,number,owner_id,owner_first_name,owner_last_name,owner_email,owner_company,currency_symbol,amount,payment_method,status",
      page,
      per_page: perPage,
      access_token: accessToken
    };

    const filter = parsePurchaseOrdersFilters(filters, term);

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      let tempOrder = order;
      // order translation
      if (tempOrder === "bought_date") tempOrder = "created";
      params.order = `${orderDirSign}${tempOrder}`;
    }

    return getRequest(
      createAction(REQUEST_PURCHASE_ORDERS),
      createAction(RECEIVE_PURCHASE_ORDERS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders`,
      authErrorHandler,
      { page, perPage, order, orderDir, summitTZ, term, filters }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getPurchaseOrder = (orderId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "applied_taxes",
    relations: "applied_taxes"
  };

  return getRequest(
    null,
    createAction(RECEIVE_PURCHASE_ORDER),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    // load tickets on separate request bc performance issues ( there are orders with over 100 tickets )
    getOrderTickets(orderId, 1)(dispatch, getState);
  });
};

export const getOrderTickets =
  (orderId, page = DEFAULT_CURRENT_PAGE) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page,
      per_page: DEFAULT_PER_PAGE,
      access_token: accessToken,
      expand: "owner,owner.member,ticket_type,promo_code",
      relations:
        "applied_taxes,owner.member.none,ticket_type.none,owner.member,promo_code.none",
      fields:
        "ticket_type.name,owner.id,owner.first_name,owner.last_name,owner.email,owner.member.id,owner.member.email,owner.member.first_name,owner.member.last_name,promo_code.code",
      "filter[]": `order_id==${orderId}`
    };

    return getRequest(
      null,
      createAction(RECEIVE_PURCHASE_ORDER_TICKETS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetPurchaseOrderForm = () => (dispatch) => {
  dispatch(createAction(RESET_PURCHASE_ORDER_FORM)({}));
};

export const savePurchaseOrder = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand:
      "extra_questions, tickets, tickets.owner, tickets.owner.member, tickets.ticket_type"
  };

  const normalizedEntity = normalizePurchaseOrder(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_PURCHASE_ORDER),
      createAction(PURCHASE_ORDER_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch)
      .then(() => {
        dispatch(stopLoading());
        dispatch(
          showSuccessMessage(T.translate("edit_purchase_order.order_saved"))
        );
      })
      .catch(() => dispatch(stopLoading()));
  }

  const success_message = {
    title: T.translate("general.done"),
    html: T.translate("edit_purchase_order.order_created"),
    type: "success"
  };

  return postRequest(
    createAction(UPDATE_PURCHASE_ORDER),
    createAction(PURCHASE_ORDER_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then((payload) => {
    dispatch(
      showMessage(success_message, () => {
        history.push(
          `/app/summits/${currentSummit.id}/purchase-orders/${payload.response.id}`
        );
      })
    );
  });
};

export const addTicketsToOrder =
  (orderId, typeId, qty, promoCode = null) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand:
        "extra_questions, tickets, tickets.owner, tickets.owner.member, tickets.ticket_type"
    };

    const payload = {
      ticket_type_id: typeId,
      ticket_qty: qty
    };

    if (promoCode) {
      payload.promo_code = promoCode.code;
    }

    return postRequest(
      null,
      createAction(PURCHASE_ORDER_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}/tickets`,
      payload,
      authErrorHandler
    )(params)(dispatch)
      .then(() => {
        // load tickets on separate request bc performance issues ( there are orders with over 100 tickets )
        getOrderTickets(orderId, 1)(dispatch, getState);
      })
      .catch(() => dispatch(stopLoading()));
  };

export const deletePurchaseOrder = (orderId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  const success_message = {
    title: T.translate("general.done"),
    html: T.translate("edit_purchase_order.order_deleted"),
    type: "success"
  };

  return deleteRequest(
    null,
    createAction(PURCHASE_ORDER_DELETED)({ orderId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(
      showMessage(success_message, () => {
        history.push(`/app/summits/${currentSummit.id}/purchase-orders`);
      })
    );
  });
};

export const reSendOrderEmail = (orderId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return putRequest(
    null,
    createAction(ORDER_EMAIL_SENT)({ orderId }),
    `${window.API_BASE_URL}/api/v1/summits/all/orders/${orderId}/resend`,
    {},
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(
      showSuccessMessage(T.translate("edit_purchase_order.email_resent"))
    );
  });
};

export const getPurchaseOrderRefunds =
  (orderId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      per_page: 100,
      expand:
        "refunded_taxes, refunded_taxes.tax, ticket, ticket.applied_taxes",
      order: "+action_date",
      access_token: accessToken
    };

    return getRequest(
      null,
      createAction(RECEIVE_PURCHASE_ORDER_REFUNDS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}/tickets/all/refund-requests/approved`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/** *************************  Sub Questions Rules ***************************** */

const normalizeSubRule = (entity) => {
  const normalizedEntity = { ...entity };

  if (entity.id === 0) delete normalizedEntity.id;

  return normalizedEntity;
};

export const resetOrderExtraQuestionSubQuestionForm = () => (dispatch) => {
  dispatch(createAction(RESET_ORDER_EXTRA_QUESTION_SUB_QUESTION_FORM)({}));
};

export const getOrderExtraQuestionsSubQuestionsRule =
  (orderExtraQuestionId, ruleId) => async (dispatch, getState) => {
    const { currentOrderExtraQuestionState } = getState();
    const accessToken = await getAccessTokenSafely();
    const {
      entity: { summit_id }
    } = currentOrderExtraQuestionState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return getRequest(
      createAction(REQUEST_ORDER_EXTRA_QUESTION_SUB_QUESTION),
      createAction(RECEIVE_ORDER_EXTRA_QUESTION_SUB_QUESTION),
      `${window.API_BASE_URL}/api/v1/summits/${summit_id}/order-extra-questions/${orderExtraQuestionId}/sub-question-rules/${ruleId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveOrderExtraQuestionsSubQuestionsRule =
  (entity) => async (dispatch, getState) => {
    const { currentOrderExtraQuestionState } = getState();
    const accessToken = await getAccessTokenSafely();
    const {
      entity: { summit_id, id }
    } = currentOrderExtraQuestionState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "sub_question",
      fields: "sub_question.name",
      relations: "sub_question.none"
    };

    const normalizedEntity = normalizeSubRule(entity);

    if (entity.id) {
      return putRequest(
        createAction(UPDATE_ORDER_EXTRA_QUESTION_SUB_QUESTION),
        createAction(ORDER_EXTRA_QUESTION_SUB_QUESTION_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${summit_id}/order-extra-questions/${id}/sub-question-rules/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(
          showSuccessMessage(
            T.translate(
              "edit_order_extra_question_sub_rule.order_extra_question_sub_rule_saved"
            )
          )
        );
        history.push(
          `/app/summits/${summit_id}/order-extra-questions/${id}/sub-rule/${payload.response.id}`
        );
      });
    }

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate(
        "edit_order_extra_question_sub_rule.order_extra_question_sub_rule_created"
      ),
      type: "success"
    };

    return postRequest(
      createAction(UPDATE_ORDER_EXTRA_QUESTION_SUB_QUESTION),
      createAction(ORDER_EXTRA_QUESTION_SUB_QUESTION_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${summit_id}/order-extra-questions/${id}/sub-question-rules`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${summit_id}/order-extra-questions/${id}/sub-rule/${payload.response.id}`
          );
        })
      );
    });
  };

export const updateOrderExtraQuestionsSubQuestionsRuleOrder =
  (rules, ruleId, newOrder) => async (dispatch, getState) => {
    const { currentOrderExtraQuestionState } = getState();
    const accessToken = await getAccessTokenSafely();
    const {
      entity: { summit_id, id }
    } = currentOrderExtraQuestionState;

    const params = {
      access_token: accessToken
    };

    putRequest(
      null,
      createAction(ORDER_EXTRA_QUESTION_SUB_QUESTION_ORDER_UPDATED)(rules),
      `${window.API_BASE_URL}/api/v1/summits/${summit_id}/order-extra-questions/${id}/sub-question-rules/${ruleId}`,
      { order: newOrder },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteOrderExtraQuestionsSubQuestionsRule =
  (orderExtraQuestionId, ruleId) => async (dispatch, getState) => {
    const { currentOrderExtraQuestionState } = getState();
    const accessToken = await getAccessTokenSafely();
    const {
      entity: { summit_id }
    } = currentOrderExtraQuestionState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ORDER_EXTRA_QUESTION_SUB_QUESTION_DELETED)({ ruleId }),
      `${window.API_BASE_URL}/api/v1/summits/${summit_id}/order-extra-questions/${orderExtraQuestionId}/sub-question-rules/${ruleId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
