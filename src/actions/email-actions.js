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
import Swal from "sweetalert2";
import {
  VALIDATE,
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
  fetchResponseHandler,
  fetchErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import URI from "urijs";
import history from "../history";
import { checkOrFilter, getAccessTokenSafely } from "../utils/methods";
import { saveMarketingSetting } from "./marketing-actions";
import {
  DEBOUNCE_WAIT,
  DEFAULT_PER_PAGE,
  ERROR_CODE_412,
  HUNDRED_PER_PAGE
} from "../utils/constants";

export const REQUEST_TEMPLATES = "REQUEST_TEMPLATES";
export const RECEIVE_TEMPLATES = "RECEIVE_TEMPLATES";
export const RECEIVE_TEMPLATE = "RECEIVE_TEMPLATE";
export const RESET_TEMPLATE_FORM = "RESET_TEMPLATE_FORM";
export const TEMPLATE_UPDATED = "TEMPLATE_UPDATED";
export const TEMPLATE_ADDED = "TEMPLATE_ADDED";
export const TEMPLATE_DELETED = "TEMPLATE_DELETED";

export const REQUEST_EMAILS = "REQUEST_EMAILS";
export const RECEIVE_EMAILS = "RECEIVE_EMAILS";
export const REQUEST_EMAILS_BY_USER = "REQUEST_EMAILS_BY_USER";
export const RECEIVE_EMAILS_BY_USER = "RECEIVE_EMAILS_BY_USER";

export const REQUEST_EMAIL_CLIENTS = "REQUEST_EMAIL_CLIENTS";
export const RECEIVE_EMAIL_CLIENTS = "RECEIVE_EMAIL_CLIENTS";

export const REQUEST_TEMPLATE_RENDER = "REQUEST_TEMPLATE_RENDER";
export const TEMPLATE_RENDER_RECEIVED = "TEMPLATE_RENDER_RECEIVED";
export const UPDATE_JSON_DATA = "UPDATE_JSON_DATA";
export const VALIDATE_RENDER = "VALIDATE_RENDER";

export const RECEIVE_EMAIL_SETTINGS = "RECEIVE_EMAIL_SETTINGS";

export const getEmailTemplates =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (term) {
      params.identifier__contains = term;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_TEMPLATES),
      createAction(RECEIVE_TEMPLATES),
      `${window.EMAIL_API_BASE_URL}/api/v1/mail-templates`,
      authErrorHandler,
      { order, orderDir, term }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getEmailTemplate = (templateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = { access_token: accessToken, expand: "parent,versions" };

  return getRequest(
    null,
    createAction(RECEIVE_TEMPLATE),
    `${window.EMAIL_API_BASE_URL}/api/v1/mail-templates/${templateId}`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const resetTemplateForm = () => (dispatch) => {
  dispatch(createAction(RESET_TEMPLATE_FORM)({}));
};

export const saveEmailTemplate =
  (entity, noAlert = false) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const normalizedEntity = normalizeEntity(entity);
    const params = { access_token: accessToken, expand: "parent,versions" };

    if (entity.id) {
      putRequest(
        null,
        createAction(TEMPLATE_UPDATED),
        `${window.EMAIL_API_BASE_URL}/api/v1/mail-templates/${entity.id}`,
        normalizedEntity,
        customErrorHandler,
        entity
      )(params)(dispatch).then(() => {
        if (!noAlert)
          dispatch(showSuccessMessage(T.translate("emails.template_saved")));
        else dispatch(stopLoading());
      });
    } else {
      const success_message = {
        title: T.translate("general.done"),
        html: T.translate("emails.template_created"),
        type: "success"
      };

      postRequest(
        null,
        createAction(TEMPLATE_ADDED),
        `${window.EMAIL_API_BASE_URL}/api/v1/mail-templates`,
        normalizedEntity,
        customErrorHandler,
        entity
      )(params)(dispatch).then((payload) => {
        dispatch(
          showMessage(success_message, () => {
            history.push(`/app/emails/templates/${payload.response.id}`);
          })
        );
      });
    }
  };

export const deleteEmailTemplate = (templateId) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return deleteRequest(
    null,
    createAction(TEMPLATE_DELETED)({ templateId }),
    `${window.EMAIL_API_BASE_URL}/api/v1/mail-templates/${templateId}`,
    null,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const renderEmailTemplate = (json, html) => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  const params = {
    access_token: accessToken
  };

  return putRequest(
    createAction(REQUEST_TEMPLATE_RENDER),
    createAction(TEMPLATE_RENDER_RECEIVED),
    `${window.EMAIL_API_BASE_URL}/api/v1/mail-templates/all/render`,
    { payload: json, html },
    renderErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

const renderErrorHandler = (err) => (dispatch) => {
  dispatch({
    type: VALIDATE_RENDER,
    payload: { errors: err.response.body }
  });
};

const normalizeEntity = (entity) => {
  const normalizedEntity = { ...entity };

  delete normalizedEntity.id;
  delete normalizedEntity.created;
  delete normalizedEntity.modified;

  if (entity.parent) {
    normalizedEntity.parent = entity.parent.id;
  }

  return normalizedEntity;
};

export const queryTemplates = _.debounce(async (input, callback) => {
  const accessToken = await getAccessTokenSafely();

  const endpoint = URI(`${window.EMAIL_API_BASE_URL}/api/v1/mail-templates`);

  input = escapeFilterValue(input);

  endpoint.addQuery("access_token", accessToken);
  endpoint.addQuery("order", "-id");

  if (input) {
    endpoint.addQuery("identifier__startswith", input);
    endpoint.addQuery("page", 1);
    endpoint.addQuery("per_page", HUNDRED_PER_PAGE);
  }

  fetch(endpoint)
    .then(fetchResponseHandler)
    .then((json) => {
      const options = [...json.data];

      callback(options);
    })
    .catch(fetchErrorHandler);
}, DEBOUNCE_WAIT);

/** ********************************************************************************************************* */
/*                          SENT EMAILS                                                                     */
/** ********************************************************************************************************* */

export const getSentEmailsByTemplatesAndEmail =
  (templates = [], toEmail, page = 1, perPage = DEFAULT_PER_PAGE) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "template",
      is_sent: 1,
      template__identifier__in: templates.join(),
      to_email__contains: toEmail,
      order: "-id"
    };

    return getRequest(
      createAction(REQUEST_EMAILS_BY_USER),
      createAction(RECEIVE_EMAILS_BY_USER),
      `${window.EMAIL_API_BASE_URL}/api/v1/mails`,
      authErrorHandler,
      {}
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getSentEmails =
  (
    term = null,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    order = "id",
    orderDir = 1,
    filters = {}
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();

    dispatch(startLoading());

    let params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "template"
    };

    if (term) {
      params.term = term.toLowerCase();
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === 1 ? "" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    const filter = parseFilters(filters);

    if (Object.keys(filter).length > 0) {
      params = { ...params, ...filter };
    }

    return getRequest(
      createAction(REQUEST_EMAILS),
      createAction(RECEIVE_EMAILS),
      `${window.EMAIL_API_BASE_URL}/api/v1/mails`,
      authErrorHandler,
      { order, orderDir, term, filters }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const updateTemplateJsonData = (data) => async (dispatch) => dispatch(createAction(UPDATE_JSON_DATA)(data));

/** ********************************************************************************************************* */
/*                          CLIENTS                                                                     */
/** ********************************************************************************************************* */

export const getAllClients = () => async (dispatch) => {
  const accessToken = await getAccessTokenSafely();

  dispatch(startLoading());

  const params = {
    page: 1,
    per_page: 100,
    access_token: accessToken
  };

  return getRequest(
    createAction(REQUEST_EMAIL_CLIENTS),
    createAction(RECEIVE_EMAIL_CLIENTS),
    `${window.EMAIL_API_BASE_URL}/api/v1/clients`,
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

/** ********************************************************************************************************* */
/*                          EMAIL_SETTINGS                                                                  */
/** ********************************************************************************************************* */

export const getMarketingEmailSettings =
  (page = 1, perPage = HUNDRED_PER_PAGE) =>
  (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      page,
      per_page: perPage,
      key__contains: "EMAIL_TEMPLATE"
    };

    return getRequest(
      null,
      createAction(RECEIVE_EMAIL_SETTINGS),
      `${window.MARKETING_API_BASE_URL}/api/public/v1/config-values/all/shows/${currentSummit.id}`,
      authErrorHandler,
      {}
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const saveMarketingEmailSettings =
  (emailMarketingSettings) => async (dispatch) => Promise.all(
      Object.keys(emailMarketingSettings).map((m) => {
        let value = emailMarketingSettings[m].value ?? "";
        const file = emailMarketingSettings[m].file ?? null;

        if (typeof value === "boolean") {
          value = value ? "1" : "0";
        }

        const email_setting = {
          id: emailMarketingSettings[m].id,
          type: emailMarketingSettings[m].type,
          key: m.toUpperCase(),
          value
        };

        return dispatch(saveMarketingSetting(email_setting, file));
      })
    );

export const customErrorHandler = (err, res) => (dispatch) => {
  const code = err.status;
  let msg = "";

  dispatch(stopLoading());

  switch (code) {
    case ERROR_CODE_412:
      if (Array.isArray(err.response.body)) {
        err.response.body.forEach((er) => {
          msg += `${er  }<br>`;
        });
      } else {
        for (const [key, value] of Object.entries(err.response.body)) {
          if (isNaN(key)) {
            msg += `${key  }: `;
          }

          msg += `${value  }<br>`;
        }
      }

      Swal.fire("Validation error", msg, "warning");

      if (err.response.body.errors) {
        dispatch({
          type: VALIDATE,
          payload: { errors: err.response.body }
        });
      }

      break;
    default:
      dispatch(authErrorHandler(err, res));
  }
};

const parseFilters = (filters) => {
  let filter = {};

  if (filters.is_sent_filter) {
    if (filters.is_sent_filter === "1") filter = { ...filter, is_sent: 1 };
    if (filters.is_sent_filter === "0") filter = { ...filter, is_sent: 0 };
  }

  if (
    filters.sent_date_filter &&
    filters.sent_date_filter.some((e) => e !== null)
  ) {
    if (filters.sent_date_filter.every((e) => e !== null)) {
      filter = {
        ...filter,
        from_sent_date: filters.sent_date_filter[0],
        to_sent_date: filters.sent_date_filter[1]
      };
    } else {
      filter = {
        ...filter,
        [`${
          filters.sent_date_filter[0] !== null
            ? "from_sent_date"
            : "to_sent_date"
        }`]:
          filters.sent_date_filter[0] !== null
            ? filters.sent_date_filter[0]
            : filters.sent_date_filter[1]
      };
    }
  }

  if (filters.template_filter) {
    filter = { ...filter, template__identifier__in: filters.template_filter };
  }

  return checkOrFilter(filters, filter);
};
