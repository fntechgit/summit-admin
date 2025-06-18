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
  escapeFilterValue,
  getCSV,
  getRequest,
  postRequest,
  putRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  fetchErrorHandler,
  fetchResponseHandler,
  getAccessTokenSafely
} from "../utils/methods";
import {
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  DOUBLE_PER_PAGE
} from "../utils/constants";

export const REQUEST_TRACK_CHAIRS = "REQUEST_TRACK_CHAIRS";
export const RECEIVE_TRACK_CHAIRS = "RECEIVE_TRACK_CHAIRS";
export const TRACK_CHAIR_UPDATED = "TRACK_CHAIR_UPDATED";
export const TRACK_CHAIR_ADDED = "TRACK_CHAIR_ADDED";
export const TRACK_CHAIR_DELETED = "TRACK_CHAIR_DELETED";

export const RECEIVE_PROGRESS_FLAGS = "RECEIVE_PROGRESS_FLAGS";
export const PROGRESS_FLAG_UPDATED = "PROGRESS_FLAG_UPDATED";
export const PROGRESS_FLAG_ADDED = "PROGRESS_FLAG_ADDED";
export const PROGRESS_FLAG_DELETED = "PROGRESS_FLAG_DELETED";
export const PROGRESS_FLAG_REORDERED = "PROGRESS_FLAG_REORDERED";

export const RECEIVE_TC_SELECTION_PLANS = "RECEIVE_TC_SELECTION_PLANS";
export const SET_SOURCE_SEL_PLAN = "SET_SOURCE_SEL_PLAN";
export const REQUEST_SOURCE_LIST = "REQUEST_SOURCE_LIST";
export const RECEIVE_SOURCE_LIST = "RECEIVE_SOURCE_LIST";
export const REQUEST_TEAM_LIST = "REQUEST_TEAM_LIST";
export const RECEIVE_TEAM_LIST = "RECEIVE_TEAM_LIST";
export const REORDER_LIST = "REORDER_LIST";
export const REVERT_LISTS = "REVERT_LISTS";
export const TEAM_LIST_UPDATED = "TEAM_LIST_UPDATED";

const callDelay = 500; // miliseconds

