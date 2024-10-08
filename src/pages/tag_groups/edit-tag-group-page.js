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
import { ActionDropdown } from "openstack-uicore-foundation/lib/components";
import TagGroupForm from "../../components/forms/tag-group-form";
import {
  getTagGroup,
  addTagToGroup,
  removeTagFromGroup,
  resetTagGroupForm,
  saveTagGroup,
  copyTagToAllCategories,
  copyAllTagsToCategory,
  createTag
} from "../../actions/tag-actions";
import AddNewButton from "../../components/buttons/add-new-button";

// import '../../styles/edit-tag-group-page.less';

class EditTagGroupPage extends React.Component {
  constructor(props) {
    const tagGroupId = props.match.params.tag_group_id;

    super(props);

    if (!tagGroupId) {
      props.resetTagGroupForm();
    } else {
      props.getTagGroup(tagGroupId);
    }

    this.handleCopyTagsToCategory = this.handleCopyTagsToCategory.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.tag_group_id;
    const newId = this.props.match.params.tag_group_id;

    if (newId !== oldId) {
      if (!newId) {
        this.props.resetTagGroupForm();
      } else {
        this.props.getTagGroup(newId);
      }
    }
  }

  handleCopyTagsToCategory(categoryId) {
    const { entity } = this.props;
    this.props.copyAllTagsToCategory(entity.id, categoryId);
  }

  render() {
    const { currentSummit, entity, errors, match } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.label : T.translate("general.new");
    const categoryOptions = currentSummit.tracks.map((c) => ({
      value: c.id,
      label: c.name
    }));

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <div className="row">
          <div className="col-md-8">
            <h3>
              {title} {T.translate("edit_tag_group.tag_group")}
              <AddNewButton entity={entity} />
            </h3>
          </div>
          {entity.id > 0 && entity.allowed_tags.length > 0 && (
            <div className="col-md-4 text-right" style={{ marginTop: "20px" }}>
              <ActionDropdown
                options={categoryOptions}
                actionLabel={T.translate("edit_tag_group.copy_tags")}
                placeholder={T.translate("edit_tag_group.select_category")}
                onClick={this.handleCopyTagsToCategory}
              />
            </div>
          )}
        </div>
        <hr />
        {currentSummit && (
          <TagGroupForm
            history={this.props.history}
            currentSummit={currentSummit}
            entity={entity}
            errors={errors}
            onAddTagToGroup={this.props.addTagToGroup}
            onRemoveTagFromGroup={this.props.removeTagFromGroup}
            onCopyTag={this.props.copyTagToAllCategories}
            onCreateTag={this.props.createTag}
            onSubmit={this.props.saveTagGroup}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, currentTagGroupState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentTagGroupState
});

export default connect(mapStateToProps, {
  getTagGroup,
  resetTagGroupForm,
  saveTagGroup,
  addTagToGroup,
  removeTagFromGroup,
  copyTagToAllCategories,
  copyAllTagsToCategory,
  createTag
})(EditTagGroupPage);
