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

export const DefaultEventMinutesDuration = 10;
export const ScheduleEventsSearchResultMaxPage = 25;
export const PresentationTypeClassName = "PRESENTATION_TYPE";

export const ExtraQuestionsTypeAllowSubQuestion = [
  "ComboBox",
  "CheckBoxList",
  "RadioButtonList",
  "CountryComboBox"
];

export const SubQuestionAnswerValuesOperators = [
  { value: "And", label: "And" },
  { value: "Or", label: "Or" }
];
export const SubQuestionVisibilityOptions = [
  { value: "Visible", label: "Show" },
  { value: "NotVisible", label: "Hide" }
];
export const SubQuestionVisibilityConditions = [
  { value: "Equal", label: "Equal" },
  { value: "NotEqual", label: "Not Equal" }
];

export const MaxTextLengthForTicketTypesOnTable = 70;
export const MaxTextLengthForTagsOnTable = 70;

export const TBALocation = { id: 0, name: "TBD", class_name: "SummitVenue" };

export const SpeakersSources = {
  speakers: "speakers",
  submitters: "submitters",
  submitters_no_speakers: "submitters_no_speakers"
};

export const HAS_TICKETS = "HAS_TICKETS";
export const HAS_NO_TICKETS = "HAS_NO_TICKETS";

// we need it lowercase for reports
export const ALL_FILTER = "all";
export const OR_FILTER = "any";

export const ReservationStatusPaid = "Paid";

export const ReservationStatusRequestedRefund = "RequestedRefund";

export const EMAIL_TEMPLATE_TYPE_HTML = "html";
export const EMAIL_TEMPLATE_TYPE_MJML = "mjml";

export const REG_LITE_BOOLEAN_SETTINGS = [
  "REG_LITE_ALLOW_PROMO_CODES",
  "REG_LITE_SHOW_COMPANY_INPUT",
  "REG_LITE_SHOW_COMPANY_INPUT_DEFAULT_OPTIONS"
];

export const DUMMY_ACTION = "DUMMY_ACTION";

export const DEFAULT_CURRENT_PAGE = 1;

export const DEFAULT_PER_PAGE = 10;

export const DEFAULT_ORDER_DIR = 1;

export const ONE_MINUTE = 60;
export const FIFTEEN_MINUTES = 900;
export const HOUR_AND_HALF = 5400;
export const SECONDS_TO_MINUTES = 60;
export const MILLISECONDS_IN_SECOND = 1000;

export const DEBOUNCE_WAIT = 500;

export const SORT_ASCENDING = 1;
export const SORT_DESCENDING = -1;

export const DEFAULT_EXPORT_PAGE_SIZE = 500;

export const DATE_FILTER_ARRAY_SIZE = 2;

export const MILLISECONDS_TO_SECONDS = 1000;

export const INDEX_NOT_FOUND = -1;

export const ERROR_CODE_403 = 403;

export const ERROR_CODE_401 = 401;

export const ERROR_CODE_412 = 412;

export const ERROR_CODE_500 = 500;

export const HEX_RADIX = 16;

