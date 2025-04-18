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
 */

import T from "i18n-react/dist/i18n-react";
import {
  authErrorHandler,
  createAction,
  deleteRequest,
  downloadFileByContent,
  escapeFilterValue,
  getRawCSV,
  getRequest,
  postRequest,
  putRequest,
  showMessage,
  showSuccessMessage,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import URI from "urijs";
import Swal from "sweetalert2";

import {
  getAccessTokenSafely,
  isNumericString,
  checkOrFilter,
  joinCVSChunks
} from "../utils/methods";

import history from "../history";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_EXPORT_PAGE_SIZE,
  ERROR_CODE_412
} from "../utils/constants";

export const REQUEST_TICKETS = "REQUEST_TICKETS";
export const RECEIVE_TICKETS = "RECEIVE_TICKETS";
export const EXTERNAL_TICKETS_INGESTED = "EXTERNAL_TICKETS_INGESTED";
export const TICKETS_IMPORTED = "TICKETS_IMPORTED";
export const RECEIVE_TICKET = "RECEIVE_TICKET";
export const UPDATE_TICKET = "UPDATE_TICKET";
export const TICKET_UPDATED = "TICKET_UPDATED";
export const TICKET_SAVED = "TICKET_SAVED";
export const TICKET_REFUNDED = "TICKET_REFUNDED";
export const TICKET_CANCEL_REFUND = "TICKET_CANCEL_REFUND";
export const TICKET_MEMBER_REASSIGNED = "TICKET_MEMBER_REASSIGNED";
export const BADGE_ADDED_TO_TICKET = "BADGE_ADDED_TO_TICKET";
export const TICKET_EMAIL_SENT = "TICKET_EMAIL_SENT";

export const REQUEST_TICKET_TYPES = "REQUEST_TICKET_TYPES";
export const RECEIVE_TICKET_TYPES = "RECEIVE_TICKET_TYPES";
export const UPDATE_TICKET_TYPES_CURRENCY = "UPDATE_TICKET_TYPES_CURRENCY";
export const TICKET_TYPES_CURRENCY_UPDATED = "TICKET_TYPES_CURRENCY_UPDATED";
export const RECEIVE_TICKET_TYPE = "RECEIVE_TICKET_TYPE";
export const RESET_TICKET_TYPE_FORM = "RESET_TICKET_TYPE_FORM";
export const UPDATE_TICKET_TYPE = "UPDATE_TICKET_TYPE";
export const TICKET_TYPE_UPDATED = "TICKET_TYPE_UPDATED";
export const TICKET_TYPE_ADDED = "TICKET_TYPE_ADDED";
export const TICKET_TYPE_DELETED = "TICKET_TYPE_DELETED";
export const TICKET_TYPES_SEEDED = "TICKET_TYPES_SEEDED";

export const REQUEST_REFUND_POLICIES = "REQUEST_REFUND_POLICIES";
export const RECEIVE_REFUND_POLICIES = "RECEIVE_REFUND_POLICIES";
export const REFUND_POLICY_ADDED = "REFUND_POLICY_ADDED";
export const REFUND_POLICY_UPDATED = "REFUND_POLICY_UPDATED";
export const REFUND_POLICY_DELETED = "REFUND_POLICY_DELETED";

export const REQUEST_PAYMENT_PROFILES = "REQUEST_PAYMENT_PROFILES";
export const UPDATE_PAYMENT_PROFILE = "UPDATE_PAYMENT_PROFILE";
export const RECEIVE_PAYMENT_PROFILES = "RECEIVE_PAYMENT_PROFILES";
export const PAYMENT_PROFILE_ADDED = "PAYMENT_PROFILE_ADDED";
export const PAYMENT_PROFILE_UPDATED = "PAYMENT_PROFILE_UPDATED";
export const PAYMENT_PROFILE_DELETED = "PAYMENT_PROFILE_DELETED";
export const RECEIVE_PAYMENT_PROFILE = "RECEIVE_PAYMENT_PROFILE";

