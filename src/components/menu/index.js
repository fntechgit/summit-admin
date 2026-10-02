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
import { withRouter } from "react-router-dom";
import Divider from "@mui/material/Divider";
import SubMenuItem from "./sub-menu-item";
import MenuItem from "./menu-item";
import ExpandableItem from "./expandable-item";
import Member from "../../models/member";
import { getGlobalItems, getSummitItems } from "./menu-definition";

const Menu = ({ currentSummit, member, history, onNavigate }) => {
  const memberObj = new Member(member);
  const globalItems = getGlobalItems();
  const summitItems = currentSummit ? getSummitItems(currentSummit.id) : [];

  const onMenuItemClick = (ev, url) => {
    ev.preventDefault();
    if (onNavigate) onNavigate();
    history.push(`/app/${url}`);
  };

  const currentPath = history.location.pathname;

  const drawMenuItem = (item) => {
    const hasAccess =
      !item.accessRoute || memberObj.hasAccess(item.accessRoute);

    if (!hasAccess) return null;

    if (item.subItems) {
      return (
        <SubMenuItem
          key={item.name}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...item}
          memberObj={memberObj}
          onItemClick={onMenuItemClick}
          currentPath={currentPath}
        />
      );
    }
    return (
      <MenuItem
        key={item.name}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...item}
        selected={currentPath === `/app/${item.linkUrl}`}
        onClick={(e) => onMenuItemClick(e, item.linkUrl)}
      />
    );
  };

  return (
    <>
      <ExpandableItem label={T.translate("menu.general")} isHeader>
        {globalItems.map(drawMenuItem)}
      </ExpandableItem>

      {!!currentSummit?.id && (
        <>
          <Divider sx={{ my: 2 }} />
          <ExpandableItem label={currentSummit.name} isHeader>
            {summitItems.map(drawMenuItem)}
          </ExpandableItem>
        </>
      )}
    </>
  );
};

export default withRouter(Menu);
