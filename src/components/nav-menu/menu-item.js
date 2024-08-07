/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import React from "react";
import T from "i18n-react/dist/i18n-react";
import { Exclusive } from "openstack-uicore-foundation/lib/components";

export default class MenuItem extends React.Component {
  render() {
    let { name, iconClass, onClick } = this.props;

    const itemHtml = [
      <a
        id={name + "-menu"}
        key={name + "-menu"}
        className="menu-item"
        onClick={onClick}
      >
        <i className={iconClass + " fa"} />
        {T.translate("menu." + name)}
      </a>
    ];

    if (this.props.hasOwnProperty("exclusive")) {
      return <Exclusive name={this.props.exclusive}>{itemHtml}</Exclusive>;
    } else {
      return itemHtml;
    }
  }
}
