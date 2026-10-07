/**
 * Copyright 2018 OpenStack Foundation
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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import BadgeTypeForm from "../../components/forms/badge-type-form";
import {
  getAccessLevels,
  getBadgeFeatures,
  getBadgeType,
  getViewTypes,
  resetBadgeTypeForm,
  saveBadgeType,
  addAccessLevelToBadgeType,
  removeAccessLevelFromBadgeType,
  addFeatureToBadgeType,
  removeFeatureFromBadgeType,
  addViewTypeToBadgeType,
  removeViewTypeFromBadgeType
} from "../../actions/badge-actions";
import AddNewButtonMUI from "../../components/buttons/add-new-button-mui";
import { DEFAULT_CURRENT_PAGE, HUNDRED_PER_PAGE } from "../../utils/constants";

const EditBadgeTypePage = ({
  currentSummit,
  entity,
  errors,
  match,
  getBadgeFeatures,
  getAccessLevels,
  getViewTypes,
  resetBadgeTypeForm,
  getBadgeType,
  addAccessLevelToBadgeType,
  removeAccessLevelFromBadgeType,
  addFeatureToBadgeType,
  removeFeatureFromBadgeType,
  addViewTypeToBadgeType,
  removeViewTypeFromBadgeType,
  saveBadgeType
}) => {
  const badgeTypeId = match.params.badge_type_id;
  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  useEffect(() => {
    if (!currentSummit.badge_features) getBadgeFeatures();
    if (!currentSummit.badge_access_level_types) getAccessLevels();
    if (!currentSummit.badge_view_types)
      getViewTypes(null, DEFAULT_CURRENT_PAGE, HUNDRED_PER_PAGE);
  }, []);

  useEffect(() => {
    if (!badgeTypeId) {
      resetBadgeTypeForm();
    } else {
      getBadgeType(badgeTypeId);
    }
  }, [badgeTypeId]);

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_badge_type.badge_type")}
        <AddNewButtonMUI entity={entity} />
      </h3>
      <hr />
      {currentSummit &&
        currentSummit.badge_features &&
        currentSummit.badge_access_level_types && (
          <BadgeTypeForm
            entity={entity}
            currentSummit={currentSummit}
            errors={errors}
            onAccessLevelLink={addAccessLevelToBadgeType}
            onAccessLevelUnLink={removeAccessLevelFromBadgeType}
            onFeatureLink={addFeatureToBadgeType}
            onFeatureUnLink={removeFeatureFromBadgeType}
            onViewTypeLink={addViewTypeToBadgeType}
            onViewTypeUnLink={removeViewTypeFromBadgeType}
            onSubmit={saveBadgeType}
          />
        )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, currentBadgeTypeState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentBadgeTypeState
});

export default connect(mapStateToProps, {
  getAccessLevels,
  getViewTypes,
  getBadgeFeatures,
  getBadgeType,
  resetBadgeTypeForm,
  saveBadgeType,
  addAccessLevelToBadgeType,
  removeAccessLevelFromBadgeType,
  addFeatureToBadgeType,
  removeFeatureFromBadgeType,
  addViewTypeToBadgeType,
  removeViewTypeFromBadgeType
})(EditBadgeTypePage);
