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
import EventCategoryForm from "../../components/forms/event-category-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getEventCategory,
  resetEventCategoryForm,
  saveEventCategory,
  uploadImage,
  removeImage,
  linkSubCategory,
  unlinkSubCategory,
  updateSubCategoryOrder
} from "../../actions/event-category-actions";
import "../../styles/edit-event-category-page.less";
import AddNewButton from "../../components/buttons/add-new-button";

function EditEventCategoryPage({
  currentSummit,
  entity,
  errors,
  history,
  ...rest
}) {
  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  return (
    <div className="container">
      <h3>
        {title} {T.translate("edit_event_category.event_category")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <EventCategoryForm
          history={history}
          currentSummit={currentSummit}
          entity={entity}
          errors={errors}
          onSubmit={rest.saveEventCategory}
          onUploadImage={rest.uploadImage}
          onRemoveImage={rest.removeImage}
          onLinkSubCategory={rest.linkSubCategory}
          onUnlinkSubCategory={rest.unlinkSubCategory}
          onUpdateSubCategoryOrder={rest.updateSubCategoryOrder}
        />
      )}
    </div>
  );
}

const mapStateToProps = ({
  currentSummitState,
  currentEventCategoryState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventCategoryState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEventCategory,
  resetEventCategoryForm,
  saveEventCategory,
  uploadImage,
  removeImage,
  linkSubCategory,
  unlinkSubCategory,
  updateSubCategoryOrder
})(EditEventCategoryPage);
