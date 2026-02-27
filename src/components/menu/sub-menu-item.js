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
import styles from "./menu.module.less";

function SubMenuItem({
  name,
  iconClass,
  isOpen,
  onClick,
  onItemClick,
  childs,
  memberObj
}) {
  const _childs = childs.filter(
    (item) =>
      !item.hasOwnProperty("accessRoute") ||
      memberObj.hasAccess(item.accessRoute)
  );

  return (
    <div>
      <a id={`${name}-menu`} className={styles.menuItem} onClick={onClick}>
        <i className={`${iconClass} fa`} />
        <span>{T.translate(`menu.${name}`)}</span>
      </a>
      {isOpen && (
        <div className={styles.submenu}>
          {_childs.map((ch) => (
            <MenuItem
              key={ch.name}
              {...ch}
              iconClass="fa-chevron-right"
              onClick={(e) => onItemClick(e, ch.linkUrl)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SubMenuItem;
