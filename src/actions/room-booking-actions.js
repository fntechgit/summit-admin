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
  getCSV,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import Swal from "sweetalert2";
import history from "../history";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE, ERROR_CODE_412 } from "../utils/constants";

export const REQUEST_ROOM_BOOKINGS = "REQUEST_ROOM_BOOKINGS";
export const RECEIVE_ROOM_BOOKINGS = "RECEIVE_ROOM_BOOKINGS";
export const RECEIVE_ROOM_BOOKING = "RECEIVE_ROOM_BOOKING";
export const RESET_ROOM_BOOKING_FORM = "RESET_ROOM_BOOKING_FORM";
export const ROOM_BOOKING_UPDATED = "ROOM_BOOKING_UPDATED";
export const ROOM_BOOKING_ADDED = "ROOM_BOOKING_ADDED";
export const ROOM_BOOKING_DELETED = "ROOM_BOOKING_DELETED";
export const RECEIVE_ROOM_BOOKING_ATTRIBUTE_TYPE =
  "RECEIVE_ROOM_BOOKING_ATTRIBUTE_TYPE";
export const RESET_ROOM_BOOKING_ATTRIBUTE_TYPE_FORM =
  "RESET_ROOM_BOOKING_ATTRIBUTE_TYPE_FORM";
export const UPDATE_ROOM_BOOKING_ATTRIBUTE_TYPE =
  "UPDATE_ROOM_BOOKING_ATTRIBUTE_TYPE";
export const ROOM_BOOKING_ATTRIBUTE_TYPE_UPDATED =
  "ROOM_BOOKING_ATTRIBUTE_TYPE_UPDATED";
export const ROOM_BOOKING_ATTRIBUTE_TYPE_ADDED =
  "ROOM_BOOKING_ATTRIBUTE_TYPE_ADDED";
export const ROOM_BOOKING_ATTRIBUTE_TYPE_DELETED =
  "ROOM_BOOKING_ATTRIBUTE_TYPE_DELETED";
export const UPDATE_ROOM_BOOKING_ATTRIBUTE = "UPDATE_ROOM_BOOKING_ATTRIBUTE";
export const ROOM_BOOKING_ATTRIBUTE_UPDATED = "ROOM_BOOKING_ATTRIBUTE_UPDATED";
export const ROOM_BOOKING_ATTRIBUTE_ADDED = "ROOM_BOOKING_ATTRIBUTE_ADDED";
export const ROOM_BOOKING_ATTRIBUTE_DELETED = "ROOM_BOOKING_ATTRIBUTE_DELETED";
export const ROOM_BOOKING_REFUNDED = "ROOM_BOOKING_REFUNDED";

export const RECEIVE_ROOM_BOOKING_AVAILABILITY =
  "RECEIVE_ROOM_BOOKING_AVAILABILITY";

const normalizeEntity = (entity) => ({ ...entity });

const parseFilters = (filters, term) => {
  const filter = [];
  if (term) {
    const escapedTerm = escapeFilterValue(term);
    filter.push(`owner_name=@${escapedTerm},room_name=@${escapedTerm}`);
  }

  if (filters?.email_filter) {
    if (filters.email_filter.operator && filters.email_filter.value)
      filter.push(
        `${filters.email_filter.operator}${escapeFilterValue(
          filters.email_filter.value
        )}`
      );
  }

  return filter;
};

export const customErrorHandler = (err, res) => (dispatch) => {
  const code = err.status;
  let msg = "";

  dispatch(stopLoading());

  switch (code) {
    case ERROR_CODE_412:
      if (Array.isArray(err.response.body)) {
        err.response.body.forEach((er) => {
          msg += `${er}<br>`;
        });
      } else {
        Object.entries(err.response.body).forEach(([key, value]) => {
          if (Number.isNaN(key)) {
            msg += `${key}: `;

            msg += `${value}<br>`;
          }
        });

        Swal.fire("Validation error", msg, "warning");
        /*
            // what is this supposed to do ?
            // https://github.com/fntechgit/summit-admin/commit/35d0dbc7e33e80aa048a81cbb509def818252a9f#diff-ae402a00f2844d1d704595a03ed7cbc6b53086fe03a43ffcdfa3706c17a41544R516
            .then(() =>
              dispatch(getOfflineBookingRoomAvailability(roomId, day))
            );
           */

        if (err.response.body.errors) {
          dispatch({
            type: "VALIDATE",
            payload: { errors: err.response.body }
          });
        }
      }
      break;
    default:
      dispatch(authErrorHandler(err, res));
  }
};

export const getRoomBookings =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "start_datetime",
    orderDir = 1,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());
    const filter = parseFilters(filters, term);

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "owner, room"
    };

    filter.push("status==Paid||Reserved||RequestedRefund||Refunded");

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_ROOM_BOOKINGS),
      createAction(RECEIVE_ROOM_BOOKINGS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/all/reservations`,
      authErrorHandler,
      { order, orderDir, term, filters }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const exportRoomBookings =
  (term = null, order = "start_datetime", orderDir = 1, filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filename = `${currentSummit.name}-Room-Bookings.csv`;
    const params = {
      access_token: accessToken
    };

    const filter = parseFilters(filters, term);

    filter.push("status==Paid||Reserved||RequestedRefund||Refunded");

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/all/reservations/csv`,
        params,
        filename
      )
    );
  };

