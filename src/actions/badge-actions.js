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
 *  */

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
  escapeFilterValue,
  authErrorHandler,
  fetchResponseHandler,
  fetchErrorHandler,
  getCSV
} from "openstack-uicore-foundation/lib/utils/actions";
import pLimit from "p-limit";
import history from "../history";
import { saveMarketingSetting } from "./marketing-actions";
import { getAccessTokenSafely } from "../utils/methods";
import {
  DEBOUNCE_WAIT,
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE,
  DUMMY_ACTION,
  HUNDRED_PER_PAGE,
  TEN
} from "../utils/constants";

export const BADGE_DELETED = "BADGE_DELETED";
export const FEATURE_BADGE_REMOVED = "FEATURE_BADGE_REMOVED";
export const FEATURE_BADGE_ADDED = "FEATURE_BADGE_ADDED";
export const BADGE_TYPE_CHANGED = "BADGE_TYPE_CHANGED";
export const PRINT_BADGE = "PRINT_BADGE";
export const BADGE_PRINTS_CLEARED = "BADGE_PRINTS_CLEARED";

export const REQUEST_BADGE_FEATURES = "REQUEST_BADGE_FEATURES";
export const RECEIVE_BADGE_FEATURES = "RECEIVE_BADGE_FEATURES";
export const RECEIVE_BADGE_FEATURE = "RECEIVE_BADGE_FEATURE";
export const RESET_BADGE_FEATURE_FORM = "RESET_BADGE_FEATURE_FORM";
export const UPDATE_BADGE_FEATURE = "UPDATE_BADGE_FEATURE";
export const BADGE_FEATURE_UPDATED = "BADGE_FEATURE_UPDATED";
export const BADGE_FEATURE_ADDED = "BADGE_FEATURE_ADDED";
export const BADGE_FEATURE_DELETED = "BADGE_FEATURE_DELETED";
export const BADGE_FEATURE_IMAGE_ATTACHED = "BADGE_FEATURE_IMAGE_ATTACHED";
export const BADGE_FEATURE_IMAGE_DELETED = "BADGE_FEATURE_IMAGE_DELETED";

export const REQUEST_ACCESS_LEVELS = "REQUEST_ACCESS_LEVELS";
export const RECEIVE_ACCESS_LEVELS = "RECEIVE_ACCESS_LEVELS";
export const RECEIVE_ACCESS_LEVEL = "RECEIVE_ACCESS_LEVEL";
export const RESET_ACCESS_LEVEL_FORM = "RESET_ACCESS_LEVEL_FORM";
export const UPDATE_ACCESS_LEVEL = "UPDATE_ACCESS_LEVEL";
export const ACCESS_LEVEL_UPDATED = "ACCESS_LEVEL_UPDATED";
export const ACCESS_LEVEL_ADDED = "ACCESS_LEVEL_ADDED";
export const ACCESS_LEVEL_DELETED = "ACCESS_LEVEL_DELETED";

export const REQUEST_BADGE_TYPES = "REQUEST_BADGE_TYPES";
export const RECEIVE_BADGE_TYPES = "RECEIVE_BADGE_TYPES";
export const RECEIVE_BADGE_TYPE = "RECEIVE_BADGE_TYPE";
export const RESET_BADGE_TYPE_FORM = "RESET_BADGE_TYPE_FORM";
export const UPDATE_BADGE_TYPE = "UPDATE_BADGE_TYPE";
export const BADGE_TYPE_UPDATED = "BADGE_TYPE_UPDATED";
export const BADGE_TYPE_ADDED = "BADGE_TYPE_ADDED";
export const BADGE_TYPE_DELETED = "BADGE_TYPE_DELETED";
export const BADGE_ACCESS_LEVEL_ADDED = "BADGE_ACCESS_LEVEL_ADDED";
export const BADGE_ACCESS_LEVEL_REMOVED = "BADGE_ACCESS_LEVEL_REMOVED";
export const FEATURE_ADDED_TO_TYPE = "FEATURE_ADDED_TO_TYPE";
export const FEATURE_REMOVED_FROM_TYPE = "FEATURE_REMOVED_FROM_TYPE";
export const BADGE_VIEW_TYPE_ADDED = "BADGE_VIEW_TYPE_ADDED";
export const BADGE_VIEW_TYPE_REMOVED = "BADGE_VIEW_TYPE_REMOVED";

export const REQUEST_VIEW_TYPES = "REQUEST_VIEW_TYPES";
export const RECEIVE_VIEW_TYPES = "RECEIVE_VIEW_TYPES";
export const RECEIVE_VIEW_TYPE = "RECEIVE_VIEW_TYPE";
export const RESET_VIEW_TYPE_FORM = "RESET_VIEW_TYPE_FORM";
export const UPDATE_VIEW_TYPE = "UPDATE_VIEW_TYPE";
export const VIEW_TYPE_UPDATED = "VIEW_TYPE_UPDATED";
export const VIEW_TYPE_ADDED = "VIEW_TYPE_ADDED";
export const VIEW_TYPE_DELETED = "VIEW_TYPE_DELETED";

