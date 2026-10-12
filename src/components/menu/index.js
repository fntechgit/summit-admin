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

import React, { useEffect, useRef, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { withRouter } from "react-router-dom";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SubMenuItem from "./sub-menu-item";
import MenuItem from "./menu-item";
import ExpandableItem from "./expandable-item";
import Member from "../../models/member";
import { getGlobalItems, getSummitItems } from "./menu-definition";

const DRAWER_WIDTH = 260;
const RAIL_WIDTH = 40;
// Rail from this width up, burger button below. Matches landing.css.
const RAIL_MIN_WIDTH = 768;
// So a quick click on the rail does not land on a menu item sliding in.
const HOVER_OPEN_DELAY_MS = 200;
// Above page content, below Bootstrap 3 modals (1040+) and the Drawer (1200).
const MENU_TRIGGER_Z_INDEX = 1030;

// Hover only opens and closes the menu for a real mouse or trackpad. Touch and
// pen pointers fire enter/leave on every tap, so they use taps alone.
const isMouse = (ev) => ev.pointerType === "mouse";

const Menu = ({ currentSummit, member, history }) => {
  // byHover only changes together with open: the Drawer reads it when it opens.
  const [menu, setMenu] = useState({ open: false, byHover: false });
  const hoverTimer = useRef(null);
  const memberObj = new Member(member);
  const globalItems = getGlobalItems();
  const summitItems = currentSummit ? getSummitItems(currentSummit.id) : [];

  const cancelHoverOpen = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  useEffect(() => cancelHoverOpen, []);

  const openMenu = (byHover) => {
    cancelHoverOpen();
    setMenu({ open: true, byHover });
  };

  const onTriggerClick = () => openMenu(false);

  const closeMenu = () => {
    cancelHoverOpen();
    setMenu((prev) => ({ ...prev, open: false }));
  };

  // Browsers fire enter, and sometimes a move with no movement, when the rail
  // ends up under a still cursor (after the drawer or page loader goes away, or
  // a scroll). Only real mouse movement without a button held starts the timer.
  const onRailPointerMove = (ev) => {
    const stillCursor = ev.movementX === 0 && ev.movementY === 0;
    if (!isMouse(ev) || ev.buttons || stillCursor || hoverTimer.current) return;
    hoverTimer.current = setTimeout(() => openMenu(true), HOVER_OPEN_DELAY_MS);
  };

  const onDrawerPointerLeave = (ev) => {
    if (isMouse(ev)) closeMenu();
  };

  const onMenuItemClick = (ev, url) => {
    ev.preventDefault();
    closeMenu();
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
      <IconButton
        aria-label={T.translate("menu.open_menu")}
        onClick={onTriggerClick}
        sx={(theme) => ({
          position: "fixed",
          top: 5,
          left: 5,
          zIndex: MENU_TRIGGER_Z_INDEX,
          [theme.breakpoints.up(RAIL_MIN_WIDTH)]: { display: "none" }
        })}
      >
        <MenuIcon sx={{ fontSize: "2.5rem", color: "text.secondary" }} />
      </IconButton>
      <ButtonBase
        aria-label={T.translate("menu.open_menu")}
        disableRipple
        onClick={onTriggerClick}
        onPointerMove={onRailPointerMove}
        onPointerLeave={cancelHoverOpen}
        sx={(theme) => ({
          display: "none",
          [theme.breakpoints.up(RAIL_MIN_WIDTH)]: { display: "flex" },
          position: "fixed",
          top: 0,
          left: 0,
          width: RAIL_WIDTH,
          height: "100vh",
          zIndex: MENU_TRIGGER_Z_INDEX,
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          "&.Mui-focusVisible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: "-2px"
          }
        })}
      >
        <ChevronRightIcon sx={{ fontSize: "2em", color: "text.secondary" }} />
      </ButtonBase>
      <Drawer
        open={menu.open}
        onClose={closeMenu}
        elevation={0}
        // A hover open leaves keyboard focus and page scroll alone, so closing
        // it never moves the page.
        ModalProps={{
          keepMounted: true,
          disableAutoFocus: menu.byHover,
          disableRestoreFocus: menu.byHover,
          disableScrollLock: menu.byHover
        }}
        slotProps={{
          backdrop: { invisible: true },
          paper: {
            onPointerLeave: onDrawerPointerLeave,
            sx: {
              width: DRAWER_WIDTH,
              pb: 2.5,
              borderRight: 1,
              borderColor: "divider"
            }
          }
        }}
      >
        <Box component="nav" aria-label={T.translate("menu.main_menu")}>
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
    </>
  );
};

export default withRouter(Menu);
