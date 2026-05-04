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

import React from "react";
import T from "i18n-react/dist/i18n-react";
import MenuItem from "./menu-item";
import ExpandableItem from "./expandable-item";

function SubMenuItem({ name, onItemClick, subItems, memberObj, currentPath }) {
  const _subItems = subItems.filter(
    (item) =>
      !item.hasOwnProperty("accessRoute") ||
      memberObj.hasAccess(item.accessRoute)
  );

  const isChildActive = _subItems.some(
    (ch) => currentPath === `/app/${ch.linkUrl}`
  );

  return (
    <ExpandableItem
      label={T.translate(`menu.${name}`)}
      defaultOpen={isChildActive}
    >
      {_subItems.map((item) => (
        <MenuItem
          key={item.name}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...item}
          nested
          selected={currentPath === `/app/${item.linkUrl}`}
          onClick={(e) => onItemClick(e, item.linkUrl)}
        />
      ))}
    </ExpandableItem>
  );
}

export default SubMenuItem;
