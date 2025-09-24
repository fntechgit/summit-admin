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

import {
  authErrorHandler,
  createAction,
  deleteRequest,
  fetchErrorHandler,
  fetchResponseHandler,
  getRequest,
  postRequest,
  putRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import { escapeFilterValue, getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  DUMMY_ACTION
} from "../utils/constants";
import { snackbarErrorHandler, snackbarSuccessHandler } from "./base-actions";

export const RECEIVE_SPONSOR_USER_GROUPS = "RECEIVE_SPONSOR_USER_GROUPS";
export const REQUEST_SPONSOR_USER_REQUESTS = "REQUEST_SPONSOR_USER_REQUESTS";
export const RECEIVE_SPONSOR_USER_REQUESTS = "RECEIVE_SPONSOR_USER_REQUESTS";
export const REQUEST_SPONSOR_USERS = "REQUEST_SPONSOR_USERS";
export const RECEIVE_SPONSOR_USERS = "RECEIVE_SPONSOR_USERS";
export const SPONSOR_USER_ADDED = "SPONSOR_USER_ADDED";
export const SPONSOR_USER_REQUEST_ACCEPTED = "SPONSOR_USER_REQUEST_ACCEPTED";
export const SPONSOR_USER_REQUEST_DELETED = "SPONSOR_USER_REQUEST_DELETED";
export const SPONSOR_USER_DELETED = "SPONSOR_USER_DELETED";
export const SPONSOR_USER_UPDATED = "SPONSOR_USER_UPDATED";

export const getUserGroups =
  (page = 1, perPage = DEFAULT_PER_PAGE) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    return getRequest(
      null,
      createAction(RECEIVE_SPONSOR_USER_GROUPS),
      `${window.SPONSOR_USERS_API_URL}/api/v1/user-groups`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSponsorUserRequests =
  (
    sponsorId = null,
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const accessToken = await getAccessTokenSafely();
    const filter = [`summit_id==${currentSummit.id}`, "status==pending"];

    dispatch(startLoading());

    if (sponsorId) {
      filter.push(`sponsor_id==${sponsorId}`);
    }

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `requester_email=@${escapedTerm},requester_first_name=@${escapedTerm},requester_last_name=@${escapedTerm}`
      );
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.ordering = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_USER_REQUESTS),
      createAction(RECEIVE_SPONSOR_USER_REQUESTS),
      `${window.SPONSOR_USERS_API_URL}/api/v1/access-requests`,
      authErrorHandler,
      { order, orderDir, page, term, perPage }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSponsorUsers =
  (
    sponsorId = null,
    term = "",
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    const accessToken = await getAccessTokenSafely();
    const filter = [`summit_id==${currentSummit.id}`];

    dispatch(startLoading());

    if (sponsorId) {
      filter.push(`sponsor_id==${sponsorId}`);
    }

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `user_email=@${escapedTerm},user_first_name=@${escapedTerm},user_last_name=@${escapedTerm}`
      );
    }

    const params = {
      page,
      per_page: perPage,
      expand: "access_rights,access_rights.groups,access_rights.sponsor",
      relations:
        "access_rights,access_rights.groups,access_rights.sponsor.none",
      fields:
        "id,first_name,last_name,email,is_active,access_rights.groups.name,access_rights.groups.id,access_rights.sponsor.id,access_rights.sponsor.company_name",
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.ordering = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_SPONSOR_USERS),
      createAction(RECEIVE_SPONSOR_USERS),
      `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users`,
      authErrorHandler,
      { order, orderDir, page, term, perPage }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addSponsorUser = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(SPONSOR_USER_ADDED),
    `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users`,
    {
      user_email: "santipalenque@gmail.com",
      sponsor_id: 359,
      summit_id: currentSummit.id
    },
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate(
            "sponsor_form_item_list.add_from_inventory.items_added"
          )
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const processUserRequest = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(SPONSOR_USER_ADDED),
    `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users`,
    {
      user_email: "santipalenque@gmail.com",
      sponsor_id: 359,
      summit_id: currentSummit.id
    },
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate(
            "sponsor_form_item_list.add_from_inventory.items_added"
          )
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const fetchSponsorByCompany = async (companyId, summitId) => {
  const accessToken = await getAccessTokenSafely();

  return fetch(
    `${window.API_BASE_URL}/api/v2/summits/${summitId}/sponsors?filter=company_id==${companyId}&access_token=${accessToken}&fields=id,company.name,company.id&relations=company&expand=company`
  )
    .then(fetchResponseHandler)
    .then((json) => ({
      id: json.data[0].id,
      name: json.data[0].company.name
    }))
    .catch(fetchErrorHandler);
};

