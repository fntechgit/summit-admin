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

import React, { useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { withRouter } from "react-router-dom";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SubMenuItem from "./sub-menu-item";
import MenuItem from "./menu-item";
import ExpandableItem from "./expandable-item";
import Member from "../../models/member";
import { getGlobalItems, getSummitItems } from "./menu-definition";

import styles from "./menu.module.less";

const Menu = ({ currentSummit, member, history }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const memberObj = new Member(member);
  const globalItems = getGlobalItems();
  const summitItems = getSummitItems(currentSummit.id);

  const onMenuItemClick = (ev, url) => {
    ev.preventDefault();
    setMenuOpen(false);
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
    <Box
      className={`${styles.wrapper} ${styles[menuOpen ? "opened" : "closed"]}`}
    >
      <Box className={styles.burgerButton}>
        <IconButton onClick={() => setMenuOpen(true)}>
          <MenuIcon sx={{ fontSize: "2.5rem", color: "#555555" }} />
        </IconButton>
      </Box>
      <Box
        className={styles.menuWrapper}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <Box className={styles.expandButton}>
          <ChevronRightIcon sx={{ fontSize: "2em", color: "#555555" }} />
        </Box>

        <Box className={styles.menuItemsWrapper}>
          <ExpandableItem label={T.translate("menu.general")} isHeader>
            {globalItems.map(drawMenuItem)}
          </ExpandableItem>

          {currentSummit?.id && (
            <>
              <Divider sx={{ my: 2 }} />
              <ExpandableItem label={currentSummit.name} isHeader>
                {summitItems.map(drawMenuItem)}
              </ExpandableItem>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default withRouter(Menu);
