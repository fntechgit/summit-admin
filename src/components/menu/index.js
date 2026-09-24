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
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import SubMenuItem from "./sub-menu-item";
import MenuItem from "./menu-item";
import ExpandableItem from "./expandable-item";
import Member from "../../models/member";
import { getGlobalItems, getSummitItems } from "./menu-definition";

const DRAWER_WIDTH = 260;

const Menu = ({
  currentSummit,
  member,
  history,
  menuOpen,
  toggleMenu,
  onMenuMouseEnter,
  onMenuMouseLeave
}) => {
  const memberObj = new Member(member);
  const globalItems = getGlobalItems();
  const summitItems = currentSummit ? getSummitItems(currentSummit.id) : [];

  const closeMenu = () => {
    if (menuOpen) toggleMenu();
  };

  const onMenuItemClick = (ev, url) => {
    ev.preventDefault();
    closeMenu();
    history.push(`/app/${url}`);
  };

  const currentPath = history.location.pathname;

  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

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
    <Drawer
      anchor="left"
      open={Boolean(menuOpen)}
      onClose={closeMenu}
      slotProps={{
        root: { keepMounted: true },
        paper: {
          sx: { width: DRAWER_WIDTH },
          ...(canHover && {
            onMouseEnter: onMenuMouseEnter,
            onMouseLeave: onMenuMouseLeave
          })
        }
      }}
    >
      <Box
        role="presentation"
        sx={{ width: DRAWER_WIDTH, overflowY: "auto", pb: 3 }}
      >
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
      </Box>
    </Drawer>
  );
};

export default withRouter(Menu);
