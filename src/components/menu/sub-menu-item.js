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
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MenuItem from "./menu-item";
import ExpandableItem from "./expandable-item";

const GROUP_PL = 4;
const GROUP_LEAF_PL = 6;
const INFO_ICON_ML = 0.5;

const isAccessible = (item, memberObj) =>
  item.isGroup ||
  !item.hasOwnProperty("accessRoute") ||
  memberObj.hasAccess(item.accessRoute);

const isActive = (item, currentPath, memberObj) =>
  item.isGroup
    ? item.subItems
        .filter((ch) => isAccessible(ch, memberObj))
        .some((ch) => isActive(ch, currentPath, memberObj))
    : currentPath === `/app/${item.linkUrl}`;

function SubMenuItem({ name, onItemClick, subItems, memberObj, currentPath }) {
  const _subItems = subItems.filter((item) => isAccessible(item, memberObj));

  if (_subItems.length === 0) return null;

  const isChildActive = _subItems.some((ch) =>
    isActive(ch, currentPath, memberObj)
  );

  const renderLeaf = (item, pl) => (
    <MenuItem
      key={item.name}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...item}
      nested
      pl={pl}
      selected={currentPath === `/app/${item.linkUrl}`}
      onClick={(e) => onItemClick(e, item.linkUrl)}
    />
  );

  const renderGroup = (item) => {
    const groupItems = item.subItems.filter((ch) =>
      isAccessible(ch, memberObj)
    );

    if (groupItems.length === 0) return null;

    return (
      <ExpandableItem
        key={item.name}
        pl={GROUP_PL}
        label={
          <>
            {T.translate(`menu.${item.name}`)}
            {item.infoKey && (
              <Tooltip title={T.translate(`menu.${item.infoKey}`)}>
                <InfoOutlinedIcon
                  fontSize="small"
                  sx={{ ml: INFO_ICON_ML, color: "text.secondary" }}
                  onClick={(ev) => ev.stopPropagation()}
                />
              </Tooltip>
            )}
          </>
        }
        defaultOpen={groupItems.some((ch) =>
          isActive(ch, currentPath, memberObj)
        )}
      >
        {groupItems.map((ch) => renderLeaf(ch, GROUP_LEAF_PL))}
      </ExpandableItem>
    );
  };

  return (
    <ExpandableItem
      label={T.translate(`menu.${name}`)}
      defaultOpen={isChildActive}
    >
      {_subItems.map((item) =>
        item.isGroup ? renderGroup(item) : renderLeaf(item)
      )}
    </ExpandableItem>
  );
}

export default SubMenuItem;
