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
import _ from "lodash";
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
  postFile
} from "openstack-uicore-foundation/lib/utils/actions";
import history from "../history";
import {
  getAccessTokenSafely,
  escapeFilterValue,
  fetchResponseHandler,
  fetchErrorHandler
} from "../utils/methods";
import { saveMarketingSetting } from "./marketing-actions";
import { DEFAULT_PER_PAGE } from "../utils/constants";

export const REQUEST_SELECTION_PLANS = "REQUEST_SELECTION_PLANS";
export const RECEIVE_SELECTION_PLANS = "RECEIVE_SELECTION_PLANS";
export const RECEIVE_SELECTION_PLAN = "RECEIVE_SELECTION_PLAN";
export const RESET_SELECTION_PLAN_FORM = "RESET_SELECTION_PLAN_FORM";
export const UPDATE_SELECTION_PLAN = "UPDATE_SELECTION_PLAN";
export const SELECTION_PLAN_UPDATED = "SELECTION_PLAN_UPDATED";
export const SELECTION_PLAN_ADDED = "SELECTION_PLAN_ADDED";
export const SELECTION_PLAN_DELETED = "SELECTION_PLAN_DELETED";
export const TRACK_GROUP_REMOVED = "TRACK_GROUP_REMOVED";
export const TRACK_GROUP_ADDED = "TRACK_GROUP_ADDED";
export const SELECTION_PLAN_ASSIGNED_EXTRA_QUESTION =
  "SELECTION_PLAN_ASSIGNED_EXTRA_QUESTION";
export const REQUEST_ALLOWED_MEMBERS = "REQUEST_ALLOWED_MEMBERS";
export const RECEIVE_ALLOWED_MEMBERS = "RECEIVE_ALLOWED_MEMBERS";
export const ALLOWED_MEMBER_REMOVED = "ALLOWED_MEMBER_REMOVED";
export const ALLOWED_MEMBER_ADDED = "ALLOWED_MEMBER_ADDED";
export const ALLOWED_MEMBERS_IMPORTED = "ALLOWED_MEMBERS_IMPORTED";
export const RECEIVE_SELECTION_PLAN_PROGRESS_FLAGS =
  "RECEIVE_SELECTION_PLAN_PROGRESS_FLAGS";
export const SELECTION_PLAN_ASSIGNED_PROGRESS_FLAG =
  "SELECTION_PLAN_ASSIGNED_PROGRESS_FLAG";
export const SELECTION_PLAN_PROGRESS_FLAG_REMOVED =
  "SELECTION_PLAN_PROGRESS_FLAG_REMOVED";
export const SELECTION_PLAN_PROGRESS_FLAG_ORDER_UPDATED =
  "SELECTION_PLAN_PROGRESS_FLAG_ORDER_UPDATED";

const callDelay = 500; // milliseconds