export const getTrackChairs =
  (
    trackId = null,
    term = "",
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(
        `member_full_name=@${escapedTerm},member_last_name=@${escapedTerm},member_email=@${escapedTerm}`
      );
    }

    if (trackId) {
      filter.push(`track_id==${trackId}`);
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "member,categories",
      relations: "member.none,categories.none",
      fields:
        "id,categories.id,categories.name,member.first_name,member.last_name,member.email"
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      let orderCol = "";

      switch (order) {
        case "name":
          orderCol = "member_first_name";
          break;
        case "trackName":
          orderCol = "track";
          break;
        default:
          orderCol = order;
      }

      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${orderCol}`;
    }

    return getRequest(
      createAction(REQUEST_TRACK_CHAIRS),
      createAction(RECEIVE_TRACK_CHAIRS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs`,
      authErrorHandler,
      { trackId, term, order, orderDir }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addTrackChair =
  (member, trackIds) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "member,categories"
    };

    return postRequest(
      null,
      createAction(TRACK_CHAIR_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs`,
      { member_id: member.id, categories: trackIds },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveTrackChair =
  (trackChairId, trackIds) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "member,categories"
    };

    return putRequest(
      null,
      createAction(TRACK_CHAIR_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs/${trackChairId}`,
      { categories: trackIds },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteTrackChair =
  (trackChairId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(TRACK_CHAIR_DELETED)({ trackChairId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs/${trackChairId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const exportTrackChairs = () => async (dispatch, getState) => {
  const { currentSummitState, trackChairListState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const { trackId, term, order, orderDir } = trackChairListState;

  const filename = `${currentSummit.name}-TrackChairs.csv`;
  const filter = [];

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    filter.push(
      `member_full_name=@${escapedTerm},member_last_name=@${escapedTerm},member_email=@${escapedTerm}`
    );
  }

  if (trackId) {
    filter.push(`track_id==${trackId}`);
  }

  const params = {
    access_token: accessToken
  };

  if (filter.length > 0) {
    params["filter[]"] = filter;
  }

  // order
  if (order != null && orderDir != null) {
    let orderCol = "";

    switch (order) {
      case "name":
        orderCol = "member_first_name";
        break;
      case "trackName":
        orderCol = "track";
        break;
      default:
        orderCol = order;
    }

    const orderDirSign = orderDir === 1 ? "" : "-";
    params.order = `${orderDirSign}${orderCol}`;
  }

  dispatch(
    getCSV(
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/track-chairs/csv`,
      params,
      filename
    )
  );
};

/** ********************************************************************************************************* */
/*                          PROGRESS FLAGS                                                                  */
/** ********************************************************************************************************* */

export const getProgressFlags = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    page: 1,
    per_page: 100,
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_PROGRESS_FLAGS),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/presentation-action-types`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const querySummitProgressFlags = _.debounce(
  async (summitId, input, callback) => {
    const accessToken = await getAccessTokenSafely();
    input = escapeFilterValue(input);
    const filters = encodeURIComponent(`label=@${input}`);

    fetch(
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/presentation-action-types?filter=${filters}&&access_token=${accessToken}`
    )
      .then(fetchResponseHandler)
      .then((json) => {
        const options = [...json.data.map((d) => ({ ...d, name: d.label }))];

        callback(options);
      })
      .catch(fetchErrorHandler);
  },
  callDelay
);

export const addProgressFlag = (flagName) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(PROGRESS_FLAG_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/presentation-action-types`,
    { label: flagName },
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const saveProgressFlag =
  (progressFlagId, flag) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(PROGRESS_FLAG_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/presentation-action-types/${progressFlagId}`,
      flag,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteProgressFlag =
  (progressFlagId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(PROGRESS_FLAG_DELETED)({ progressFlagId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/presentation-action-types/${progressFlagId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const reorderProgressFlags =
  (flags, progressFlagId, newOrder) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(PROGRESS_FLAG_REORDERED)(flags),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/presentation-action-types/${progressFlagId}`,
      { order: newOrder },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/** ********************************************************************************************************* */
/*                          TEAM LISTS                                                                        */
/** ********************************************************************************************************* */

export const getSelectionPlans = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    page: 1,
    per_page: 100,
    access_token: accessToken,
    fields:
      "id,name,track_groups.id,track_groups.name,track_groups.tracks.id,track_groups.tracks.name,track_groups.tracks.color,track_groups.tracks.chair_visible,track_groups.tracks.session_count,track_groups.tracks.alternate_count",
    relations: "track_groups,track_groups.tracks,track_groups.tracks.none",
    expand: "track_groups,track_groups.tracks"
  };

  return getRequest(
    null,
    createAction(RECEIVE_TC_SELECTION_PLANS),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const setSelectionPlan = (selectionPlanId) => (dispatch) => {
  dispatch(createAction(SET_SOURCE_SEL_PLAN)({ selectionPlanId }));
};

export const getSourceList =
  (selectionPlanId, trackId, searchTerm = "", page = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState, teamListsState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const { teamList } = teamListsState;
    const filter = [
      `selection_plan_id==${selectionPlanId}`,
      `track_id==${trackId}`,
      "status==Received",
      "progress==5"
    ];

    if (teamList?.items?.length > 0) {
      const excludedIds = teamList.items.map((it) => it.id);
      filter.push(`not_id==${excludedIds.join("||")}`);
    }

    dispatch(startLoading());

    if (searchTerm) {
      const escapedTerm = escapeFilterValue(searchTerm);
      if (Number.isInteger(parseInt(escapedTerm, 10))) {
        filter.push(
          `id==${escapedTerm},title=@${escapedTerm},abstract=@${escapedTerm},speaker=@${escapedTerm}`
        );
      } else {
        filter.push(
          `title=@${escapedTerm},abstract=@${escapedTerm},speaker=@${escapedTerm}`
        );
      }
    }

    const params = {
      page,
      per_page: DOUBLE_PER_PAGE,
      access_token: accessToken,
      "filter[]": filter,
      fields:
        "id,title,likers_count,selectors_count,passers_count,track_chair_avg_score,comments_count",
      relations: "none"
    };

    return getRequest(
      createAction(REQUEST_SOURCE_LIST),
      createAction(RECEIVE_SOURCE_LIST),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events`,
      authErrorHandler,
      { trackId, searchTerm }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getTeamList =
  (selectionPlanId, trackId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand: "selected_presentations,selected_presentations.presentation",
      fields:
        "id,hash,selected_presentations.order,selected_presentations.presentation.id,selected_presentations.presentation.title,selected_presentations.presentation.level,selected_presentations.presentation.selectors_count,selected_presentations.presentation.likers_count,selected_presentations.presentation.passers_count,selected_presentations.presentation.comments_count,selected_presentations.presentation.track_chair_avg_score",
      relations:
        "selected_presentations.presentation,selected_presentations.presentation.none"
    };

    return getRequest(
      createAction(REQUEST_TEAM_LIST),
      createAction(RECEIVE_TEAM_LIST),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/tracks/${trackId}/selection-lists/team`,
      authErrorHandler,
      { trackId }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const reorderList = (listId, items) => (dispatch) => {
  dispatch(createAction(REORDER_LIST)({ listId, items }));
};

export const revertChanges = () => async (dispatch) => {
  dispatch(createAction(REVERT_LISTS)({}));
};

export const updateTeamList = () => async (dispatch, getState) => {
  const { currentSummitState, teamListsState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const { sourceSelPlanId, sourceTrackId, teamList } = teamListsState;
  const ids = teamList.items.map((it) => it.id);

  dispatch(startLoading());

  const params = {
    access_token: accessToken,
    expand: "member,categories"
  };

  putRequest(
    null,
    createAction(TEAM_LIST_UPDATED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${sourceSelPlanId}/tracks/${sourceTrackId}/selection-lists/${teamList.id}/reorder`,
    { hash: teamList.hash, collection: "selected", presentations: ids },
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};
