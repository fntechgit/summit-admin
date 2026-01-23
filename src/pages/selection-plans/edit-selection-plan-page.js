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
import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import SelectionPlanForm from "../../components/forms/selection-plan-form";
import {
  addAllowedMemberToSelectionPlan,
  addEventTypeSelectionPlan,
  addTrackGroupToSelectionPlan,
  assignExtraQuestion2SelectionPlan,
  assignProgressFlag2SelectionPlan,
  deleteEventTypeSelectionPlan,
  deleteRatingType,
  deleteSelectionPlanExtraQuestion,
  getAllowedMembers,
  importAllowedMembersCSV,
  removeAllowedMemberFromSelectionPlan,
  removeTrackGroupFromSelectionPlan,
  saveSelectionPlan,
  saveSelectionPlanSettings,
  unassignProgressFlagFromSelectionPlan,
  updateProgressFlagOrder,
  updateRatingTypeOrder,
  updateSelectionPlanExtraQuestionOrder
} from "../../actions/selection-plan-actions";
import AddNewButton from "../../components/buttons/add-new-button";

const EditSelectionPlanPage = ({
  currentSummit,
  entity,
  allowedMembers,
  errors,
  history,
  extraQuestionsOrder,
  extraQuestionsOrderDir,
  updateSelectionPlanExtraQuestionOrder,
  unassignProgressFlagFromSelectionPlan,
  deleteSelectionPlanExtraQuestion,
  updateRatingTypeOrder,
  deleteRatingType,
  updateProgressFlagOrder,
  addTrackGroupToSelectionPlan,
  removeTrackGroupFromSelectionPlan,
  saveSelectionPlan,
  saveSelectionPlanSettings,
  addAllowedMemberToSelectionPlan,
  addEventTypeSelectionPlan,
  assignExtraQuestion2SelectionPlan,
  assignProgressFlag2SelectionPlan,
  deleteEventTypeSelectionPlan,
  getAllowedMembers,
  importAllowedMembersCSV,
  removeAllowedMemberFromSelectionPlan
}) => {
  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  const onDeleteExtraQuestion = (questionId) => {
    const extraQuestion = entity.extra_questions.find(
      (t) => t.id === questionId
    );
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "edit_selection_plan.extra_question_remove_warning"
      )} ${extraQuestion.name}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteSelectionPlanExtraQuestion(entity.id, questionId);
      }
    });
  };

  const onUpdateExtraQuestionOrder = (questions, questionId, newOrder) => {
    updateSelectionPlanExtraQuestionOrder(
      entity.id,
      questions,
      questionId,
      newOrder
    );
  };

  const onEditExtraQuestion = (questionId) => {
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${entity.id}/extra-questions/${questionId}`
    );
  };

  const onAddNewExtraQuestion = () => {
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${entity.id}/extra-questions/new`
    );
  };

  const onAddRatingType = () => {
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${entity.id}/rating-types/new`
    );
  };

  const onEditRatingType = (ratingTypeId) => {
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${entity.id}/rating-types/${ratingTypeId}`
    );
  };

  const onUpdateRatingTypeOrder = (ratingTypes, ratingTypeId, newOrder) => {
    updateRatingTypeOrder(entity.id, ratingTypes, ratingTypeId, newOrder);
  };

  const onDeleteRatingType = (ratingTypeId) => {
    const ratingType = entity.track_chair_rating_types.find(
      (t) => t.id === ratingTypeId
    );
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_selection_plan.rating_type_remove_warning")} ${
        ratingType.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteRatingType(entity.id, ratingTypeId);
      }
    });
  };

  const onAddProgressFlag = () => {
    history.push(`/app/summits/${currentSummit.id}/progress-flags`);
  };

  const onEditProgressFlag = (progressFlagId) => {
    history.push(
      `/app/summits/${currentSummit.id}/progress-flags#flag_id=${progressFlagId}`
    );
  };

  const onUpdateProgressFlagOrder = (
    progressFlags,
    progressFlagId,
    newOrder
  ) => {
    updateProgressFlagOrder(entity.id, progressFlags, progressFlagId, newOrder);
  };

  const onUnassignProgressFlag = (progressFlagId) => {
    const ratingType = entity.allowed_presentation_action_types.find(
      (t) => t.id === progressFlagId
    );
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "edit_selection_plan.presentation_action_type_remove_warning"
      )} ${ratingType.label}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        unassignProgressFlagFromSelectionPlan(entity.id, progressFlagId);
      }
    });
  };

  return (
    <div className="container">
      <h3>
        {title} {T.translate("edit_selection_plan.selection_plan")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      <SelectionPlanForm
        entity={entity}
        allowedMembers={allowedMembers}
        currentSummit={currentSummit}
        errors={errors}
        extraQuestionsOrder={extraQuestionsOrder}
        extraQuestionsOrderDir={extraQuestionsOrderDir}
        onTrackGroupLink={addTrackGroupToSelectionPlan}
        onTrackGroupUnLink={removeTrackGroupFromSelectionPlan}
        onSubmit={saveSelectionPlan}
        saveSelectionPlanSettings={saveSelectionPlanSettings}
        updateExtraQuestionOrder={onUpdateExtraQuestionOrder}
        onAddNewExtraQuestion={onAddNewExtraQuestion}
        onDeleteExtraQuestion={onDeleteExtraQuestion}
        onAddEventType={addEventTypeSelectionPlan}
        onDeleteEventType={deleteEventTypeSelectionPlan}
        onEditExtraQuestion={onEditExtraQuestion}
        onAddRatingType={onAddRatingType}
        onEditRatingType={onEditRatingType}
        onUpdateRatingTypeOrder={onUpdateRatingTypeOrder}
        onDeleteRatingType={onDeleteRatingType}
        onAssignExtraQuestion2SelectionPlan={assignExtraQuestion2SelectionPlan}
        onAddProgressFlag={onAddProgressFlag}
        onEditProgressFlag={onEditProgressFlag}
        onAssignProgressFlag2SelectionPlan={assignProgressFlag2SelectionPlan}
        onUnassignProgressFlag={onUnassignProgressFlag}
        onUpdateProgressFlagOrder={onUpdateProgressFlagOrder}
        onAllowedMemberAdd={addAllowedMemberToSelectionPlan}
        onAllowedMemberDelete={removeAllowedMemberFromSelectionPlan}
        onAllowedMembersPageChange={getAllowedMembers}
        onImportAllowedMembers={importAllowedMembersCSV}
      />
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSelectionPlanState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSelectionPlanState
});

export default connect(mapStateToProps, {
  saveSelectionPlan,
  addTrackGroupToSelectionPlan,
  removeTrackGroupFromSelectionPlan,
  addEventTypeSelectionPlan,
  deleteEventTypeSelectionPlan,
  updateSelectionPlanExtraQuestionOrder,
  deleteSelectionPlanExtraQuestion,
  updateRatingTypeOrder,
  deleteRatingType,
  assignExtraQuestion2SelectionPlan,
  assignProgressFlag2SelectionPlan,
  updateProgressFlagOrder,
  unassignProgressFlagFromSelectionPlan,
  addAllowedMemberToSelectionPlan,
  removeAllowedMemberFromSelectionPlan,
  getAllowedMembers,
  importAllowedMembersCSV,
  saveSelectionPlanSettings
})(EditSelectionPlanPage);
