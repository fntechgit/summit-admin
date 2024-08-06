/**
 * Copyright 2024 OpenStack Foundation
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
import Select from "react-select";

export default class SelectionStatusFilter extends React.Component {
  constructor(props) {
    super(props);

    this.handleFilterChange = this.handleFilterChange.bind(this);
  }

  handleFilterChange(value) {
    if (!value) {
      this.props.onChange(null);
      return;
    }
    const theValue = this.props.isMulti
      ? value.map((v) => v.value)
      : value.value;
    this.props.onChange(theValue);
  }

  render() {
    const { value, onChange, ...rest } = this.props;

    const options = [
      { value: "selected", label: "selected" },
      { value: "accepted", label: "accepted" },
      { value: "rejected", label: "rejected" },
      { value: "alternate", label: "alternate" },
      { value: "lightning-accepted", label: "lightning-accepted" },
      { value: "lightning-alternate", label: "lightning-alternate" }
    ];

    let theValue = null;

    if (value) {
      theValue = this.props.isMulti
        ? options.filter((op) => value.includes(op.value))
        : options.find((op) => op.value === value);
    }

    return (
      <div className="selection-status-filter">
        <label>Filter by Selection Status</label>
        <Select
          value={theValue}
          id="selection-status-filter"
          options={options}
          onChange={this.handleFilterChange}
          isClearable
          {...rest}
        />
      </div>
    );
  }
}
