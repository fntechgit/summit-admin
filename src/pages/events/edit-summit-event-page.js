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
import EventForm from "../../components/forms/event-form";
import {
  saveEvent,
  attachFile,
  getEvents,
  removeImage,
  getEventFeedback,
  deleteEventFeedback,
  getEventFeedbackCSV,
  changeFlag,
  getActionTypes,
  getEventComments,
  fetchExtraQuestions,
  fetchExtraQuestionsAnswers,
  cloneEvent,
  upgradeEvent
} from "../../actions/event-actions";
import { unPublishEvent } from "../../actions/summit-builder-actions";
import { deleteEventMaterial } from "../../actions/event-material-actions";
import { deleteEventComment } from "../../actions/event-comment-actions";
import {
  addQAMember,
  removeQAMember
} from "../../actions/user-chat-roles-actions";

import "../../styles/edit-summit-event-page.less";
import "../../components/form-validation/validate.less";

function EditSummitEventPage(props) {
  useEffect(() => {
    if (props.entity.id && props.entity.selection_plan_id) {
      props.getActionTypes(props.entity.selection_plan_id);
    }
  }, [props.entity.id, props.entity.selection_plan_id]);

  const getEventNextFromList = async (
    data,
    currentPage,
    lastPage,
    term,
    perPage,
    order,
    orderDir,
    filters
  ) => {
    const { entity, getEvents } = props;
    const listLength = data.length;
    const idx = data.findIndex((ev) => ev.id === entity.id);

    if (idx === -1) {
      // not found , return first
      return data[0];
    }

    if (idx === -1 || idx === listLength - 1) {
      // last on page
      if (lastPage > currentPage) {
        // there are more pages
        return getEvents(
          term,
          currentPage + 1,
          perPage,
          order,
          orderDir,
          filters
        ).then((newData) => newData.data[0]);
      }
      // last of last page
      if (lastPage > 1) {
        // there is more than one page
        return getEvents(term, 1, perPage, order, orderDir, filters).then(
          (newData) => newData.data[0]
        );
      }
      // only one page, return first
      return data[0];
    }
    return data[idx + 1];
  };

  const getEventPrevFromList = async (
    data,
    currentPage,
    lastPage,
    term,
    perPage,
    order,
    orderDir,
    filters
  ) => {
    const { entity, getEvents } = props;
    const idx = data.findIndex((ev) => ev.id === entity.id);

    if (idx === -1) {
      // not found , return first
      return data[0];
    }
    if (idx === 0) {
      // first on page
      if (currentPage > 1) {
        // there are more pages
        return getEvents(
          term,
          currentPage - 1,
          perPage,
          order,
          orderDir,
          filters
        ).then((newData) => newData.data[newData.data.length - 1]);
      }
      // first of first page
      if (lastPage > 1) {
        // there is more than one page
        return getEvents(
          term,
          lastPage,
          perPage,
          order,
          orderDir,
          filters
        ).then((newData) => newData.data[newData.data.length - 1]); // return last event of last page
      }
      // only one page, return last
      return data[data.length - 1];
    }
    return data[idx - 1];
  };

  const goToEvent = async (next = true) => {
    const { currentSummit, history } = props;
    const {
      events,
      currentPage,
      lastPage,
      filters,
      term,
      order,
      orderDir,
      perPage
    } = props.allEventsData;
    let event = null;

    if (events.length === 0) {
      event = await props
        .getEvents(term, 1, perPage, order, orderDir, filters)
        .then(async (data) => {
          const { data: allEvents, current_page, last_page } = data;
          return next
            ? getEventNextFromList(
                allEvents,
                current_page,
                last_page,
                term,
                perPage,
                order,
                orderDir,
                filters
              )
            : getEventPrevFromList(
                allEvents,
                current_page,
                last_page,
                term,
                perPage,
                order,
                orderDir,
                filters
              );
        });
    } else {
      event = next
        ? await getEventNextFromList(
            events,
            currentPage,
            lastPage,
            term,
            perPage,
            order,
            orderDir,
            filters
          )
        : await getEventPrevFromList(
            events,
            currentPage,
            lastPage,
            term,
            perPage,
            order,
            orderDir,
            filters
          );
    }

    if (event) {
      history.push(`/app/summits/${currentSummit.id}/events/${event.id}`);
    }
  };

  const {
    currentSummit,
    entity,
    errors,
    levelOptions,
    rsvpTemplateOptions,
    feedbackState,
    commentState,
    actionTypes,
    loading,
    history,
    saveEvent,
    attachFile,
    unPublishEvent,
    deleteEventMaterial,
    removeImage,
    addQAMember,
    removeQAMember,
    getEventFeedback,
    getEventComments,
    deleteEventComment,
    deleteEventFeedback,
    getEventFeedbackCSV,
    changeFlag,
    cloneEvent,
    upgradeEvent
  } = props;

  if (loading) return null;

  const header = !entity.id
    ? T.translate("general.summit_event")
    : `${entity.title} - ID ${entity.id}`;

  return (
    <div className="container">
      <h3>
        <div className="title">{header}</div>
        {!!entity.id && (
          <div>
            <button
              className="btn btn-default prev"
              type="button"
              onClick={() => goToEvent(false)}
            >
              {"<< Prev Event"}
            </button>
            <button
              className="btn btn-default next"
              type="button"
              onClick={() => goToEvent(true)}
            >
              {"Next Event >>"}
            </button>
            <a href="new" className="btn btn-default pull-right">
              Add new
            </a>
          </div>
        )}
      </h3>
      <hr />
      {currentSummit && (
        <EventForm
          history={history}
          currentSummit={currentSummit}
          levelOpts={levelOptions}
          trackOpts={currentSummit.tracks}
          typeOpts={currentSummit.event_types}
          selectionPlansOpts={currentSummit.selection_plans}
          rsvpTemplateOpts={rsvpTemplateOptions}
          actionTypes={actionTypes}
          entity={entity}
          errors={errors}
          onSubmit={saveEvent}
          onEventUpgrade={upgradeEvent}
          onAttach={attachFile}
          onUnpublish={unPublishEvent}
          onMaterialDelete={deleteEventMaterial}
          onRemoveImage={removeImage}
          onAddQAMember={addQAMember}
          onDeleteQAMember={removeQAMember}
          feedbackState={feedbackState}
          getEventFeedback={getEventFeedback}
          fetchExtraQuestions={fetchExtraQuestions}
          fetchExtraQuestionsAnswers={fetchExtraQuestionsAnswers}
          commentState={commentState}
          getEventComments={getEventComments}
          onCommentDelete={deleteEventComment}
          deleteEventFeedback={deleteEventFeedback}
          getEventFeedbackCSV={getEventFeedbackCSV}
          onFlagChange={changeFlag}
          onClone={cloneEvent}
        />
      )}
    </div>
  );
}

const mapStateToProps = ({
  currentSummitState,
  currentSummitEventState,
  currentRsvpTemplateListState,
  currentEventListState,
  auditLogState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  loading: currentSummitState.loading,
  levelOptions: currentSummitEventState.levelOptions,
  rsvpTemplateOptions: currentRsvpTemplateListState.rsvpTemplates,
  entity: currentSummitEventState.entity,
  errors: currentSummitEventState.errors,
  feedbackState: currentSummitEventState.feedbackState,
  commentState: currentSummitEventState.commentState,
  auditLogState,
  actionTypes: currentSummitEventState.actionTypes,
  allEventsData: currentEventListState
});

export default connect(mapStateToProps, {
  saveEvent,
  attachFile,
  unPublishEvent,
  deleteEventMaterial,
  getEvents,
  removeImage,
  addQAMember,
  removeQAMember,
  getEventFeedback,
  deleteEventFeedback,
  getEventFeedbackCSV,
  changeFlag,
  getActionTypes,
  getEventComments,
  deleteEventComment,
  cloneEvent,
  upgradeEvent
})(EditSummitEventPage);
