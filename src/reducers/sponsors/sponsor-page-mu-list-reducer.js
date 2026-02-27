/**
 * Copyright 2026 OpenStack Foundation
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

import moment from "moment-timezone";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  RECEIVE_GENERAL_MEDIA_UPLOADS,
  RECEIVE_SPONSOR_MEDIA_UPLOADS,
  REQUEST_GENERAL_MEDIA_UPLOADS,
  REQUEST_SPONSOR_MEDIA_UPLOADS,
  SPONSOR_MEDIA_UPLOAD_FILE_DELETED,
  SPONSOR_MEDIA_UPLOAD_FILE_UPLOADED
} from "../../actions/sponsor-mu-actions";
import { bytesToMb } from "../../utils/methods";
import {
  DEADLINE_ALERT_DAYS,
  SPONSOR_MEDIA_UPLOAD_STATUS
} from "../../utils/constants";

const DEFAULT_STATE = {
  sponsorRequests: {
    requests: [],
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: 0
  },
  generalRequests: {
    requests: [],
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: 0
  },
  summitTZ: ""
};

const getStatus = (mediaObject) => {
  let status = SPONSOR_MEDIA_UPLOAD_STATUS.COMPLETE;
  if (!mediaObject.media_upload) {
    if (mediaObject.upload_deadline < moment().unix()) {
      status = SPONSOR_MEDIA_UPLOAD_STATUS.DEADLINE_MISSED;
    } else if (
      mediaObject.upload_deadline <
      moment().add(DEADLINE_ALERT_DAYS, "days").unix()
    ) {
      status = SPONSOR_MEDIA_UPLOAD_STATUS.DEADLINE_ALERT;
    } else {
      status = SPONSOR_MEDIA_UPLOAD_STATUS.PENDING;
    }
  }

  return status;
};

const mapMediaObject = (mediaObject, summitTZ) => {
  const deadline = mediaObject.upload_deadline
    ? epochToMomentTimeZone(mediaObject.upload_deadline, summitTZ)?.format(
        "YYYY/MM/DD"
      )
    : "N/A";

  return {
    ...mediaObject,
    add_on: mediaObject.add_ons.map((a) => a.name).join(", "),
    max_size: `${bytesToMb(mediaObject.max_file_size)} MB`,
    format: mediaObject.file_type?.allowed_extensions || "N/A",
    deadline,
    status: getStatus(mediaObject)
  };
};

const sponsorPageMUListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_MEDIA_UPLOADS: {
      const { order, orderDir, page, summitTZ } = payload;

      return {
        ...state,
        sponsorRequests: {
          ...state.sponsorRequests,
          order,
          orderDir,
          requests: [],
          currentPage: page
        },
        summitTZ
      };
    }
    case RECEIVE_SPONSOR_MEDIA_UPLOADS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const requests = payload.response.data.map((a) =>
        mapMediaObject(a, state.summitTZ)
      );

      return {
        ...state,
        sponsorRequests: {
          ...state.sponsorRequests,
          requests,
          currentPage,
          totalCount: total,
          lastPage
        }
      };
    }
    case REQUEST_GENERAL_MEDIA_UPLOADS: {
      const { order, orderDir, page, summitTZ } = payload;

      return {
        ...state,
        generalRequests: {
          ...state.generalRequests,
          order,
          orderDir,
          requests: [],
          currentPage: page
        },
        summitTZ
      };
    }
    case RECEIVE_GENERAL_MEDIA_UPLOADS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const requests = payload.response.data.map((a) =>
        mapMediaObject(a, state.summitTZ)
      );

      return {
        ...state,
        generalRequests: {
          ...state.generalRequests,
          requests,
          currentPage,
          totalCount: total,
          lastPage
        }
      };
    }
    case SPONSOR_MEDIA_UPLOAD_FILE_UPLOADED: {
      const { moduleId, ...file } = payload;
      return {
        ...state,
        sponsorRequests: {
          ...state.sponsorRequests,
          requests: state.sponsorRequests.requests.map((r) =>
            r.id === moduleId
              ? {
                  ...r,
                  media_upload: file,
                  status: getStatus({ ...r, media_upload: true })
                }
              : r
          )
        },
        generalRequests: {
          ...state.generalRequests,
          requests: state.generalRequests.requests.map((r) =>
            r.id === moduleId
              ? {
                  ...r,
                  media_upload: file,
                  status: getStatus({ ...r, media_upload: true })
                }
              : r
          )
        }
      };
    }
    case SPONSOR_MEDIA_UPLOAD_FILE_DELETED: {
      const { moduleId } = payload;
      return {
        ...state,
        sponsorRequests: {
          ...state.sponsorRequests,
          requests: state.sponsorRequests.requests.map((r) =>
            r.id === moduleId
              ? {
                  ...r,
                  media_upload: null,
                  status: getStatus({ ...r, media_upload: false })
                }
              : r
          )
        },
        generalRequests: {
          ...state.generalRequests,
          requests: state.generalRequests.requests.map((r) =>
            r.id === moduleId
              ? {
                  ...r,
                  media_upload: null,
                  status: getStatus({ ...r, media_upload: false })
                }
              : r
          )
        }
      };
    }
    default:
      return state;
  }
};

export default sponsorPageMUListReducer;