export const RESET_PAYMENT_PROFILE_FORM = "RESET_PAYMENT_PROFILE_FORM";

// selection
export const SELECT_TICKET = "SELECT_TICKET";
export const UNSELECT_TICKET = "UNSELECT_TICKET";
export const CLEAR_ALL_SELECTED_TICKETS = "CLEAR_ALL_SELECTED_TICKETS";
export const SET_SELECTED_ALL_TICKETS = "SET_SELECTED_ALL_TICKETS";
export const PRINT_TICKETS = "PRINT_TICKETS";

export const customErrorHandler = (ticketId, err, res) => (dispatch) => {
  const code = err.status;

  dispatch(stopLoading());

  switch (code) {
    case ERROR_CODE_412:
      Swal.fire(
        "Validation error",
        `Ticket number ${ticketId} not found.`,
        "warning"
      );
      break;
    default:
      dispatch(authErrorHandler(err, res));
  }
};

const normalizeTicket = (entity) => {
  const normalizedEntity = { ...entity };

  // if no owner then we are assigning the tix to someone
  if (!normalizedEntity.owner && normalizedEntity.attendee) {
    normalizedEntity.attendee_first_name = normalizedEntity.attendee.first_name;
    normalizedEntity.attendee_last_name = normalizedEntity.attendee.last_name;
    normalizedEntity.attendee_email = normalizedEntity.attendee.email;
  }

  if (normalizedEntity.hasOwnProperty("ticket_type")) {
    normalizedEntity.ticket_type_id = normalizedEntity.ticket_type?.id;
    delete normalizedEntity.ticket_type;
  }

  delete normalizedEntity.id;
  delete normalizedEntity.badge;
  delete normalizedEntity.attendee;
  delete normalizedEntity.owner;
  delete normalizedEntity.owner_id;
  delete normalizedEntity.owner_full_name;
  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;
  delete normalizedEntity.promocode;
  delete normalizedEntity.promocode_id;
  delete normalizedEntity.promocode_name;

  return normalizedEntity;
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  if (!normalizedEntity.external_id) delete normalizedEntity.external_id;

  if (!normalizedEntity.badge_type_id) delete normalizedEntity.badge_type_id;

  // clear dates
  if (entity.sales_start_date === 0) {
    normalizedEntity.sales_start_date = "";
  }

  if (entity.sales_end_date === 0) {
    normalizedEntity.sales_end_date = "";
  }

  delete normalizedEntity.id;

  return normalizedEntity;
};

// **************************   TICKETS   ******************************************/

