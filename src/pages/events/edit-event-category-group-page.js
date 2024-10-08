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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
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
import AddNewButton from "../../components/buttons/add-new-button";

// import '../../styles/edit-summit-attendee-page.less';

class EditEventCategoryGroupPage extends React.Component {
  componentDidMount() {
    const { allClasses } = this.props;
    const groupId = this.props.match.params.group_id;

    if (!groupId) {
      this.props.resetEventCategoryGroupForm();
    } else {
      this.props.getEventCategoryGroup(groupId);
    }

    if (allClasses.length === 0) {
      this.props.getEventCategoryGroupMeta();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.group_id;
    const newId = this.props.match.params.group_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetEventCategoryGroupForm();
      } else {
        this.props.getEventCategoryGroup(newId);
      }
    }
  }

  render() {
    const { currentSummit, entity, allClasses, errors, match } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.name : T.translate("general.new");

    if (!allClasses.length) return <div />;

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title}{" "}
          {T.translate("edit_event_category_group.event_category_group")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <EventCategoryGroupForm
            currentSummit={currentSummit}
            allClasses={allClasses}
            entity={entity}
            errors={errors}
            onTrackLink={this.props.addCategoryToGroup}
            onTrackUnLink={this.props.removeCategoryFromGroup}
            onAllowedGroupLink={this.props.addAllowedGroupToGroup}
            onAllowedGroupUnLink={this.props.removeAllowedGroupFromGroup}
            onSubmit={this.props.saveEventCategoryGroup}
          />
        )}
      </div>
    );
  }
}

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
