/**
 * Copyright 2020 OpenStack Foundation
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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import BadgeSettingsForm from "../../components/forms/badge-settings-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getBadgeSettings,
  removeBadgeFeatureImage,
  saveBadgeSettings
} from "../../actions/badge-actions";
import { deleteSetting } from "../../actions/marketing-actions";

class BadgeSettingsPage extends React.Component {
  constructor(props) {
    super(props);

    props.getBadgeSettings();
  }

  render() {
    const { currentSummit, badge_settings, errors } = this.props;

    return (
      <div className="container">
        <h3>{T.translate("badge_settings.badge_settings")}</h3>
        <hr />
        {currentSummit && (
          <BadgeSettingsForm
            entity={badge_settings}
            currentSummit={currentSummit}
            errors={errors}
            onSubmit={this.props.saveBadgeSettings}
            onDeleteImage={this.props.deleteSetting}
            onDeleteBadgeTypeImage={this.props.removeBadgeFeatureImage}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentBadgeSettingState,
  baseState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  loading: baseState.loading,
  ...currentBadgeSettingState
});

export default connect(mapStateToProps, {
  getSummitById,
  deleteSetting,
  getBadgeSettings,
  saveBadgeSettings,
  removeBadgeFeatureImage
})(BadgeSettingsPage);