const parseFilters = (filters, term = null) => {
  const filter = [];

  if (filters?.showOnlyPendingRefundRequests) {
    filter.push("has_requested_refund_requests==1");
  }

  if (filters?.showOnlyPrintable) {
    filter.push("is_printable==1");
  }

  if (filters?.excludeFreeUnassigned) {
    filter.push("exclude_is_printable_free_unassigned==1");
  }

  if (filters?.hasOwnerFilter) {
    if (filters.hasOwnerFilter === "HAS_OWNER") filter.push("has_owner==1");
    if (filters.hasOwnerFilter === "HAS_NO_OWNER") filter.push("has_owner==0");
  }

  if (filters?.isActiveFilter) {
    if (filters.isActiveFilter === "IS_ACTIVE") filter.push("is_active==1");
    if (filters.isActiveFilter === "IS_NOT_ACTIVE") filter.push("is_active==0");
  }

  if (filters?.hasBadgeFilter) {
    if (filters.hasBadgeFilter === "HAS_BADGE") filter.push("has_badge==1");
    if (filters.hasBadgeFilter === "HAS_NO_BADGE") filter.push("has_badge==0");
  }

  if (filters?.ticketTypesFilter?.length > 0) {
    filter.push(
      filters.ticketTypesFilter.reduce(
        (accumulator, tt) =>
          `${accumulator}${accumulator !== "" ? "," : ""}ticket_type_id==${
            tt.value
          }`,
        ""
      )
    );
  }

  if (filters?.badgeTypesFilter?.length > 0) {
    filter.push(
      filters.badgeTypesFilter.reduce(
        (accumulator, tt) =>
          `${accumulator}${accumulator !== "" ? "," : ""}badge_type_id==${
            tt.value
          }`,
        ""
      )
    );
  }

  if (filters?.viewTypesFilter?.length > 0) {
    filter.push(
      filters.viewTypesFilter.reduce(
        (accumulator, tt) =>
          `${accumulator}${accumulator !== "" ? "," : ""}view_type_id==${
            tt.value
          }`,
        ""
      )
    );
  }

  if (filters.promocodesFilter?.length > 0) {
    filter.push(
      filters.promocodesFilter.reduce(
        (accumulator, tt) =>
          `${accumulator}${accumulator !== "" ? "," : ""}promo_code_id==${
            tt.id
          }`,
        ""
      )
    );
  }

  if (filters?.completedFilter) {
    filter.push(`owner_status==${filters.completedFilter}`);
  }

  if (filters?.amountFilter) {
    if (filters.amountFilter === "Paid") filter.push("final_amount>0");
    if (filters.amountFilter === "Free") filter.push("final_amount==0");
  }

  if (filters.ownerFullNameStartWithFilter?.length > 0) {
    filter.push(
      filters.ownerFullNameStartWithFilter.reduce(
        (accumulator, alpha) =>
          `${accumulator}${accumulator !== "" ? "," : ""}owner_first_name@@${
            alpha.value
          }`,
        ""
      )
    );
  }

  if (filters.ownerLastNameStartWithFilter?.length > 0) {
    filter.push(
      filters.ownerLastNameStartWithFilter.reduce(
        (accumulator, alpha) =>
          `${accumulator}${accumulator !== "" ? "," : ""}owner_last_name@@${
            alpha.value
          }`,
        ""
      )
    );
  }

  if (filters?.ownerCompany?.length > 0) {
    const nonTBD = filters?.ownerCompany.filter((of) => of.id !== "NULL");
    const ownerCompany = [];

    // has tbd
    if (nonTBD.length < filters?.ownerCompany?.length) {
      ownerCompany.push("has_owner_company==0");
    }

    if (nonTBD.length > 0) {
      ownerCompany.push(
        `owner_company==${nonTBD
          .map((of) => encodeURIComponent(of.name))
          .join("||")}`
      );
    }

    filter.push(ownerCompany.join(","));
  }

  if (filters.audienceFilter?.length > 0) {
    filter.push(
      filters.audienceFilter.reduce(
        (accumulator, aud) =>
          `${accumulator}${accumulator !== "" ? "," : ""}audience==${aud}`,
        ""
      )
    );
  }

  if (filters.promocodeTagsFilter?.length > 0) {
    filter.push(
      filters.promocodeTagsFilter.reduce(
        (accumulator, t) =>
          `${accumulator}${accumulator !== "" ? "," : ""}promo_code_tag==${
            t.tag
          }`,
        ""
      )
    );
  }

  if (filters.accessLevelFilter?.length > 0) {
    filter.push(
      `access_level_type_id==${filters.accessLevelFilter
        .map((al) => al.id)
        .join("||")}`
    );
  }

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    let searchString = `number=@${escapedTerm},owner_email=@${escapedTerm},owner_name=@${escapedTerm},owner_company=@${escapedTerm},promo_code=@${escapedTerm},promo_code_description=@${escapedTerm},promo_code_tag=@${escapedTerm}`;
    searchString = isNumericString(escapedTerm)
      ? `${searchString},promo_code_tag_id==${escapedTerm}`
      : searchString;
    filter.push(searchString);
  }

  return checkOrFilter(filters, filter);
};

