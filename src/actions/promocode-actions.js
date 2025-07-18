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
  escapeFilterValue,
  postFile
} from "openstack-uicore-foundation/lib/utils/actions";
import history from "../history";
import { checkOrFilter, getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_PER_PAGE } from "../utils/constants";

export const EXISTING_SPEAKERS_PROMO_CODE = 1;
export const EXISTING_SPEAKERS_DISCOUNT_CODE = 2;
export const AUTO_GENERATED_SPEAKERS_PROMO_CODE = 3;
export const AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE = 4;

export const REQUEST_PROMOCODES = "REQUEST_PROMOCODES";
export const RECEIVE_PROMOCODES = "RECEIVE_PROMOCODES";
export const RECEIVE_PROMOCODE = "RECEIVE_PROMOCODE";
export const RECEIVE_PROMOCODE_META = "RECEIVE_PROMOCODE_META";
export const RESET_PROMOCODE_FORM = "RESET_PROMOCODE_FORM";
export const UPDATE_PROMOCODE = "UPDATE_PROMOCODE";
export const PROMOCODE_UPDATED = "PROMOCODE_UPDATED";
export const PROMOCODE_ADDED = "PROMOCODE_ADDED";
export const PROMOCODE_DELETED = "PROMOCODE_DELETED";
export const EMAIL_SENT = "EMAIL_SENT";
export const PROMO_CODES_IMPORTED = "PROMO_CODES_IMPORTED";
export const DISCOUNT_TICKET_ADDED = "DISCOUNT_TICKET_ADDED";
export const DISCOUNT_TICKET_DELETED = "DISCOUNT_TICKET_DELETED";
export const BADGE_FEATURE_ADDED = "BADGE_FEATURE_ADDED";
export const BADGE_FEATURE_REMOVED = "BADGE_FEATURE_REMOVED";
export const SPEAKER_ASSIGNED = "SPEAKER_ASSIGNED";
export const SPEAKER_ASSIGNED_LOCALLY = "SPEAKER_ASSIGNED_LOCALLY";
export const SPEAKER_UNASSIGNED = "SPEAKER_UNASSIGNED";
export const SPEAKER_UNASSIGNED_LOCALLY = "SPEAKER_UNASSIGNED_LOCALLY";
export const GET_ASSIGNED_SPEAKERS_LOCALLY = "GET_ASSIGNED_SPEAKERS_LOCALLY";
export const REQUEST_ASSIGNED_SPEAKERS = "REQUEST_ASSIGNED_SPEAKERS";
export const RECEIVE_ASSIGNED_SPEAKERS = "RECEIVE_ASSIGNED_SPEAKERS";

const parseFilters = (filters, term = null) => {
  const filter = [];

  if (filters?.typeFilter && filters.typeFilter !== "ALL") {
    filter.push(`type==${filters.typeFilter}`);
  }

  if (filters?.creatorFilter && filters.creatorFilter !== "ALL") {
    filter.push(`creator_email==${filters.creatorFilter.email}`);
  }

  if (filters?.assigneeFilter && filters.assigneeFilter !== "ALL") {
    filter.push(
      `owner_email==${filters.assigneeFilter.email},contact_email==${filters.assigneeFilter.email}`
    );
  }

  if (
    Array.isArray(filters?.classNamesFilter) &&
    filters.classNamesFilter.length > 0
  ) {
    filter.push(`class_name==${filters.classNamesFilter.join("||")}`);
  }

  if (Array.isArray(filters?.tagsFilter) && filters.tagsFilter.length > 0) {
    filter.push(`tag_id==${filters.tagsFilter.map((t) => t.id).join("||")}`);
  }

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    const searchString =
      `code=@${escapedTerm},` +
      `creator=@${escapedTerm},` +
      `creator_email=@${escapedTerm},` +
      `owner=@${escapedTerm},` +
      `owner_email=@${escapedTerm},` +
      `speaker=@${escapedTerm},` +
      `speaker_email=@${escapedTerm},` +
      `contact_email=@${escapedTerm},` +
      `sponsor_company_name=@${escapedTerm}`;

    filter.push(searchString);
  }

  return checkOrFilter(filters, filter);
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  if (entity.class_name?.indexOf("MEMBER_") === 0) {
    if (entity.owner != null) {
      normalizedEntity.first_name = entity.owner.first_name;
      normalizedEntity.last_name = entity.owner.last_name;
      normalizedEntity.email = entity.owner.email;
    }
  } else if (entity.class_name?.indexOf("SPEAKER_") === 0) {
    if (entity.speaker != null) normalizedEntity.speaker_id = entity.speaker.id;
  } else if (entity.class_name?.indexOf("SPEAKERS_") === 0) {
    if (entity.speakers != null && entity.speakers.speakers_list.length > 0) {
      normalizedEntity.speaker_ids = entity.speakers.speakers_list.map(
        (s) => s.id
      );
    }
    delete normalizedEntity.speakers;
  } else if (entity.class_name?.indexOf("SPONSOR_") === 0) {
    if (entity.sponsor != null) normalizedEntity.sponsor_id = entity.sponsor.id;
    if (entity.owner != null) {
      normalizedEntity.first_name = entity.owner.first_name;
      normalizedEntity.last_name = entity.owner.last_name;
      normalizedEntity.email = entity.owner.email;
    }
  }

  // clear dates

  if (entity.valid_since_date === 0) {
    normalizedEntity.valid_since_date = "";
  }

  if (entity.valid_until_date === 0) {
    normalizedEntity.valid_until_date = "";
  }

  if (entity.tags.length > 0) {
    normalizedEntity.tags = entity.tags.map((e) => e.tag);
  }

  delete normalizedEntity.owner;
  delete normalizedEntity.owner_id;
  delete normalizedEntity.speaker;
  delete normalizedEntity.sponsor;
  delete normalizedEntity.apply_to_all_tix;

  return normalizedEntity;
};

