/**
 * Copyright 2020 OpenStack Foundation
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

import { RECEIVE_BADGE_SETTINGS } from "../../actions/badge-actions";

const DEFAULT_BADGE_SETTINGS = {
  BADGE_TEMPLATE_BACKGROUND_IMG: {
    id: 0,
    value: "",
    type: "FILE",
    file_preview: "",
    file: null
  },
  BADGE_TEMPLATE_FIRST_NAME_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_LAST_NAME_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_COMPANY_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_WIDTH: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_HEIGHT: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_BACKGROUND_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_BACK_BACKGROUND_IMG: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_MARGIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FONT_FACES_INLINE_DEFINITION: {
    id: 0,
    value: "",
    type: "TEXT"
  },
  BADGE_TEMPLATE_TEXT_FIELDS_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_NAME_DISPLAY_MODE: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_PADDING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_TEXT_ALIGN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_FONT_CASING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_FONT_SIZE_MIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_FONT_SIZE_MAX: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_TEXT_FIT_MODE: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TITLE_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_PADDING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_TEXT_ALIGN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_FONT_CASING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_FONT_SIZE_MIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_FONT_SIZE_MAX: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_TEXT_FIT_MODE: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FIRST_NAME_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_PADDING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_TEXT_ALIGN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_FONT_CASING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_FONT_SIZE_MIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_FONT_SIZE_MAX: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_TEXT_FIT_MODE: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_LAST_NAME_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_PADDING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_TEXT_ALIGN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_FONT_CASING: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_FONT_SIZE_MIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_FONT_SIZE_MAX: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_TEXT_FIT_MODE: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_COMPANY_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FONT: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_QR_DISPLAY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_QR_SIZE: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_QR_TOP: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_QR_LEFT: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_QR_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_TEXT_FIELDS_MARGIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_TEXT_FIELDS_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_FEATURES_MARGIN: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FEATURES_FONT_FAMILY: { id: 0, value: "", type: "TEXT" },
  BADGE_TEMPLATE_FEATURES_TEXT_COLOR: { id: 0, value: "", type: "HEX_COLOR" },
  BADGE_TEMPLATE_FEATURES_FONT_SIZE: { id: 0, value: "", type: "TEXT" }
};

const DEFAULT_STATE = {
  badge_settings: DEFAULT_BADGE_SETTINGS,
  errors: {}
};

const badgeSettingsReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case RECEIVE_BADGE_SETTINGS: {
      const reducerSettings = { ...DEFAULT_BADGE_SETTINGS };
      if (payload.response.data.length > 0) {
        payload.response.data.forEach((apiValue) => {
          const { key } = apiValue;
          reducerSettings[key] = apiValue;
        });
      }
      return { ...state, badge_settings: { ...reducerSettings } };
    }
    default:
      return state;
  }
};

export default badgeSettingsReducer;