const parseTicketTypeFilters = (filters, term = null) => {
  const filter = [];

  if (filters.audience_filter?.length > 0) {
    filter.push(
      filters.audience_filter.reduce(
        (accumulator, aud) =>
          `${accumulator}${accumulator !== "" ? "," : ""}audience==${aud}`,
        ""
      )
    );
  }

  if (
    filters.hasOwnProperty("badge_type_filter") &&
    Array.isArray(filters.badge_type_filter) &&
    filters.badge_type_filter.length > 0
  ) {
    filter.push(`badge_type_id==${filters.badge_type_filter.join("||")}`);
  }

  if (
    filters.sale_period_filter &&
    filters.sale_period_filter.some((e) => e !== null)
  ) {
    if (filters.sale_period_filter.every((e) => e !== null)) {
      filter.push(
        `sales_start_date>=${filters.sale_period_filter[0]}`,
        `sales_end_date<=${filters.sale_period_filter[1]}`
      );
    } else {
      filter.push(
        `${
          filters.sale_period_filter[0] !== null &&
          filters.sale_period_filter[0] !== 0
            ? `sales_start_date>=${filters.sale_period_filter[0]}`
            : ""
        }${
          filters.sale_period_filter[1] !== null &&
          filters.sale_period_filter[1] !== 0
            ? `sales_end_date<=${filters.sale_period_filter[1]}`
            : ""
        }`
      );
    }
  }

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    let searchString = `name@@${escapedTerm},description@@${escapedTerm}`;

    if (isNumericString(term)) {
      searchString += `,id==${term}`;
    }

    filter.push(searchString);
  }

  return checkOrFilter(filters, filter);
};

export const selectTicket = (ticketId) => (dispatch) => {
  dispatch(createAction(SELECT_TICKET)(ticketId));
};

export const unSelectTicket = (ticketId) => (dispatch) => {
  dispatch(createAction(UNSELECT_TICKET)(ticketId));
};

export const clearAllSelectedTicket = () => (dispatch) => {
  dispatch(createAction(CLEAR_ALL_SELECTED_TICKETS)());
};
export const setSelectedAll = (value) => (dispatch) => {
  dispatch(createAction(SET_SELECTED_ALL_TICKETS)(value));
};

export const reSendTicketEmail = (orderId, ticketId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  return putRequest(
    null,
    createAction(TICKET_EMAIL_SENT)({ ticketId }),
    `${window.API_BASE_URL}/api/v1/summits/all/orders/${orderId}/tickets/${ticketId}/attendee/reinvite`,
    {},
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(showSuccessMessage(T.translate("edit_ticket.email_resent")));
  });
};

export const printTickets =
  (filters, doAttendeeCheckinOnPrint = true, selectedViewType = null) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentTicketListState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const { selectedIds, excludedIds, selectedAll, term, order, orderDir } =
      currentTicketListState;
    let filter = [];

    dispatch(createAction(PRINT_TICKETS));

    const params = {
      access_token: accessToken
    };

    if (!selectedAll && selectedIds.length > 0) {
      // we don"t need the filter criteria, we have the ids
      filter.push(`id==${selectedIds.join("||")}`);
    } else {
      filter = parseFilters(filters, term);

      if (selectedAll && excludedIds.length > 0) {
        filter.push(`not_id==${excludedIds.join("||")}`);
      }
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    params.check_in = doAttendeeCheckinOnPrint;

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    if (selectedViewType) {
      params.view_type = selectedViewType;
    }

    const url = URI(
      `${process.env.PRINT_APP_URL}/check-in/${currentSummit.slug}/tickets`
    );

    window.open(url.query(params).toString(), "_blank");
  };

