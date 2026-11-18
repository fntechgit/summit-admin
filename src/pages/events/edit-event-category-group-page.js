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
 * */

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Box from "@mui/material/Box";
import AddNewButton from "openstack-uicore-foundation/lib/components/mui/add-new-button";
import EventCategoryGroupForm from "../../components/forms/event-category-group-form";
import {
  getEventCategoryGroup,
  resetEventCategoryGroupForm,
  saveEventCategoryGroup,
  addCategoryToGroup,
  removeCategoryFromGroup,
  addAllowedGroupToGroup,
  removeAllowedGroupFromGroup,
  getEventCategoryGroupMeta
} from "../../actions/event-category-actions";

const EditEventCategoryGroupPage = ({
  currentSummit,
  entity,
  allClasses,
  errors,
  match,
  history,
  getEventCategoryGroup,
  resetEventCategoryGroupForm,
  saveEventCategoryGroup,
  addCategoryToGroup,
  removeCategoryFromGroup,
  addAllowedGroupToGroup,
  removeAllowedGroupFromGroup,
  getEventCategoryGroupMeta
}) => {
  const groupId = match.params.group_id;

  useEffect(() => {
    if (allClasses.length === 0) {
      getEventCategoryGroupMeta();
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      resetEventCategoryGroupForm();
    } else {
      getEventCategoryGroup(groupId);
    }
  }, [groupId]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  const handleAddNew = () =>
    history.push(`/app/summits/${currentSummit.id}/event-category-groups/new`);

  if (!allClasses.length) return <div />;

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>
          {title}{" "}
          {T.translate("edit_event_category_group.event_category_group")}
        </h3>
        {entity.id > 0 && <AddNewButton onClick={handleAddNew} />}
      </Box>
      <hr />
      {currentSummit && (
        <EventCategoryGroupForm
          currentSummit={currentSummit}
          allClasses={allClasses}
          entity={entity}
          errors={errors}
          onTrackLink={addCategoryToGroup}
          onTrackUnLink={removeCategoryFromGroup}
          onAllowedGroupLink={addAllowedGroupToGroup}
          onAllowedGroupUnLink={removeAllowedGroupFromGroup}
          onSubmit={saveEventCategoryGroup}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventCategoryGroupState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventCategoryGroupState
});

export default connect(mapStateToProps, {
  getEventCategoryGroup,
  resetEventCategoryGroupForm,
  saveEventCategoryGroup,
  addCategoryToGroup,
  removeCategoryFromGroup,
  addAllowedGroupToGroup,
  removeAllowedGroupFromGroup,
  getEventCategoryGroupMeta
})(EditEventCategoryGroupPage);
