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

import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";

const DRAWER_WIDTH = 260;
const CLOSE_DELAY_MS = 200;
const HOVER_CLICK_GRACE_MS = 300;
const COMPACT_BAR_HEIGHT = 48;
const REGULAR_BAR_HEIGHT = 56;
const SUB_BAR_HEIGHT = 36;
const SHORT_VIEWPORT_MAX_HEIGHT = 500;

/**
 * Application top bar with an optional slide-out navigation drawer.
 *
 * Self-contained and app-agnostic: it holds the drawer's open state itself and
 * takes every string, action and piece of navigation content as a prop, so it
 * carries no dependency on any particular app's store, router or i18n. The
 * caller supplies the drawer's contents through `renderDrawer`, which receives
 * `closeDrawer` so a navigation item can dismiss the drawer after it acts.
 *
 * On devices that support hovering, the burger opens the drawer on hover and
 * closes it a moment after the pointer leaves; the delay keeps the drawer open
 * while the pointer crosses the gap between the button and the panel. Devices
 * without hover get click-to-toggle only.
 */
const TopNav = ({
  title,
  contextLabel,
  actions,
  subBar,
  renderDrawer,
  isLoggedUser,
  menuButtonLabel,
  sx
}) => {
  const [open, setOpen] = useState(false);
  const [openedByHover, setOpenedByHover] = useState(false);
  const closeTimeout = useRef(null);
  const lastHoverOpen = useRef(0);

  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const cancelClose = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }, []);

  const closeDrawer = useCallback(() => {
    cancelClose();
    setOpen(false);
    setOpenedByHover(false);
  }, [cancelClose]);

  const toggleDrawer = useCallback(() => {
    cancelClose();
    // A hover-open is followed by the click the same gesture produces on a fine
    // pointer; without this window that click would toggle the drawer shut
    // again the instant it opened.
    if (Date.now() - lastHoverOpen.current < HOVER_CLICK_GRACE_MS) return;
    setOpen((prev) => !prev);
    setOpenedByHover(false);
  }, [cancelClose]);

  const openByHover = useCallback(() => {
    cancelClose();
    lastHoverOpen.current = Date.now();
    setOpen(true);
    setOpenedByHover(true);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimeout.current = setTimeout(() => {
      setOpen(false);
      setOpenedByHover(false);
    }, CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  const hoverHandlers = canHover
    ? { onMouseEnter: openByHover, onMouseLeave: scheduleClose }
    : {};
  const drawerHoverHandlers = canHover
    ? { onMouseEnter: cancelClose, onMouseLeave: scheduleClose }
    : {};

  // With nothing on either side of it, the title reads as a banner rather than
  // as the left-hand item of a bar.
  // Signed out, the bar carries nothing but the title, so the three
  // authenticated regions are suppressed in one place.
  const showActions = isLoggedUser ? actions : null;
  const showSubBar = isLoggedUser ? subBar : null;
  const showDrawer = isLoggedUser ? renderDrawer : null;

  const titleCentered = !showDrawer && !showActions;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
          ...sx
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
          {showDrawer && (
            <IconButton
              edge="start"
              aria-label={menuButtonLabel}
              aria-expanded={open}
              onClick={toggleDrawer}
              {...hoverHandlers}
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
            {title}
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
          {showActions}
        </Toolbar>
      </AppBar>
      {/* Outside the AppBar so it scrolls away instead of staying pinned. */}
      {showSubBar && (
        <Toolbar
          variant="dense"
          sx={{
            minHeight: SUB_BAR_HEIGHT,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            overflowX: "auto"
          }}
        >
          {showSubBar}
        </Toolbar>
      )}
      {showDrawer && (
        <Drawer
          anchor="left"
          open={open}
          onClose={closeDrawer}
          slotProps={{
            root: {
              keepMounted: true,
              // A drawer the pointer merely hovered over should not steal focus
              // from whatever the user was doing.
              disableAutoFocus: openedByHover,
              disableEnforceFocus: openedByHover,
              disableScrollLock: true
            },
            paper: {
              sx: { width: DRAWER_WIDTH },
              ...drawerHoverHandlers
            }
          }}
        >
          <Box
            role="presentation"
            sx={{ width: DRAWER_WIDTH, overflowY: "auto", pb: 3 }}
          >
            {showDrawer({ closeDrawer })}
          </Box>
        </Drawer>
      )}
    </>
  );
};

TopNav.propTypes = {
  /** Brand or application name shown at the left of the bar. */
  title: PropTypes.node.isRequired,
  /** Optional secondary label shown next to the title, behind a divider. */
  contextLabel: PropTypes.node,
  /** Right-aligned bar content, e.g. an account or sign-out button. */
  actions: PropTypes.node,
  /** Content for a slim secondary bar below the app bar, e.g. breadcrumbs. */
  subBar: PropTypes.node,
  /**
   * `({ closeDrawer }) => node` — the navigation drawer's contents. Omit it and
   * neither the burger button nor the drawer is rendered.
   */
  renderDrawer: PropTypes.func,
  /** When false, the actions, sub bar and drawer are all suppressed. */
  isLoggedUser: PropTypes.bool,
  /** Accessible name for the burger button; supply it with `renderDrawer`. */
  menuButtonLabel: PropTypes.string,
  /** Style overrides merged into the app bar. */
  // eslint-disable-next-line react/forbid-prop-types
  sx: PropTypes.object
};

TopNav.defaultProps = {
  contextLabel: null,
  actions: null,
  subBar: null,
  renderDrawer: null,
  isLoggedUser: true,
  menuButtonLabel: null,
  sx: null
};

export default TopNav;