export const getTickets =
  (
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    filters = {},
    extraColumns = []
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const first_level_fields = [
      "id",
      "number",
      "refunded_amount",
      "status",
      "badge_prints_count",
      "bought_date",
      "currency",
      "currency_symbol",
      "discount",
      "external_order_id",
      "final_amount",
      "order_id"
    ];

    const second_level_fields = [
      "owner.first_name",
      "owner.last_name",
      "owner.company",
      "owner.email",
      "badge.type_id",
      "promo_code.code",
      "refund_requests.status",
      "promo_code.tags.tag",
      "ticket_type.name",
      "ticket_type.id"
    ];

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand:
        "owner,badge,promo_code,promo_code.tags,refund_requests,ticket_type",
      fields: `${first_level_fields.join(",")},${second_level_fields.join(
        ","
      )}`,
      relations:
        "owner.none,badge.none,promo_code.tags,refund_requests.none,ticket_type.none"
    };

    const filter = parseFilters(filters, term);

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      let auxOrder = order;
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      if (auxOrder === "badge_type_id") auxOrder = "badge_type";
      params.order = `${orderDirSign}${auxOrder}`;
    }

    return getRequest(
      createAction(REQUEST_TICKETS),
      createAction(RECEIVE_TICKETS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets`,
      authErrorHandler,
      { term, page, perPage, order, orderDir, filters, extraColumns }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const ingestExternalTickets = (email) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  const success_message = {
    title: T.translate("general.done"),
    html: T.translate("ticket_list.ingest_done"),
    type: "success"
  };

  return postRequest(
    null,
    createAction(EXTERNAL_TICKETS_INGESTED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/ingest`,
    { email_to: email },
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(
      showMessage(success_message, () => {
        window.location.reload();
      })
    );
  });
};

export const importTicketsCSV = (file) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  postRequest(
    null,
    createAction(TICKETS_IMPORTED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/csv`,
    file,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    window.location.reload();
  });
};

export const exportTicketsCSV =
  (
    term = "",
    pageSize = DEFAULT_EXPORT_PAGE_SIZE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    dispatch(startLoading());
    const csvMIME = "text/csv;charset=utf-8";
    const accessToken = await getAccessTokenSafely();
    const { currentSummitState, currentTicketListState } = getState();
    const { currentSummit } = currentSummitState;
    const { totalTickets } = currentTicketListState;

    const filename = `${currentSummit.name}-Tickets.csv`;
    const totalPages = Math.ceil(totalTickets / pageSize);

    const endpoint = `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/csv`;

    // create the params for the promises all ( only diff is the page nbr)

    const filter = parseFilters(filters, term);

    const params = Array.from({ length: totalPages }, (_, i) => {
      const res = {
        page: i + DEFAULT_CURRENT_PAGE,
        access_token: accessToken,
        per_page: pageSize
      };

      if (filter.length > 0) {
        res["filter[]"] = filter;
      }

      // order
      if (order != null && orderDir != null) {
        const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
        res.order = `${orderDirSign}${order}`;
      }

      return res;
    });

    // export CSV file by chunks ...
    Promise.all(params.map((p) => getRawCSV(endpoint, p)))
      .then((files) => {
        if (files.length > 0) {
          const cvs = joinCVSChunks(files);
          // then simulate the file download
          downloadFileByContent(filename, cvs, csvMIME);
        }
        dispatch(stopLoading());
      })
      .catch(() => {
        dispatch(stopLoading());
      });
  };

export const getTicket = (ticketId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand:
      "badge,badge.features,promo_code,ticket_type,owner,owner.member,refund_requests,refund_requests.requested_by,refund_requests.action_by,refund_requests.refunded_taxes,refund_requests.refunded_taxes.tax,applied_taxes,applied_taxes.tax"
  };

  return getRequest(
    null,
    createAction(RECEIVE_TICKET),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}`,
    (err, res) => customErrorHandler(ticketId, err, res)
  )(params)(dispatch).then((data) => {
    dispatch(stopLoading());
    return data.response;
  });
};