export const getPromocodeMeta = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_PROMOCODE_META),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/metadata`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const getPromocodes =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "code",
    orderDir = 1,
    filters = {},
    extraColumns = []
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const filter = parseFilters(filters, term);

    const expand =
      "speaker,owner,sponsor,sponsor.company,creator,tags,owners,owners.speaker";
    const relations =
      "creator,sponsor,tags,speaker,owner,owners,owners.speaker.none,creator.none,sponsor.company,sponsor.company.none";
    const fields =
      "id,code,redeemed,class_name,description,email_sent,first_name,last_name,email,contact_email,owners.speaker.email,owners.speaker.first_name,owners.speaker.last_name,creator.first_name,creator.last_name,sponsor.first_name,sponsor.last_name,sponsor.company.name,tags.tag,owner.first_name,owner.last_name,owner.email,speaker.first_name,speaker.last_name,speaker.email";

    const params = {
      expand,
      relations,
      fields,
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_PROMOCODES),
      createAction(RECEIVE_PROMOCODES),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes`,
      authErrorHandler,
      { page, perPage, order, orderDir, term, filters, extraColumns }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getPromocode = (promocodeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());

  const params = {
    expand:
      "owner,sponsor,sponsor.company,sponsor.sponsorship,sponsor.sponsorship.type,ticket_type,ticket_types_rules,tags,allowed_ticket_types",
    relations:
      "owner,sponsor,ticket_types_rules,tags,allowed_ticket_types,badge_features",
    access_token: accessToken
  };

  return getRequest(
    null,
    createAction(RECEIVE_PROMOCODE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${promocodeId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetPromocodeForm = () => (dispatch) => {
  dispatch(createAction(RESET_PROMOCODE_FORM)({}));
};

export const savePromocode =
  (entity, isSponsor) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const normalizedEntity = normalizeEntity(entity);

    const params = {
      expand:
        "owner,sponsor,sponsor.company,sponsor.sponsorship,speaker,tickets,ticket_type,ticket_types_rules,tags,allowed_ticket_types",
      access_token: accessToken
    };

    if (entity.id) {
      return putRequest(
        createAction(UPDATE_PROMOCODE),
        createAction(PROMOCODE_UPDATED),
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${entity.id}`,
        normalizedEntity,
        authErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        dispatch(
          showSuccessMessage(T.translate("edit_promocode.promocode_saved"))
        );
      });
    }
    const successMessage = {
      title: T.translate("general.done"),
      html: T.translate("edit_promocode.promocode_created"),
      type: "success"
    };

    return postRequest(
      createAction(UPDATE_PROMOCODE),
      createAction(PROMOCODE_ADDED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes`,
      normalizedEntity,
      authErrorHandler,
      entity
    )(params)(dispatch).then((payload) => {
      dispatch(
        showMessage(successMessage, () => {
          history.push(
            `/app/summits/${currentSummit.id}${
              isSponsor ? "/sponsors" : ""
            }/promocodes/${payload.response.id}`
          );
        })
      );
    });
  };

export const deletePromocode = (promocodeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(PROMOCODE_DELETED)({ promocodeId }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${promocodeId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const sendEmail = (promocodeId) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  return postRequest(
    null,
    createAction(EMAIL_SENT),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${promocodeId}/mail`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(
      showMessage(
        T.translate("general.done"),
        T.translate("general.mail_sent"),
        "success"
      )
    );
  });
};

export const exportPromocodes =
  (term = null, order = "code", orderDir = 1, filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filename = `${currentSummit.name}-Promocodes.csv`;

    const params = {
      access_token: accessToken,
      expand: "owner_name,owner_email,sponsor_name",
      columns:
        "code,type,owner_name,owner_email,sponsor_name,redeemed,email_sent"
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

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/csv`,
        params,
        filename
      )
    );
  };

/** **********************  BADGE FEATURES ********************************* */

export const addBadgeFeatureToPromocode =
  (promocodeId, badgeFeature) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return putRequest(
      null,
      createAction(BADGE_FEATURE_ADDED)({ badgeFeature }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${promocodeId}/badge-features/${badgeFeature.id}`,
      {},
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const removeBadgeFeatureFromPromocode =
  (promocodeId, badgeFeatureId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(BADGE_FEATURE_REMOVED)({ badgeFeatureId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${promocodeId}/badge-features/${badgeFeatureId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

/** **********************  DICOUNT PROMOCODES ********************************* */

export const addDiscountTicket = (ticket) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken,
    expand: "ticket_types_rules"
  };

  return putRequest(
    null,
    createAction(DISCOUNT_TICKET_ADDED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${ticket.owner_id}/ticket-types/${ticket.ticket_type_id}`,
    ticket,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const deleteDiscountTicket =
  (promocodeId, ticketId, ticketTypeId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(DISCOUNT_TICKET_DELETED)({ ticketId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/${promocodeId}/ticket-types/${ticketTypeId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const importPromoCodesCSV = (file) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  postFile(
    null,
    createAction(PROMO_CODES_IMPORTED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/promo-codes/csv`,
    file,
    {},
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    window.location.reload();
  });
};

/** **********************  PROMOCODE SPEAKERS ********************************* */

export const getAssignedSpeakers =
  (
    entity,
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch, getState) => {
    if (entity.id === 0)
      return dispatch(
        createAction(GET_ASSIGNED_SPEAKERS_LOCALLY)({
          promoCodeClassName: entity.class_name,
          term,
          page,
          perPage,
          order,
          orderDir
        })
      );

    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      expand: "speaker",
      access_token: accessToken
    };

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`full_name=@${escapedTerm},email=@${escapedTerm}`);
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    const promoCodeRoute =
      entity.class_name === "SPEAKERS_PROMO_CODE"
        ? "speakers-promo-codes"
        : "speakers-discount-codes";

    return getRequest(
      createAction(REQUEST_ASSIGNED_SPEAKERS),
      createAction(RECEIVE_ASSIGNED_SPEAKERS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/${promoCodeRoute}/${entity.id}/speakers`,
      authErrorHandler,
      { entity, order, orderDir, page, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const assignSpeaker = (entity) => async (dispatch, getState) => {
  if (entity.id === 0)
    return dispatch(createAction(SPEAKER_ASSIGNED_LOCALLY)({ entity }));

  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  dispatch(startLoading());
  return postRequest(
    null,
    createAction(SPEAKER_ASSIGNED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/speakers-promo-codes/${entity.id}/speakers/${entity.speaker.id}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
    dispatch(getAssignedSpeakers(entity));
  });
};

export const unAssignSpeaker =
  (className, promocodeId, speakerId) => async (dispatch, getState) => {
    if (promocodeId === 0 && speakerId)
      return dispatch(
        createAction(SPEAKER_UNASSIGNED_LOCALLY)({
          class_name: className,
          speakerId
        })
      );

    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    dispatch(startLoading());

    return deleteRequest(
      null,
      createAction(SPEAKER_UNASSIGNED)({ speakerId }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/speakers-promo-codes/${promocodeId}/speakers/${speakerId}`,
      null,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
