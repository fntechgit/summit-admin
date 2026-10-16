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

import T from "i18n-react/dist/i18n-react";
import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";

const EMAIL_FILTER_OPERATORS = {
  [OPERATORS.LIKE.value]: "owner_email=@",
  [OPERATORS.HAS_NOT.value]: "not_owner_email=@",
  [OPERATORS.IS.value]: "owner_email=="
};

export const getCriterias = () => [
  {
    key: "email_filter",
    label: T.translate("room_booking_list.owner_email"),
    operators: [OPERATORS.LIKE, OPERATORS.HAS_NOT, OPERATORS.IS],
    values: {
      type: "text",
      props: { placeholder: T.translate("email_filter.placeholders.value") }
    }
  }
];

export const buildRoomBookingFilters = (filterValues) => {
  const emailEntry = filterValues.find((f) => f.criteria === "email_filter");

  return {
    email_filter: {
      operator: EMAIL_FILTER_OPERATORS[emailEntry?.operator] ?? null,
      value: emailEntry?.value ?? ""
    }
  };
};