export const processSponsorUserRequest = (request) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const payload = {
    groups: request.access_rights,
    send_activation_email: request.send_email
  };

  if (request.sponsor?.id) payload.sponsor_id = request.sponsor.id;
  else {
    if (request.company?.id) payload.company_id = request.company.id;
    else payload.company_name = request.company.name;
    payload.sponsorship_types = request.tiers.map((st) => st.id);
  }

  putRequest(
    null,
    createAction(SPONSOR_USER_REQUEST_ACCEPTED),
    `${window.SPONSOR_USERS_API_URL}/api/v1/access-requests/${request.id}/approve`,
    payload,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(getSponsorUserRequests());
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_users.process_request.request_accepted")
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const approveSponsorUserRequest =
  (sponsorId, requestIds) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    const promises = requestIds.map((reqId) =>
      putRequest(
        null,
        createAction(SPONSOR_USER_REQUEST_ACCEPTED),
        `${window.SPONSOR_USERS_API_URL}/api/v1/access-requests/${reqId}/approve`,
        { sponsor_id: sponsorId },
        snackbarErrorHandler
      )(params)(dispatch)
    );

    Promise.all(promises)
      .then(() => {
        dispatch(getSponsorUserRequests());
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_users.process_request.request_accepted")
          })
        );
      })
      .catch(console.log) // need to catch promise reject
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const deleteSponsorUserRequest = (requestId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  return deleteRequest(
    null,
    createAction(SPONSOR_USER_REQUEST_DELETED)({ requestId }),
    `${window.SPONSOR_USERS_API_URL}/api/v1/access-requests/${requestId}/reject`,
    null,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_users.process_request.request_deleted")
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const denySponsorUserRequest = (requestIds) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();
  const params = { access_token: accessToken };

  dispatch(startLoading());

  const promises = requestIds.map((reqId) =>
    deleteRequest(
      null,
      createAction(SPONSOR_USER_REQUEST_DELETED)({ reqId }),
      `${window.SPONSOR_USERS_API_URL}/api/v1/access-requests/${reqId}/reject`,
      null,
      snackbarErrorHandler
    )(params)(dispatch)
  );

  Promise.all(promises)
    .then(() => {
      dispatch(getSponsorUserRequests());
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_users.process_request.request_deleted")
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const deleteSponsorUser =
  (sponsorId, userId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const params = { access_token: accessToken };

    dispatch(startLoading());

    return deleteRequest(
      null,
      createAction(SPONSOR_USER_DELETED)({ userId }),
      `${window.SPONSOR_USERS_API_URL}/api/v1/shows/${currentSummit.id}/sponsors/${sponsorId}/sponsor-users/${userId}/permissions`,
      null,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_users.user_delete_success")
          })
        );
      })
      .finally(() => {
        dispatch(stopLoading());
      });
  };

/** ****************  SPONSOR USERS TAB  *************************************** */

export const sendSponsorUserInvite = (email) => async (dispatch, getState) => {
  const { currentSummitState, currentSponsorState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const { entity } = currentSponsorState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const payload = {
    user_email: email,
    sponsor_id: entity.id,
    summit_id: currentSummit.id
  };

  return postRequest(
    null,
    createAction(DUMMY_ACTION),
    `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users`,
    payload,
    snackbarErrorHandler,
    entity
  )(params)(dispatch)
    .then(() => {
      dispatch(stopLoading());
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_users.new_user.success")
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};

export const fetchSponsorUsersBySummit = async (summitId, page) => {
  const accessToken = await getAccessTokenSafely();

  return fetch(
    `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users?filter=summit_id=@${summitId}&access_token=${accessToken}&page=${page}&per_page=10&order=first_name&order_dir=asc`
  )
    .then(fetchResponseHandler)
    .then((json) => json)
    .catch(fetchErrorHandler);
};

export const importSponsorUsers =
  (sponsorId, summitId, userIds) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    const payload = {
      summit_id: summitId,
      sponsor_id: sponsorId,
      user_ids: userIds
    };

    return postRequest(
      null,
      createAction(DUMMY_ACTION),
      `${window.SPONSOR_USERS_API_URL}/api/v1/sponsor-users/import`,
      payload,
      snackbarErrorHandler
    )(params)(dispatch)
      .then(() => {
        dispatch(stopLoading());
        dispatch(
          snackbarSuccessHandler({
            title: T.translate("general.success"),
            html: T.translate("sponsor_users.import_users.success")
          })
        );
      })
      .catch(console.log) // need to catch promise reject
      .finally(() => {
        dispatch(stopLoading());
      });
  };

export const updateSponsorUser = (user) => async (dispatch, getState) => {
  const { currentSummitState, currentSponsorState } = getState();
  const { currentSummit } = currentSummitState;
  const { entity: sponsor } = currentSponsorState;

  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());

  const payload = {
    is_active: user.is_active,
    groups: user.access_rights
  };

  putRequest(
    null,
    createAction(SPONSOR_USER_UPDATED),
    `${window.SPONSOR_USERS_API_URL}/api/v1/shows/${currentSummit.id}/sponsors/${sponsor.id}/sponsor_users/${user.id}`,
    payload,
    snackbarErrorHandler
  )(params)(dispatch)
    .then(() => {
      dispatch(getSponsorUserRequests());
      dispatch(
        snackbarSuccessHandler({
          title: T.translate("general.success"),
          html: T.translate("sponsor_users.edit_user.success")
        })
      );
    })
    .catch(console.log) // need to catch promise reject
    .finally(() => {
      dispatch(stopLoading());
    });
};