export const getRoomBooking = (roomBookingId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "owner"
  };

  return getRequest(
    null,
    createAction(RECEIVE_ROOM_BOOKING),
    `${window.API_BASE_URL}/api/v1/summits/all/locations/bookable-rooms/all/reservations/${roomBookingId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetRoomBookingForm = () => (dispatch) => {
  dispatch(createAction(RESET_ROOM_BOOKING_FORM)({}));
};

export const saveRoomBooking = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    return putRequest(
      null,
      createAction(ROOM_BOOKING_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/${entity.room_id}/reservations/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(T.translate("edit_room_booking.room_booking_saved"))
      );
    });
  }

  const successMessage = {
    title: T.translate("general.done"),
    html: T.translate("edit_room_booking.room_booking_created"),
    type: "success"
  };

  return postRequest(
    null,
    createAction(ROOM_BOOKING_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/${entity.room_id}/reservations/offline`,
    normalizedEntity,
    authErrorHandler,
    entity
  )(params)(dispatch).then((payload) => {
    dispatch(
      showMessage(successMessage, () => {
        history.push(
          `/app/summits/${currentSummit.id}/room-bookings/${payload.response.id}`
        );
      })
    );
  });
};

export const refundRoomBooking =
  (roomId, roomBookingId, amount) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ROOM_BOOKING_REFUNDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/${roomId}/reservations/${roomBookingId}/refund`,
      { amount },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/**
 * @param roomId
 * @param roomBookingId
 * @returns {function(*, *): Promise<*>}
 */
export const cancelRoomBooking =
  (roomId, roomBookingId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ROOM_BOOKING_DELETED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/${roomId}/reservations/${roomBookingId}/cancel`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => dispatch(stopLoading()));
  };

/** ********************  ATTRIBUTE TYPE  **************************************************************** */

export const getRoomBookingAttributeType =
  (attributeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "values"
    };

    return getRequest(
      null,
      createAction(RECEIVE_ROOM_BOOKING_ATTRIBUTE_TYPE),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types/${attributeId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetRoomBookingAttributeForm = () => (dispatch) => {
  dispatch(createAction(RESET_ROOM_BOOKING_ATTRIBUTE_TYPE_FORM)({}));
};

export const saveRoomBookingAttributeType =
  (entity) => async (dispatch, getState) => {
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
        createAction(UPDATE_ROOM_BOOKING_ATTRIBUTE_TYPE),
        createAction(ROOM_BOOKING_ATTRIBUTE_TYPE_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(
          showSuccessMessage(
            T.translate("room_bookings.room_booking_attribute_type_saved")
          )
        );
      });
    } else {
      const successMessage = {
        title: T.translate("general.done"),
        html: T.translate("room_bookings.room_booking_attribute_type_created"),
        type: "success"
      };

      postRequest(
        createAction(UPDATE_ROOM_BOOKING_ATTRIBUTE_TYPE),
        createAction(ROOM_BOOKING_ATTRIBUTE_TYPE_ADDED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(
          showMessage(successMessage, () => {
            history.push(
              `/app/summits/${currentSummit.id}/room-booking-attributes/${payload.response.id}`
            );
          })
        );
      });
    }
  };

export const deleteRoomBookingAttributeType =
  (attributeTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ROOM_BOOKING_ATTRIBUTE_TYPE_DELETED)({ attributeTypeId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types/${attributeTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/** ********************  ATTRIBUTE  **************************************************************** */

export const saveRoomBookingAttribute =
  (attributeTypeId, entity) => async (dispatch, getState) => {
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
        createAction(UPDATE_ROOM_BOOKING_ATTRIBUTE),
        createAction(ROOM_BOOKING_ATTRIBUTE_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types/${attributeTypeId}/values/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(
          showSuccessMessage(
            T.translate("room_bookings.room_booking_attribute_saved")
          )
        );
      });
    } else {
      postRequest(
        createAction(UPDATE_ROOM_BOOKING_ATTRIBUTE),
        createAction(ROOM_BOOKING_ATTRIBUTE_ADDED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types/${attributeTypeId}/values`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(
          showSuccessMessage(
            T.translate("room_bookings.room_booking_attribute_created")
          )
        );
      });
    }
  };

export const deleteRoomBookingAttribute =
  (attributeTypeId, attributeValueId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ROOM_BOOKING_ATTRIBUTE_DELETED)({
        attributeTypeId,
        attributeValueId
      }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/bookable-room-attribute-types/${attributeTypeId}/values/${attributeValueId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getBookingRoomAvailability =
  (roomId, day) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return getRequest(
      null,
      createAction(RECEIVE_ROOM_BOOKING_AVAILABILITY),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/bookable-rooms/${roomId}/availability/${day}`,
      (err, res) => customErrorHandler(err, res, { roomId, day })
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
