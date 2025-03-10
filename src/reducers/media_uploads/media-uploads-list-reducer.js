/**
 * Copyright 2017 OpenStack Foundation
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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_MEDIA_UPLOADS,
  REQUEST_MEDIA_UPLOADS,
  MEDIA_UPLOAD_DELETED
} from "../../actions/media-upload-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  media_uploads: [],
  term: null,
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10
};

const mediaUploadListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_MEDIA_UPLOADS: {
      const { order, orderDir, term } = payload;

      return { ...state, order, orderDir, term };
    }
    case RECEIVE_MEDIA_UPLOADS: {
      const { last_page: lastPage, current_page: currentPage } =
        payload.response;
      const media_uploads = payload.response.data.map((mft) => ({
        id: mft.id,
        name: mft.name,
        description: mft.description
      }));

      return {
        ...state,
        media_uploads,
        currentPage,
        lastPage
      };
    }
    case MEDIA_UPLOAD_DELETED: {
      const { mediaUploadId } = payload;
      return {
        ...state,
        media_uploads: state.media_uploads.filter(
          (mu) => mu.id !== mediaUploadId
        )
      };
    }
    default:
      return state;
  }
};

export default mediaUploadListReducer;
