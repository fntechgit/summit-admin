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

import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumbs } from "react-breadcrumbs";
import {
  initLogOut,
  getIdToken
} from "openstack-uicore-foundation/lib/security/methods";
import IdTokenVerifier from "idtoken-verifier";
import AuthButton from "../auth-button";
import Menu from "../menu";
import { getGlobalItems, getSummitItems } from "../menu/menu-definition";
import { addMenuLinks } from "../menu/menu-path";

const DRAWER_WIDTH = 260;
const COMPACT_BAR_HEIGHT = 48;
const REGULAR_BAR_HEIGHT = 56;
const SUB_BAR_HEIGHT = 36;
const SHORT_VIEWPORT_MAX_HEIGHT = 500;

// puts the page's menu folders after the Summit crumb (Home on global pages)
export const insertMenuFolders = (menuMap) => (crumbs) => {
  // deepest crumb that is a menu link = the most specific match
  let matchIndex = -1;
  for (let i = crumbs.length - 1; i >= 0; i--) {
    if (menuMap.has(crumbs[i].pathname)) {
      matchIndex = i;
      break;
    }
  }
  if (matchIndex === -1) return crumbs;

  const { folders, anchor } = menuMap.get(crumbs[matchIndex].pathname);
  const anchorIndex = crumbs.findIndex((crumb) => crumb.pathname === anchor);
  if (anchorIndex === -1 || matchIndex <= anchorIndex) return crumbs;

  // skip a folder that repeats the matched crumb (e.g. "Activities / Activities")
  const folderCrumbs = folders
    .map((name) => ({ name, title: T.translate(`menu.${name}`) }))
    .filter(({ title }) => title !== crumbs[matchIndex].title)
    .map(({ name, title }) => ({
      id: `menu-folder-${name}`,
      title: <span className="crumb-folder">{title}</span>,
      pathname: anchor
    }));

  // route crumbs between the anchor and the match are replaced by the folders
  return [
    ...crumbs.slice(0, anchorIndex + 1),
    ...folderCrumbs,
    ...crumbs.slice(matchIndex)
  ];
};

/**
 * Application top bar with an optional slide-out navigation drawer.
 *
 * Summit-admin's nav bar: the sign-out button,
 * breadcrumbs and app menu are rendered here directly. It holds the drawer's
 * open state itself and hands `closeDrawer` to the menu so a navigation item
 * can dismiss the drawer after it acts.
 */
const TopNav = ({ isLoggedUser, currentSummit, member }) => {
  const [open, setOpen] = useState(false);

  // The current summit's name, shown next to the title behind a divider.
  const contextLabel = currentSummit?.id > 0 ? currentSummit.name : null;

  // built once per summit; global links stay findable while a summit is selected
  const summitId = currentSummit?.id;
  const setCrumbs = useMemo(() => {
    const menuMap = addMenuLinks(getGlobalItems(), "/app", new Map());
    if (summitId) {
      addMenuLinks(
        getSummitItems(summitId),
        `/app/summits/${summitId}`,
        menuMap
      );
    }
    return insertMenuFolders(menuMap);
  }, [summitId]);

  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggleDrawer = useCallback(() => setOpen((prev) => !prev), []);

  // Signed out, the bar carries nothing but the title, which then reads as a
  // banner rather than as the left-hand item of a bar.
  const titleCentered = !isLoggedUser;

  const idToken = getIdToken();

  // get user pic from idtoken claims (IDP)
  let picture = "";

  if (idToken) {
    const verifier = new IdTokenVerifier({
      issuer: window.IDP_BASE_URL,
      audience: window.OAUTH2_CLIENT_ID
    });
    const jwt = verifier.decode(idToken);
    picture = jwt.payload.picture;
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid #b3b3b3"
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: COMPACT_BAR_HEIGHT, sm: REGULAR_BAR_HEIGHT },
            // Short viewports (landscape phones) get the compact bar; keyed off
            // height so desktop, which is also landscape, keeps the sm value.
            [`@media (max-height:${SHORT_VIEWPORT_MAX_HEIGHT}px)`]: {
              minHeight: COMPACT_BAR_HEIGHT
            }
          }}
        >
          {isLoggedUser && (
            <IconButton
              edge="start"
              aria-label={T.translate("menu.toggle_navigation")}
              aria-expanded={open}
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon sx={{ fontSize: "1.75rem", color: "text.secondary" }} />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, ...(titleCentered && { textAlign: "center" }) }}
          >
            {T.translate("landing.os_summit_admin")}
            {contextLabel && (
              <Box
                component="span"
                sx={{
                  ml: 1.5,
                  pl: 1.5,
                  borderLeft: 1,
                  borderColor: "divider",
                  color: "text.secondary",
                  fontWeight: 400
                }}
              >
                {contextLabel}
              </Box>
            )}
          </Typography>
          {isLoggedUser && (
            <AuthButton
              isLoggedUser
              picture={picture}
              initLogOut={initLogOut}
            />
          )}
        </Toolbar>
      </AppBar>
      {/* Outside the AppBar so it scrolls away instead of staying pinned. */}
      {isLoggedUser && (
        <Toolbar
          variant="dense"
          sx={{
            minHeight: SUB_BAR_HEIGHT,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            overflowX: "auto",
            // menu folder crumbs are labels, not links
            "& .breadcrumbs__crumb:has(.crumb-folder)": {
              pointerEvents: "none",
              color: "inherit"
            }
          }}
        >
          <Breadcrumbs
            className="breadcrumbs-wrapper"
            separator="/"
            setCrumbs={setCrumbs}
          />
        </Toolbar>
      )}
      {isLoggedUser && (
        <Drawer
          anchor="left"
          open={open}
          onClose={closeDrawer}
          slotProps={{
            root: {
              keepMounted: true,
              disableScrollLock: true
            },
            paper: {
              sx: { width: DRAWER_WIDTH }
            }
          }}
        >
          <Box
            role="presentation"
            sx={{ width: DRAWER_WIDTH, overflowY: "auto", pb: 3 }}
          >
            <Menu
              currentSummit={currentSummit}
              member={member}
              onNavigate={closeDrawer}
            />
          </Box>
        </Drawer>
      )}
    </>
  );
};

TopNav.propTypes = {
  /** When false, the sign-out button, breadcrumbs and drawer are suppressed. */
  isLoggedUser: PropTypes.bool,
  /** Its name labels the bar; also passed through to the drawer's menu. */
  // eslint-disable-next-line react/forbid-prop-types
  currentSummit: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  member: PropTypes.object
};

TopNav.defaultProps = {
  isLoggedUser: true,
  currentSummit: null,
  member: null
};

export default TopNav;
