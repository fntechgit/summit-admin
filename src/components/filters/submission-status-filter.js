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
import T from "i18n-react/dist/i18n-react";

export default class SubmissionStatusFilter extends React.Component {
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
      {
        value: "accepted",
        label: T.translate("filters.submission_status_filter.options.accepted")
      },
      {
        value: "received",
        label: T.translate("filters.submission_status_filter.options.received")
      },
      {
        value: "nonreceived",
        label: T.translate(
          "filters.submission_status_filter.options.non_received"
        )
      }
    ];

    let theValue = null;

    if (value) {
      theValue = this.props.isMulti
        ? options.filter((op) => value.includes(op.value))
        : options.find((op) => op.value === value);
    }

    return (
      <div className="submission-status-filter">
        <label>{T.translate("filters.submission_status_filter.title")}</label>
        <Select
          value={theValue}
          id="submission-status-filter"
          options={options}
          onChange={this.handleFilterChange}
          isClearable
          {...rest}
        />
      </div>
    );
  }
}
