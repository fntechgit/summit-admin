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

class ScheduleAdminSearchFreeTextUnScheduleEvents extends React.Component {
  constructor(props) {
    super(props);
    this.onSearchClick = this.onSearchClick.bind(this);
    this.onClearClick = this.onClearClick.bind(this);
    this.onKeyPressed = this.onKeyPressed.bind(this);
  }

  onSearchClick() {
    this.doFiltering(this.searchTxt.value);
  }

  onClearClick() {
    this.searchTxt.value = "";
    this.doFiltering(this.searchTxt.value);
  }

  doFiltering(term) {
    this.props.onFilterTextChange(term.trim());
  }

  onKeyPressed(event) {
    var code = event.keyCode || event.which;
    if (code === 13) {
      this.doFiltering(this.searchTxt.value);
    }
  }

  render() {
    return (
      <div className="row search-container">
        <div className="col-md-12">
          <div className="input-group">
            <input
              data-rule-required="true"
              data-rule-minlength="3"
              type="text"
              defaultValue={this.props.currentValue}
              className="form-control input-global-search"
              ref={(input) => {
                this.searchTxt = input;
              }}
              placeholder={T.translate(
                "schedule.placeholders.search_unpublished"
              )}
              onKeyPress={this.onKeyPressed}
            />
            <span className="input-group-btn" style={{ width: 5 + "%" }}>
              <button
                onClick={this.onSearchClick}
                className="btn btn-default btn-global-search unpublished_filter_button"
                title={T.translate("general.search")}
              >
                <i className="fa fa-search" />
              </button>
              <button
                onClick={this.onClearClick}
                className="btn btn-default btn-global-search-clear"
                title={T.translate("general.clear")}
              >
                <i className="fa fa-times" />
              </button>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default ScheduleAdminSearchFreeTextUnScheduleEvents;