export const REQUEST_BADGE_PRINTS = "REQUEST_BADGE_PRINTS";
export const RECEIVE_BADGE_PRINTS = "RECEIVE_BADGE_PRINTS";
export const RECEIVE_BADGE_SETTINGS = "RECEIVE_BADGE_SETTINGS";

/** *********************  MARKETING BADGE SETTINGS  ************************** */

export const getBadgeSettings =
  (page = DEFAULT_CURRENT_PAGE, perPage = HUNDRED_PER_PAGE) =>
  (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      key__contains: "BADGE_TEMPLATE"
    };

    return getRequest(
      null,
      createAction(RECEIVE_BADGE_SETTINGS),
      `${window.MARKETING_API_BASE_URL}/api/public/v1/config-values/all/shows/${currentSummit.id}`,
      authErrorHandler,
      {}
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveBadgeSettings = (badgeSettings) => async (dispatch) => {
  const limit = pLimit(TEN);

  const input = Object.keys(badgeSettings).map((m) =>
    limit(() => {
      let value = badgeSettings[m].value ?? "";
      const file = badgeSettings[m].file ?? null;

      if (typeof value === "boolean") {
        value = value ? "1" : "0";
      }

      const badge_setting = {
        id: badgeSettings[m].id,
        type: badgeSettings[m].type,
        key: m.toUpperCase(),
        value
      };

      return dispatch(saveMarketingSetting(badge_setting, file));
    })
  );

  return Promise.all(input);
};

/** *********************  BADGE  *********************************************** */

export const deleteBadge = (ticketId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(BADGE_DELETED)({ ticketId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge/current`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(showSuccessMessage(T.translate("edit_ticket.badge_deleted")));
  });
};

export const changeBadgeType = (badge) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  const newBadgeType = currentSummit.badge_types.find(
    (bt) => bt.id === badge.type_id
  );

  return putRequest(
    null,
    createAction(BADGE_TYPE_CHANGED)({ newBadgeType }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${badge.ticket_id}/badge/current/type/${badge.type_id}`,
    {},
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const addFeatureToBadge =
  (ticketId, feature) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(FEATURE_BADGE_ADDED)({ feature }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge/current/features/${feature.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeFeatureFromBadge =
  (ticketId, featureId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(FEATURE_BADGE_REMOVED)({ featureId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge/current/features/${featureId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const printBadge =
  (ticketId, viewType) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(createAction(PRINT_BADGE));

    window.open(
      `${process.env.PRINT_APP_URL}/check-in/${
        currentSummit.slug
      }/tickets/${ticketId}?access_token=${accessToken}${
        viewType ? `&view_type=${viewType}` : ""
      }`,
      "_blank"
    );
  };

export const checkInBadge = (code) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return putRequest(
    null,
    createAction(DUMMY_ACTION),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-scans/checkin`,
    { qr_code: code },
    authErrorHandler
  )(params)(dispatch).then((ticket) => {
    dispatch(stopLoading());
    return ticket;
  });
};

/** *********************  BADGE PRINTS  *********************************************** */

export const getBadgePrints =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentTicketState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: ticketId }
    } = currentTicketState;

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "requestor"
    };

    const filter = parseFilters(filters, term);

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_BADGE_PRINTS),
      createAction(RECEIVE_BADGE_PRINTS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge/current/prints`,
      authErrorHandler,
      { order, orderDir, term, summitTz: currentSummit.time_zone_id }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const exportBadgePrints =
  (term = null, order = "id", orderDir = 1, filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState, currentTicketState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const {
      entity: { id: ticketId }
    } = currentTicketState;
    const filename = `${currentSummit.name}-Ticket_${ticketId}-BadgePrints.csv'`;

    const params = {
      expand: "",
      access_token: accessToken
    };

    const filter = parseFilters(filters, term);

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    // GET /api/v1/summits/{id}/tickets/{ticket_id}/badge/current/prints/csv

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge/current/prints/csv`,
        params,
        filename
      )
    );
  };

const parseFilters = (filters, term) => {
  const filter = [];
  if (term) {
    const escapedTerm = escapeFilterValue(term);
    filter.push(
      `requestor_full_name@@${escapedTerm},requestor_email@@${escapedTerm}`
    );
  }

  if (
    filters.hasOwnProperty("viewTypeFilter") &&
    Array.isArray(filters.viewTypeFilter) &&
    filters.viewTypeFilter.length > 0
  ) {
    filter.push(`view_type_id==${filters.viewTypeFilter.join("||")}`);
  }

  if (
    filters.printDateFilter &&
    filters.printDateFilter.some((e) => e !== null && e > 0)
  ) {
    if (filters.printDateFilter.every((e) => e !== null && e > 0)) {
      filter.push(
        `print_date[]${filters.printDateFilter[0]}&&${filters.printDateFilter[1]}`
      );
    } else {
      filter.push(`
            ${
              filters.printDateFilter[0] !== null &&
              filters.printDateFilter[0] > 0
                ? `print_date>=${filters.printDateFilter[0]}`
                : ""
            }
            ${
              filters.printDateFilter[1] !== null &&
              filters.printDateFilter[1] > 0
                ? `print_date<=${filters.printDateFilter[1]}`
                : ""
            }`);
    }
  }

  return filter;
};

export const clearBadgePrints = (ticketId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(BADGE_PRINTS_CLEARED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/tickets/${ticketId}/badge/current/prints`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

/** *********************  VIEW TYPES  *********************************************** */

export const getViewTypes =
  (
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm}`);
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_VIEW_TYPES),
      createAction(RECEIVE_VIEW_TYPES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-view-types`,
      authErrorHandler,
      { order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getViewType = (viewTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_VIEW_TYPE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-view-types/${viewTypeId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetViewTypeForm = () => (dispatch) => {
  dispatch(createAction(RESET_VIEW_TYPE_FORM)({}));
};

export const saveViewType = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeViewType(entity);

  if (entity.id) {
    putRequest(
      createAction(UPDATE_VIEW_TYPE),
      createAction(VIEW_TYPE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-view-types/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(T.translate("edit_view_type.view_type_saved"))
      );
    });
  } else {
    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_view_type.view_type_created"),
      type: "success"
    };

    postRequest(
      createAction(UPDATE_VIEW_TYPE),
      createAction(VIEW_TYPE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-view-types`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/view-types/${payload.response.id}`
          );
        })
      );
    });
  }
};

export const deleteViewType = (viewTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(VIEW_TYPE_DELETED)({ viewTypeId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-view-types/${viewTypeId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

const normalizeViewType = (entity) => {
  const normalizedEntity = { ...entity };
  delete normalizedEntity.id;
  if (!normalizedEntity.is_default) {
    normalizedEntity.is_default = false;
  }

  return normalizedEntity;
};

/** *********************  BADGE TYPE  *********************************************** */

export const getBadgeTypes =
  (order = "name", orderDir = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page: 1,
      per_page: HUNDRED_PER_PAGE,
      access_token: accessToken,
      expand: "access_levels,allowed_view_types",
      fields:
        "id,name,is_default,description,access_levels.id,access_levels.name,allowed_view_types.id,allowed_view_types.name",
      relations:
        "access_levels,access_levels.none,allowed_view_types.none,allowed_view_types.none"
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_BADGE_TYPES),
      createAction(RECEIVE_BADGE_TYPES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types`,
      authErrorHandler,
      { order, orderDir }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getBadgeType = (badgeTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "access_levels,badge_features,allowed_view_types"
  };

  return getRequest(
    null,
    createAction(RECEIVE_BADGE_TYPE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetBadgeTypeForm = () => (dispatch) => {
  dispatch(createAction(RESET_BADGE_TYPE_FORM)({}));
};

export const saveBadgeType = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeBadgeType(entity);

  delete normalizedEntity.id;
  delete normalizedEntity.access_levels;

  if (entity.id) {
    putRequest(
      createAction(UPDATE_BADGE_TYPE),
      createAction(BADGE_TYPE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(T.translate("edit_badge_type.badge_type_saved"))
      );
    });
  } else {
    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_badge_type.badge_type_created"),
      type: "success"
    };

    postRequest(
      createAction(UPDATE_BADGE_TYPE),
      createAction(BADGE_TYPE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/badge-types/${payload.response.id}`
          );
        })
      );
    });
  }
};

export const deleteBadgeType = (badgeTypeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(BADGE_TYPE_DELETED)({ badgeTypeId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const addAccessLevelToBadgeType =
  (badgeTypeId, accessLevel) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(BADGE_ACCESS_LEVEL_ADDED)({ accessLevel }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}/access-levels/${accessLevel.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeAccessLevelFromBadgeType =
  (badgeTypeId, accessLevelId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(BADGE_ACCESS_LEVEL_REMOVED)({ accessLevelId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}/access-levels/${accessLevelId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addFeatureToBadgeType =
  (badgeTypeId, feature) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(FEATURE_ADDED_TO_TYPE)({ feature }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}/features/${feature.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeFeatureFromBadgeType =
  (badgeTypeId, featureId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(FEATURE_REMOVED_FROM_TYPE)({ featureId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}/features/${featureId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addViewTypeToBadgeType =
  (badgeTypeId, viewType) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(BADGE_VIEW_TYPE_ADDED)({ viewType }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}/view-types/${viewType.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeViewTypeFromBadgeType =
  (badgeTypeId, viewTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(BADGE_VIEW_TYPE_REMOVED)({ viewTypeId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-types/${badgeTypeId}/view-types/${viewTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeBadgeType = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.id;
  delete normalizedEntity.access_levels;
  delete normalizedEntity.badge_features;

  return normalizedEntity;
};

/** *********************  BADGE FEATURE  *********************************************** */

export const queryBadgeFeatures = _.debounce(
  async (summitId, input, callback) => {
    const accessToken = await getAccessTokenSafely();

    input = escapeFilterValue(input);

    fetch(
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/badge-feature-types?filter=name=@${input}&access_token=${accessToken}`
    )
      .then(fetchResponseHandler)
      .then((json) => {
        const options = [...json.data];
        callback(options);
      })
      .catch(fetchErrorHandler);
  },
  DEBOUNCE_WAIT
);

export const getBadgeFeatures =
  (order = "name", orderDir = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page: 1,
      fields: "name,id,description",
      per_page: HUNDRED_PER_PAGE,
      access_token: accessToken
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_BADGE_FEATURES),
      createAction(RECEIVE_BADGE_FEATURES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types`,
      authErrorHandler,
      { order, orderDir }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getBadgeFeature =
  (badgeFeatureId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return getRequest(
      null,
      createAction(RECEIVE_BADGE_FEATURE),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types/${badgeFeatureId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const resetBadgeFeatureForm = () => (dispatch) => {
  dispatch(createAction(RESET_BADGE_FEATURE_FORM)({}));
};

export const saveBadgeFeature = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeBadgeFeature(entity);

  if (entity.id) {
    putRequest(
      createAction(UPDATE_BADGE_FEATURE),
      createAction(BADGE_FEATURE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(
          T.translate("edit_badge_feature.badge_feature_saved")
        )
      );
    });
  } else {
    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_badge_feature.badge_feature_created"),
      type: "success"
    };

    postRequest(
      createAction(UPDATE_BADGE_FEATURE),
      createAction(BADGE_FEATURE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/badge-features/${payload.response.id}`
          );
        })
      );
    });
  }
};

export const deleteBadgeFeature =
  (badgeFeatureId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(BADGE_FEATURE_DELETED)({ badgeFeatureId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types/${badgeFeatureId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const uploadBadgeFeatureImage =
  (entity, file) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    postRequest(
      null,
      createAction(BADGE_FEATURE_IMAGE_ATTACHED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types/${entity.id}/image`,
      file,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      history.push(
        `/app/summits/${currentSummit.id}/badge-features/${entity.id}`
      );
    });
  };

export const removeBadgeFeatureImage =
  (badgeFeatureId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return deleteRequest(
      null,
      createAction(BADGE_FEATURE_IMAGE_DELETED)({}),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/badge-feature-types/${badgeFeatureId}/image`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeBadgeFeature = (entity) => {
  const normalizedEntity = { ...entity };
  delete normalizedEntity.id;

  return normalizedEntity;
};

/** *********************  ACCESS LEVEL  *********************************************** */

export const getAccessLevels =
  (order = "name", orderDir = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page: 1,
      per_page: HUNDRED_PER_PAGE,
      access_token: accessToken,
      fields: "id,name,description,is_default",
      relations: "none"
    };

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_ACCESS_LEVELS),
      createAction(RECEIVE_ACCESS_LEVELS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/access-level-types`,
      authErrorHandler,
      { order, orderDir }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getAccessLevel = (accessLevelId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_ACCESS_LEVEL),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/access-level-types/${accessLevelId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetAccessLevelForm = () => (dispatch) => {
  dispatch(createAction(RESET_ACCESS_LEVEL_FORM)({}));
};

export const saveAccessLevel = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const normalizedEntity = normalizeAccessLevel(entity);

  if (entity.id) {
    putRequest(
      createAction(UPDATE_ACCESS_LEVEL),
      createAction(ACCESS_LEVEL_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/access-level-types/${entity.id}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(
        showSuccessMessage(T.translate("edit_access_level.access_level_saved"))
      );
    });
  } else {
    const success_message = {
      title: T.translate("general.done"),
      html: T.translate("edit_access_level.access_level_created"),
      type: "success"
    };

    postRequest(
      createAction(UPDATE_ACCESS_LEVEL),
      createAction(ACCESS_LEVEL_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/access-level-types`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/access-levels/${payload.response.id}`
          );
        })
      );
    });
  }
};

export const deleteAccessLevel =
  (accessLevelId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ACCESS_LEVEL_DELETED)({ accessLevelId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/access-level-types/${accessLevelId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeAccessLevel = (entity) => {
  const normalizedEntity = { ...entity };
  delete normalizedEntity.id;

  return normalizedEntity;
};
