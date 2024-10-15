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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import BadgeScanForm from "../../components/forms/badge-scan-form";
import {
  getBadgeScan,
  saveBadgeScan,
  resetBadgeScanForm
} from "../../actions/sponsor-actions";
import AddNewButton from "../../components/buttons/add-new-button";

const EditBadgeScanPage = ({
  currentSummit,
  entity,
  errors,
  match,
  history,
  ...props
}) => {
  const badgeScanId = match.params.badge_scan_id;
  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id
    ? entity.attendee_full_name
    : T.translate("general.new");

  useEffect(() => {
    if (!badgeScanId) {
      props.resetBadgeScanForm();
    } else {
      props.getBadgeScan(badgeScanId);
    }
  }, [badgeScanId]);

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_badge_scan.badge_scan")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <BadgeScanForm
          entity={entity}
          currentSummit={currentSummit}
          errors={errors}
          history={history}
          onSubmit={props.saveBadgeScan}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, currentBadgeScanState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentBadgeScanState
});

export default connect(mapStateToProps, {
  resetBadgeScanForm,
  getBadgeScan,
  saveBadgeScan
})(EditBadgeScanPage);
