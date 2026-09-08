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

import T from "i18n-react/dist/i18n-react";
import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { queryTemplates } from "../../actions/email-actions";
import { DATE_FILTER_ARRAY_SIZE } from "../../utils/constants";

export const getCriterias = () => [
  {
    key: "is_sent",
    label: T.translate("email_logs.is_sent_filter"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: [
          { value: "1", label: T.translate("emails.sent") },
          { value: "0", label: T.translate("email_logs.not_sent") }
        ]
      }
    }
  },
  {
    key: "sent_date",
    label: T.translate("email_logs.sent_date"),
    operators: [OPERATORS.BEFORE, OPERATORS.AFTER],
    values: {
      type: "datetime",
      props: { mode: "datetime", timezone: "UTC" }
    }
  },
  {
    key: "template",
    label: T.translate("email_logs.template_filter"),
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: {
        queryFunction: queryTemplates,
        formatOption: (t) => ({ value: t.identifier, label: t.identifier }),
        multiple: false
      }
    },
    customParser: (f) => {
      const value = f.value?.value ?? f.value;
      return value ? [`${f.criteria}${f.operator}${value}`] : undefined;
    }
  }
];

export const buildEmailFiltersFromGridFilter = (filterValues) => {
  const isSentEntry = filterValues.find((f) => f.criteria === "is_sent");
  const afterEntry = filterValues.find(
    (f) => f.criteria === "sent_date" && f.operator === OPERATORS.AFTER.value
  );
  const beforeEntry = filterValues.find(
    (f) => f.criteria === "sent_date" && f.operator === OPERATORS.BEFORE.value
  );
  const templateEntry = filterValues.find((f) => f.criteria === "template");

  const sentDateFilter = Array(DATE_FILTER_ARRAY_SIZE).fill(null);
  sentDateFilter[0] = afterEntry?.value ?? null;
  sentDateFilter[1] = beforeEntry?.value ?? null;

  return {
    is_sent_filter: isSentEntry?.value ?? null,
    sent_date_filter: sentDateFilter,
    template_filter: templateEntry?.value?.value ?? ""
  };
};
