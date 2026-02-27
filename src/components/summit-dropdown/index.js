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
import { SummitInput } from "openstack-uicore-foundation/lib/components";
import styles from "./index.module.less";

export default class SummitDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      summitValue: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleChange(ev) {
    this.setState({ summitValue: ev.target.value });
  }

  handleClick(ev) {
   ev.preventDefault();
    if(!this.state.summitValue) return;
    this.props.onClick(this.state.summitValue.id);
    this.setState({summitValue : null});
  }

  render() {
    const { actionLabel, actionClass } = this.props;
    const bigClass = this.props.hasOwnProperty("big") ? "big" : "";

    return (
      <div className={`${styles.summitDropdown} btn-group ${bigClass}`}>
        <SummitInput
          id="summit-select"
          value={this.state.summitValue}
          onChange={this.handleChange}
          placeholder={T.translate("general.select_summit")}
          className={`btn-group ${styles.summitSelect} text-left`}
          isClearable={false}
          cacheOptions  
        />
        <button
          type="button"
          className={`${styles.btn} btn btn-default ${actionClass}`}
          onClick={this.handleClick}
        >
          {actionLabel}
        </button>
      </div>
    );
  }
}