export const saveTicket = (orderId, ticket) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand:
      "badge,badge.features,promo_code,ticket_type,owner,owner.member,refund_requests,refund_requests.requested_by,refund_requests.action_by,refund_requests.refunded_taxes,refund_requests.refunded_taxes.tax,applied_taxes,applied_taxes.tax"
  };

  const normalizedEntity = normalizeTicket(ticket);

  return putRequest(
    null,
    createAction(TICKET_SAVED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}/tickets/${ticket.id}`,
    normalizedEntity,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const activateTicket =
  (orderId, ticketId, isActive) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    if (isActive)
      return putRequest(
        null,
        createAction(TICKET_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}/tickets/${ticketId}/activate`,
        {},
        authErrorHandler
      )(params)(dispatch).then(() => {
        dispatch(stopLoading());
      });

    return deleteRequest(
      null,
      createAction(TICKET_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/orders/${orderId}/tickets/${ticketId}/activate`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const reassignTicket =
  (ticketId, attendeeId, firstName, lastName, email, company) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_ticket.ticket_reassigned"),
      type: "success"
    };

    const attendee = {
      attendee_first_name: firstName,
      attendee_last_name: lastName,
      attendee_email: email,
      attendee_company: company
    };

    putRequest(
      null,
      createAction(TICKET_MEMBER_REASSIGNED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/tickets/${ticketId}/reassign`,
      attendee,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(
        showMessage(success_message, () => {
          window.location.reload();
        })
      );
    });
  };

// ** TICKET REFUNDS ** /

export const cancelRefundTicket =
  (orderId, ticketId, refundNotes = "") =>
  async (dispatch) => {
    dispatch(startLoading());
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken,
      expand:
        "badge,badge.features,promo_code,ticket_type,owner,owner.member,refund_requests,refund_requests.requested_by,refund_requests.action_by,refund_requests.refunded_taxes,refund_requests.refunded_taxes.tax,applied_taxes,applied_taxes.tax"
    };

    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_ticket.ticket_cancel_refund"),
      type: "success"
    };

    return deleteRequest(
      null,
      createAction(TICKET_CANCEL_REFUND),
      `${window.API_BASE_URL}/api/v1/summits/all/orders/${orderId}/tickets/${ticketId}/refund/cancel`,
      {
        notes: refundNotes
      },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      dispatch(showMessage(success_message));
    });
  };

export const refundTicket =
  (ticketId, refundAmount, refundNotes = "") =>
  async (dispatch, getState) => {
    dispatch(startLoading());

    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken,
      expand:
        "badge,badge.features,promo_code,ticket_type,owner,owner.member,refund_requests,refund_requests.requested_by,refund_requests.action_by,refund_requests.refunded_taxes,refund_requests.refunded_taxes.tax,applied_taxes,applied_taxes.tax"
    };

    return deleteRequest(
      null,
      createAction(TICKET_REFUNDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/refund`,
      {
        amount: refundAmount,
        notes: refundNotes
      },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      dispatch(showSuccessMessage(T.translate("edit_ticket.ticket_refunded")));
    });
  };

export const addBadgeToTicket = (ticketId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(BADGE_ADDED_TO_TICKET),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge`,
    {},
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

// **************************   TICKET TYPES   ******************************************/

export const getTicketTypes =
  (
    term = null,
    order = "name",
    orderDir = DEFAULT_ORDER_DIR,
    currentPage = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const summitTZ = currentSummit.time_zone.name;

    const params = {
      page: currentPage,
      per_page: perPage,
      access_token: accessToken,
      expand: "badge_type",
      relations: "badge_type,badge_type.none",
      fields:
        "id,audience,name,description,cost,external_id,quantity_2_sell,sales_end_date,sales_start_date,badge_type.name,badge_type.id"
    };

    const filter = parseTicketTypeFilters(filters, term);

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_TICKET_TYPES),
      createAction(RECEIVE_TICKET_TYPES),
      `${window.API_BASE_URL}/api/v2/summits/${currentSummit.id}/ticket-types`,
      authErrorHandler,
      { term, order, orderDir, currentPage, perPage, filters, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const changeTicketTypesCurrency =
  (currency) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    putRequest(
      createAction(UPDATE_TICKET_TYPES_CURRENCY),
      createAction(TICKET_TYPES_CURRENCY_UPDATED)({ currency }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/ticket-types/all/currency/${currency}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(T.translate("ticket_type_list.currency_updated"))
      );
    });
  };

export const getTicketType = (ticketTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_TICKET_TYPE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/ticket-types/${ticketTypeId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetTicketTypeForm = () => (dispatch) => {
  dispatch(createAction(RESET_TICKET_TYPE_FORM)({}));
};

export const saveTicketType = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    putRequest(
      createAction(UPDATE_TICKET_TYPE),
      createAction(TICKET_TYPE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/ticket-types/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(T.translate("edit_ticket_type.ticket_type_saved"))
      );
    });
  } else {
    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_ticket_type.ticket_type_created"),
      type: "success"
    };

    postRequest(
      createAction(UPDATE_TICKET_TYPE),
      createAction(TICKET_TYPE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/ticket-types`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        createAction(TICKET_TYPES_CURRENCY_UPDATED)({
          currency: payload.response.currency
        })
      );
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/ticket-types/${payload.response.id}`
          );
        })
      );
    });
  }
};

