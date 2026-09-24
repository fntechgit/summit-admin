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
 */

import T from "i18n-react/dist/i18n-react";
import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { DATE_FILTER_ARRAY_SIZE } from "../../utils/constants";

export const getCriterias = (audienceDDL, badgeTypesDDL) => [
  {
    key: "audience_filter",
    label: T.translate("ticket_type_list.audience"),
    operators: [OPERATORS.IS],
    values: { type: "select", props: { options: audienceDDL, multiple: true } }
  },
  {
    key: "badge_type_filter",
    label: T.translate("ticket_type_list.badge_type_name"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: { options: badgeTypesDDL, multiple: true }
    }
  },
  {
    key: "sale_period_filter",
    label: T.translate("ticket_type_list.sale_period"),
    operators: [OPERATORS.AFTER, OPERATORS.BEFORE],
    values: { type: "datetime", props: { mode: "datetime" } }
  }
];

export const buildTicketTypeFilters = (filterValues) => {
  const audienceEntry = filterValues.find(
    (f) => f.criteria === "audience_filter"
  );
  const badgeTypeEntry = filterValues.find(
    (f) => f.criteria === "badge_type_filter"
  );
  const afterEntry = filterValues.find(
    (f) =>
      f.criteria === "sale_period_filter" &&
      f.operator === OPERATORS.AFTER.value
  );
  const beforeEntry = filterValues.find(
    (f) =>
      f.criteria === "sale_period_filter" &&
      f.operator === OPERATORS.BEFORE.value
  );

  const salePeriodFilter = Array(DATE_FILTER_ARRAY_SIZE).fill(null);
  salePeriodFilter[0] = afterEntry?.value ?? null;
  salePeriodFilter[1] = beforeEntry?.value ?? null;

  return {
    audience_filter: audienceEntry?.value ?? [],
    badge_type_filter: badgeTypeEntry?.value ?? [],
    sale_period_filter: salePeriodFilter
  };
};
