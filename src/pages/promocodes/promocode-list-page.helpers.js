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
 */

import T from "i18n-react/dist/i18n-react";
import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  queryMembers,
  queryTags
} from "openstack-uicore-foundation/lib/utils/query-actions";

const memberFormatOption = (member) => {
  const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`;
  return {
    value: member.id,
    label: member.email
      ? `${fullName} (${member.email})`
      : `${fullName} (${member.id})`
  };
};

const tagFormatOption = (tag) => ({ value: tag.id, label: tag.tag });

// "ALL" is the reducer's no-filter placeholder, not a real type
export const getCriterias = (allTypes, allClasses) => [
  {
    key: "type",
    label: T.translate("promocode_list.type"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: allTypes
          .filter((t) => t !== "ALL")
          .map((t) => ({ label: t, value: t }))
      }
    },
    customParser: (f) => [`type==${f.value}`]
  },
  {
    key: "class_name",
    label: T.translate("promocode_list.class_name"),
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: allClasses.map((c) => ({
          label: c.class_name,
          value: c.class_name
        })),
        multiple: true
      }
    },
    customParser: (f) => [`class_name==${f.value.join("||")}`]
  },
  {
    key: "tags",
    label: T.translate("promocode_list.tags"),
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: {
        queryFunction: (input, callback) => queryTags(null, input, callback),
        formatOption: tagFormatOption,
        multiple: true
      }
    },
    customParser: (f) => [`tag_id==${f.value.map((t) => t.value).join("||")}`]
  },
  {
    key: "creator",
    label: T.translate("promocode_list.creator"),
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: { queryFunction: queryMembers, formatOption: memberFormatOption }
    },
    customParser: (f) => [`creator_email==${f.value.raw.email}`]
  },
  {
    key: "assignee",
    label: T.translate("promocode_list.assignee"),
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: { queryFunction: queryMembers, formatOption: memberFormatOption }
    },
    // the assignee is either the owner or the contact of the promo code
    customParser: (f) => [
      `owner_email==${f.value.raw.email},contact_email==${f.value.raw.email}`
    ]
  }
];