export const deleteTicketType =
  (ticketTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(TICKET_TYPE_DELETED)({ ticketTypeId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/ticket-types/${ticketTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const seedTicketTypes = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const params = {
    access_token: accessToken
  };

  postRequest(
    null,
    createAction(TICKET_TYPES_SEEDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/ticket-types/seed-defaults`,
    {},
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

// ***************************   REFUND POLICIES   ******************************/

export const getRefundPolicies = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    createAction(REQUEST_REFUND_POLICIES),
    createAction(RECEIVE_REFUND_POLICIES),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/refund-policies`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const saveRefundPolicy = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  if (entity.id) {
    putRequest(
      null,
      createAction(REFUND_POLICY_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/refund-policies/${entity.id}`,
      entity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  } else {
    postRequest(
      null,
      createAction(REFUND_POLICY_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/refund-policies`,
      entity,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  }
};

export const deleteRefundPolicy =
  (refundPolicyId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(REFUND_POLICY_DELETED)({ refundPolicyId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/refund-policies/${refundPolicyId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

// ***************************   PAYMENT PROFILES   ******************************/

export const getPaymentProfiles =
  (
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_PAYMENT_PROFILES),
      createAction(RECEIVE_PAYMENT_PROFILES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/payment-gateway-profiles`,
      authErrorHandler,
      { page, perPage, order, orderDir }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const savePaymentProfile = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  if (entity.id) {
    putRequest(
      createAction(UPDATE_PAYMENT_PROFILE),
      createAction(PAYMENT_PROFILE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/payment-gateway-profiles/${entity.id}`,
      entity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(
          T.translate("edit_payment_profile.payment_profile_saved")
        )
      );
    });
    return;
  }

  const success_message = {
    title: T.translate("general.done"),
    html: T.translate("edit_payment_profile.payment_profile_created"),
    type: "success"
  };

  postRequest(
    createAction(UPDATE_PAYMENT_PROFILE),
    createAction(PAYMENT_PROFILE_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/payment-gateway-profiles`,
    entity,
    authErrorHandler
  )(params)(dispatch).then((payload) => {
    dispatch(
      showMessage(success_message, () => {
        history.push(
          `/app/summits/${currentSummit.id}/payment-profiles/${payload.response.id}`
        );
      })
    );
  });
};

export const deletePaymentProfile =
  (paymentProfileId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(PAYMENT_PROFILE_DELETED)({ paymentProfileId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/payment-gateway-profiles/${paymentProfileId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getPaymentProfile =
  (paymentProfileId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return getRequest(
      null,
      createAction(RECEIVE_PAYMENT_PROFILE),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/payment-gateway-profiles/${paymentProfileId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetPaymentProfileForm = () => (dispatch) => {
  dispatch(createAction(RESET_PAYMENT_PROFILE_FORM)({}));
};