export const getSelectionPlans =
  (term = "", page = 1, order = "id", orderDir = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`name=@${escapedTerm}`);
    }

    const params = {
      access_token: accessToken,
      relations: "none",
      page,
      per_page: DEFAULT_PER_PAGE,
      order: `${orderDir === 1 ? "" : "-"}${order}`
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    return getRequest(
      null,
      createAction(RECEIVE_SELECTION_PLANS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans`,
      authErrorHandler
    )(params)(dispatch).then(async () => {
      dispatch(stopLoading());
    });
  };

export const getSelectionPlan =
  (selectionPlanId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      expand:
        "track_groups,extra_questions,extra_questions.values,event_types,track_chair_rating_types"
    };

    return getRequest(
      null,
      createAction(RECEIVE_SELECTION_PLAN),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}`,
      authErrorHandler
    )(params)(dispatch).then(async () => {
      await dispatch(getAllowedMembers(selectionPlanId));
      await dispatch(
        getSelectionPlanProgressFlags(currentSummit.id, selectionPlanId)
      );
      dispatch(stopLoading());
    });
  };

export const resetSelectionPlanForm = () => (dispatch) => {
  dispatch(createAction(RESET_SELECTION_PLAN_FORM)({}));
};

export const saveSelectionPlan = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const normalizedEntity = normalizeEntity(entity);

  if (entity.id) {
    return putRequest(
      createAction(UPDATE_SELECTION_PLAN),
      createAction(SELECTION_PLAN_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${entity.id}?access_token=${accessToken}`,
      normalizedEntity,
      authErrorHandler,
      entity
    )({})(dispatch).then((payload) => {
      dispatch(stopLoading());
      dispatch(
        showSuccessMessage(
          T.translate("edit_selection_plan.selection_plan_saved")
        )
      );
      return payload.response;
    });
  }
  return postRequest(
    createAction(UPDATE_SELECTION_PLAN),
    createAction(SELECTION_PLAN_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans?access_token=${accessToken}`,
    normalizedEntity,
    authErrorHandler,
    entity
  )({})(dispatch).then((payload) => {
    dispatch(stopLoading());
    dispatch(
      showSuccessMessage(
        T.translate("edit_selection_plan.selection_plan_created")
      )
    );
    return payload.response;
  });
};

export const deleteSelectionPlan =
  (selectionPlanId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(SELECTION_PLAN_DELETED)({ selectionPlanId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addTrackGroupToSelectionPlan =
  (selectionPlanId, trackGroup) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(TRACK_GROUP_ADDED)({ trackGroup }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/track-groups/${trackGroup.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeTrackGroupFromSelectionPlan =
  (selectionPlanId, trackGroupId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(TRACK_GROUP_REMOVED)({ trackGroupId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/track-groups/${trackGroupId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  if (!normalizedEntity.selection_begin_date)
    normalizedEntity.selection_begin_date = null;
  if (!normalizedEntity.selection_end_date)
    normalizedEntity.selection_end_date = null;
  if (!normalizedEntity.submission_begin_date)
    normalizedEntity.submission_begin_date = null;
  if (!normalizedEntity.submission_end_date)
    normalizedEntity.submission_end_date = null;
  if (!normalizedEntity.voting_begin_date)
    normalizedEntity.voting_begin_date = null;
  if (!normalizedEntity.voting_end_date)
    normalizedEntity.voting_end_date = null;

  delete normalizedEntity.created;
  delete normalizedEntity.last_edited;
  delete normalizedEntity.id;
  delete normalizedEntity.summit_id;
  delete normalizedEntity.track_groups;

  normalizedEntity.is_hidden = !!normalizedEntity.is_hidden;
  normalizedEntity.is_active = !!normalizedEntity.is_active;

  return normalizedEntity;
};

/** *********************  EXTRA QUESTIONS  ****************************************** */

export const RECEIVE_SELECTION_PLAN_EXTRA_QUESTION_META =
  "RECEIVE_SELECTION_PLAN_EXTRA_QUESTION_META";
export const REQUEST_SELECTION_PLAN_EXTRA_QUESTIONS =
  "REQUEST_SELECTION_PLAN_EXTRA_QUESTIONS";
export const RECEIVE_SELECTION_PLAN_EXTRA_QUESTIONS =
  "RECEIVE_SELECTION_PLAN_EXTRA_QUESTIONS";
export const RECEIVE_SELECTION_PLAN_EXTRA_QUESTION =
  "RECEIVE_SELECTION_PLAN_EXTRA_QUESTION";
export const UPDATE_SELECTION_PLAN_EXTRA_QUESTION =
  "UPDATE_SELECTION_PLAN_EXTRA_QUESTION";
export const SELECTION_PLAN_EXTRA_QUESTION_UPDATED =
  "SELECTION_PLAN_EXTRA_QUESTION_UPDATED";
export const SELECTION_PLAN_EXTRA_QUESTION_ADDED =
  "SELECTION_PLAN_EXTRA_QUESTION_ADDED";
export const SELECTION_PLAN_EXTRA_QUESTION_DELETED =
  "SELECTION_PLAN_EXTRA_QUESTION_DELETED";
export const SELECTION_PLAN_EXTRA_QUESTION_ORDER_UPDATED =
  "SELECTION_PLAN_EXTRA_QUESTION_ORDER_UPDATED";
export const UPDATE_SELECTION_PLAN_EXTRA_QUESTION_VALUE =
  "UPDATE_SELECTION_PLAN_EXTRA_QUESTION_VALUE";
export const SELECTION_PLAN_EXTRA_QUESTION_VALUE_UPDATED =
  "SELECTION_PLAN_EXTRA_QUESTION_VALUE_UPDATED";
export const SELECTION_PLAN_EXTRA_QUESTION_VALUE_ADDED =
  "SELECTION_PLAN_EXTRA_QUESTION_VALUE_ADDED";
export const SELECTION_PLAN_EXTRA_QUESTION_VALUE_DELETED =
  "SELECTION_PLAN_EXTRA_QUESTION_VALUE_DELETED";
export const RESET_SELECTION_PLAN_EXTRA_QUESTION_FORM =
  "RESET_SELECTION_PLAN_EXTRA_QUESTION_FORM";

export const resetSelectionPlanExtraQuestionForm = () => (dispatch) => {
  dispatch(createAction(RESET_SELECTION_PLAN_EXTRA_QUESTION_FORM)({}));
};

export const getExtraQuestionMeta =
  (selectionPlanId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return getRequest(
      null,
      createAction(RECEIVE_SELECTION_PLAN_EXTRA_QUESTION_META),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/metadata`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSelectionPlanExtraQuestions =
  (selectionPlanId) => async (dispatch, getState) => {
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
      createAction(REQUEST_SELECTION_PLAN_EXTRA_QUESTIONS),
      createAction(RECEIVE_SELECTION_PLAN_EXTRA_QUESTIONS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSelectionPlanExtraQuestion =
  (selectionPlanId, extraQuestionId) => async (dispatch, getState) => {
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
      createAction(RECEIVE_SELECTION_PLAN_EXTRA_QUESTION),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${extraQuestionId}`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

const normalizeQuestion = (entity) => {
  const normalizedEntity = { ...entity };
  if (normalizedEntity.hasOwnProperty("order")) delete normalizedEntity.order;
  return normalizedEntity;
};

export const saveSelectionPlanExtraQuestion =
  (selectionPlanId, entity) => async (dispatch, getState) => {
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
        createAction(UPDATE_SELECTION_PLAN_EXTRA_QUESTION),
        createAction(SELECTION_PLAN_EXTRA_QUESTION_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(stopLoading());

        const success_message = {
          title: T.translate("general.done"),
          html: T.translate(
            "edit_order_extra_question.order_extra_question_saved"
          ),
          type: "success"
        };

        dispatch(
          showMessage(success_message, () => {
            history.push(
              `/app/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${payload.response.id}`
            );
          })
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
      createAction(UPDATE_SELECTION_PLAN_EXTRA_QUESTION),
      createAction(SELECTION_PLAN_EXTRA_QUESTION_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(stopLoading());
      dispatch(
        showMessage(success_message, () => {
          history.push(
            `/app/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${payload.response.id}`
          );
        })
      );
    });
  };

export const deleteSelectionPlanExtraQuestion =
  (selectionPlanId, questionId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(SELECTION_PLAN_EXTRA_QUESTION_DELETED)({ questionId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${questionId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const updateSelectionPlanExtraQuestionOrder =
  (selectionPlanId, questions, questionId, newOrder) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    putRequest(
      null,
      createAction(SELECTION_PLAN_EXTRA_QUESTION_ORDER_UPDATED)(questions),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${questionId}`,
      { order: newOrder },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveSelectionPlanExtraQuestionValue =
  (selectionPlanId, questionId, entity) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    if (entity.id) {
      return putRequest(
        createAction(UPDATE_SELECTION_PLAN_EXTRA_QUESTION_VALUE),
        createAction(SELECTION_PLAN_EXTRA_QUESTION_VALUE_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${questionId}/values/${entity.id}`,
        entity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(stopLoading());
      });
    }

    return postRequest(
      createAction(UPDATE_SELECTION_PLAN_EXTRA_QUESTION_VALUE),
      createAction(SELECTION_PLAN_EXTRA_QUESTION_VALUE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${questionId}/values`,
      entity,
      authErrorHandler,
      entity
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/**
 * @param values
 * @param valueId
 * @param newOrder
 * @returns {function(*=, *): *}
 */
export const updateSelectionPlanExtraQuestionValueOrder =
  (values, valueId, newOrder) => async (dispatch, getState) => {
    const { currentSelectionPlanExtraQuestionState } = getState();
    const accessToken = await getAccessTokenSafely();
    const {
      entity: { summit_id, id, selection_plan_id }
    } = currentSelectionPlanExtraQuestionState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      createAction(UPDATE_SELECTION_PLAN_EXTRA_QUESTION_VALUE),
      createAction(SELECTION_PLAN_EXTRA_QUESTION_VALUE_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${summit_id}/selection-plans/${selection_plan_id}/extra-questions/${id}/values/${valueId}`,
      { order: newOrder },
      authErrorHandler,
      { order: newOrder, id: valueId }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteSelectionPlanExtraQuestionValue =
  (selectionPlanId, questionId, valueId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(SELECTION_PLAN_EXTRA_QUESTION_VALUE_DELETED)({ valueId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/extra-questions/${questionId}/values/${valueId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/** *********************  EVENT TYPES  ****************************************** */

export const EVENT_TYPE_ADDED = "EVENT_TYPE_ADDED";
export const EVENT_TYPE_REMOVED = "EVENT_TYPE_REMOVED";

export const addEventTypeSelectionPlan =
  (selectionPlanId, eventType) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(EVENT_TYPE_ADDED)({ eventType }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/event-types/${eventType.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
export const deleteEventTypeSelectionPlan =
  (selectionPlanId, eventTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(EVENT_TYPE_REMOVED)({ eventTypeId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/event-types/${eventTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/** *********************  RATING TYPES  ****************************************** */

export const SELECTION_PLAN_RATING_TYPE_ADDED =
  "SELECTION_PLAN_RATING_TYPE_ADDED";
export const SELECTION_PLAN_RATING_TYPE_REMOVED =
  "SELECTION_PLAN_RATING_TYPE_REMOVED";
export const SELECTION_PLAN_RATING_TYPE_UPDATED =
  "SELECTION_PLAN_RATING_TYPE_UPDATED";
export const SELECTION_PLAN_RATING_TYPE_ORDER_UPDATED =
  "SELECTION_PLAN_RATING_TYPE_ORDER_UPDATED";

export const updateRatingTypeOrder =
  (selectionPlanId, ratingTypes, ratingTypeId, newOrder) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const ratingType = ratingTypes.find((r) => r.id === ratingTypeId);
    ratingType.order = newOrder;

    return putRequest(
      null,
      createAction(SELECTION_PLAN_RATING_TYPE_ORDER_UPDATED)(ratingTypes),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/track-chair-rating-types/${ratingTypeId}`,
      ratingType,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const deleteRatingType =
  (selectionPlanId, ratingTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(SELECTION_PLAN_RATING_TYPE_REMOVED)({ ratingTypeId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/track-chair-rating-types/${ratingTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const querySelectionPlanExtraQuestions = _.debounce(
  async (summitId, input, callback) => {
    const accessToken = await getAccessTokenSafely();
    input = escapeFilterValue(input);
    const filters = encodeURIComponent(`name=@${input}`);

    fetch(
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/selection-plan-extra-questions?filter=${filters}&&access_token=${accessToken}`
    )
      .then(fetchResponseHandler)
      .then((json) => {
        const options = [...json.data];

        callback(options);
      })
      .catch(fetchErrorHandler);
  },
  callDelay
);

export const assignExtraQuestion2SelectionPlan =
  (summitId, selectionPlanId, questionId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    postRequest(
      null,
      createAction(SELECTION_PLAN_ASSIGNED_EXTRA_QUESTION),
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/selection-plans/${selectionPlanId}/extra-questions/${questionId}?access_token=${accessToken}`,
      {},
      authErrorHandler
    )({})(dispatch).then(() => {
      dispatch(stopLoading());
      dispatch(
        showSuccessMessage(
          T.translate("edit_selection_plan.selection_plan_saved")
        )
      );
    });
  };

/** *********************  ALLOWED MEMBERS  ****************************************** */

export const getAllowedMembers =
  (selectionPlanId, page = 1) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    if (!currentSummit.id) return;

    dispatch(startLoading());

    const params = {
      page,
      per_page: 10,
      access_token: accessToken
    };

    return getRequest(
      createAction(REQUEST_ALLOWED_MEMBERS),
      createAction(RECEIVE_ALLOWED_MEMBERS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/allowed-members`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const addAllowedMemberToSelectionPlan =
  (selectionPlanId, email) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return postRequest(
      null,
      createAction(ALLOWED_MEMBER_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/allowed-members`,
      { email },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeAllowedMemberFromSelectionPlan =
  (selectionPlanId, emailId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(ALLOWED_MEMBER_REMOVED)({ emailId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/allowed-members/${emailId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const importAllowedMembersCSV =
  (selectionPlanId, file) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    postFile(
      null,
      createAction(ALLOWED_MEMBERS_IMPORTED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/allowed-members/csv`,
      file,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
      dispatch(
        showSuccessMessage(
          T.translate("edit_selection_plan.import_allowed_members_success")
        )
      );
    });
  };

/** *********************  PROGRESS FLAGS / PRESENTATION ACTION TYPES  ******************************* */

export const getSelectionPlanProgressFlags =
  (summitId, selectionPlanId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      page: 1,
      per_page: 100,
      order: "+order",
      access_token: accessToken
    };

    return getRequest(
      null,
      createAction(RECEIVE_SELECTION_PLAN_PROGRESS_FLAGS),
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/selection-plans/${selectionPlanId}/allowed-presentation-action-types`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const assignProgressFlag2SelectionPlan =
  (summitId, selectionPlanId, progressFlagId) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    postRequest(
      null,
      createAction(SELECTION_PLAN_ASSIGNED_PROGRESS_FLAG),
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/selection-plans/${selectionPlanId}/allowed-presentation-action-types/${progressFlagId}?access_token=${accessToken}`,
      {},
      authErrorHandler
    )({})(dispatch).then(() => {
      dispatch(stopLoading());
      dispatch(
        showSuccessMessage(
          T.translate("edit_selection_plan.selection_plan_saved")
        )
      );
    });
  };

export const updateProgressFlagOrder =
  (selectionPlanId, progressFlags, progressFlagId, newOrder) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    const progressFlag = progressFlags.find((r) => r.id === progressFlagId);

    progressFlag.order = newOrder;

    return putRequest(
      null,
      createAction(SELECTION_PLAN_PROGRESS_FLAG_ORDER_UPDATED)(progressFlags),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/allowed-presentation-action-types/${progressFlagId}`,
      progressFlag,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const unassignProgressFlagFromSelectionPlan =
  (selectionPlanId, progressFlagId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(SELECTION_PLAN_PROGRESS_FLAG_REMOVED)({ progressFlagId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/selection-plans/${selectionPlanId}/allowed-presentation-action-types/${progressFlagId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveSelectionPlanSettings =
  (marketingSettings, selectionPlanId) => async (dispatch) =>
    Promise.all(
      Object.keys(marketingSettings).map((m) => {
        const setting_type =
          m === "cfp_presentation_edition_custom_message" ? "TEXTAREA" : "TEXT";
        const questionValue =
          typeof marketingSettings[m].value === "boolean"
            ? marketingSettings[m].value
              ? "1"
              : "0"
            : marketingSettings[m].value;
        const mkt_setting = {
          id: marketingSettings[m].id,
          type: setting_type,
          key: m.toUpperCase(),
          value: questionValue ?? "",
          selection_plan_id: selectionPlanId
        };
        return dispatch(saveMarketingSetting(mkt_setting));
      })
    );
