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
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import Swal from "sweetalert2";
import { Tooltip } from "react-tooltip";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  TextEditor,
  Dropdown,
  DateTimePicker,
  TagInput,
  SpeakerInput,
  CompanyInput,
  GroupInput,
  UploadInput,
  Input,
  Panel,
  Table,
  MemberInput,
  FreeTextSearch,
  TicketTypesInput,
  SortableTable
} from "openstack-uicore-foundation/lib/components";
import { Pagination } from "react-bootstrap";
import ExtraQuestionsForm from "openstack-uicore-foundation/lib/components/extra-questions";
import QuestionsSet from "openstack-uicore-foundation/lib/utils/questions-set";
import {
  isEmpty,
  scrollToError,
  shallowEqual,
  hasErrors,
  adjustEventDuration,
  isValidUrl
} from "../../utils/methods";
import ProgressFlags from "../inputs/ProgressFlags";
import {
  ATTENDEES_EXPECTED_LEARNT,
  ATTENDING_MEDIA,
  LEVEL,
  SOCIAL_DESCRIPTION
} from "../../actions/event-actions";
import AuditLogs from "../audit-logs";
import {
  DECIMAL_DIGITS,
  DELTA_SECS,
  EVENT_TYPE_FISHBOWL,
  EVENT_TYPE_GROUP_EVENTS,
  EVENT_TYPE_PRESENTATION,
  MILLISECONDS_TO_SECONDS,
  ONE_MINUTE
} from "../../utils/constants";
import CopyClipboard from "../buttons/copy-clipboard";
import LocationGroupedAsyncDropdown from "../inputs/location-grouped-dropdown";

class EventForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      speakerToAdd: null,
      entity: { ...props.entity },
      showSection: "main",
      errors: props.errors,
      publish: false,
      commentFilters: { ...props.commentState.filters }
    };

    this.formRef = React.createRef();

    this.handleChange = this.handleChange.bind(this);
    this.handleQAuserChange = this.handleQAuserChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleUploadFile = this.handleUploadFile.bind(this);
    this.handleRemoveFile = this.handleRemoveFile.bind(this);
    this.handleMaterialEdit = this.handleMaterialEdit.bind(this);
    this.handleNewMaterial = this.handleNewMaterial.bind(this);
    this.handleUploadPic = this.handleUploadPic.bind(this);
    this.handleMaterialDownload = this.handleMaterialDownload.bind(this);
    this.handleMaterialDelete = this.handleMaterialDelete.bind(this);
    this.getQAUsersOptionLabel = this.getQAUsersOptionLabel.bind(this);
    this.handleFeedbackExport = this.handleFeedbackExport.bind(this);
    this.handleFeedbackPageChange = this.handleFeedbackPageChange.bind(this);
    this.handleFeedbackSort = this.handleFeedbackSort.bind(this);
    this.handleFeedbackSearch = this.handleFeedbackSearch.bind(this);
    this.handleDeleteEventFeedback = this.handleDeleteEventFeedback.bind(this);
    this.handleChangeSelectionPlan = this.handleChangeSelectionPlan.bind(this);
    this.handleChangeExtraQuestion = this.handleChangeExtraQuestion.bind(this);
    this.triggerFormSubmit = this.triggerFormSubmit.bind(this);
    this.handleUnpublish = this.handleUnpublish.bind(this);
    this.isQuestionAllowed = this.isQuestionAllowed.bind(this);
    this.getPopupScores = this.getPopupScores.bind(this);
    this.handleTrackChairCommentEdit =
      this.handleTrackChairCommentEdit.bind(this);
    this.handleTrackChairCommentDelete =
      this.handleTrackChairCommentDelete.bind(this);
    this.handleTrackChairCommentSearch =
      this.handleTrackChairCommentSearch.bind(this);
    this.handleTrackChairCommentPageChange =
      this.handleTrackChairCommentPageChange.bind(this);
    this.handleTrackChairCommentSort =
      this.handleTrackChairCommentSort.bind(this);
    this.handleTrackChairFilterChange =
      this.handleTrackChairFilterChange.bind(this);
    this.handleSelectSpeakerToAdd = this.handleSelectSpeakerToAdd.bind(this);
    this.handleSpeakerUnassign = this.handleSpeakerUnassign.bind(this);
    this.handleSpeakerAssign = this.handleSpeakerAssign.bind(this);
    this.handleSpeakerEdit = this.handleSpeakerEdit.bind(this);
    this.handleSpeakersReordering = this.handleSpeakersReordering.bind(this);
    this.handleCloneEvent = this.handleCloneEvent.bind(this);
    this.handleEventTypeChange = this.handleEventTypeChange.bind(this);
  }

  componentDidMount() {
    const { entity } = this.state;
    const { feedbackState, commentState, getEventFeedback, getEventComments } =
      this.props;
    if (entity.id > 0) {
      if (entity.allow_feedback) {
        getEventFeedback(
          entity.id,
          feedbackState.term,
          feedbackState.page,
          feedbackState.perPage,
          feedbackState.order,
          feedbackState.orderDir
        );
      }
      getEventComments(
        entity.id,
        commentState.term,
        commentState.page,
        commentState.perPage,
        commentState.order,
        commentState.orderDir
      );
    }
  }

  componentDidUpdate(prevProps) {
    const { errors, entity } = this.props;
    const newState = {};
    scrollToError(errors);

    if (!shallowEqual(prevProps.entity, entity)) {
      newState.entity = { ...entity };
      newState.errors = {};
    }

    if (!shallowEqual(prevProps.errors, errors)) {
      newState.errors = { ...errors };
    }

    if (!isEmpty(newState)) {
      this.setState((prevState) => ({ ...prevState, ...newState }));
    }
  }

  handleChange(ev) {
    const { entity, errors } = this.state;
    const newEntity = { ...entity };
    const newErrors = { ...errors };
    let { value, id } = ev.target;

    if (ev.target.type === "radio") {
      id = ev.target.name;
      value = ev.target.value === 1;
    }

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (ev.target.type === "datetime") {
      value = value.valueOf() / MILLISECONDS_TO_SECONDS;
    }

    newErrors[id] = "";
    newEntity[id] = value;
    this.setState({ entity: newEntity }, () => {
      if (id === "type_id" && entity.id)
        this.handleEventTypeChange(entity, newEntity);
    });
  }

  handleQAuserChange(ev) {
    const { errors, entity } = this.state;
    const newEntity = { ...entity };
    const newErrors = { ...errors };
    const { onAddQAMember, onDeleteQAMember, currentSummit } = this.props;
    let { value, id } = ev.target;
    let currentError = "";
    const oldHelpUsers = newEntity[id];
    const currentOldOnes = [];
    try {
      // remap to chat api payload format
      const newHelpUsers = value.map((member) => {
        if (member.hasOwnProperty("email")) {
          // if has email property then its cames from main api
          // we need to remap but first only users with idp id set
          // are valid
          if (!member.user_external_id) {
            throw new Error("Invalid user");
          }
          const newMember = {
            member_id: member.id,
            idp_user_id: member.user_external_id,
            full_name: `${member.first_name} ${member.last_name}`,
            summit_event_id: newEntity.id,
            summit_id: currentSummit.id
          };
          onAddQAMember(newMember, newEntity.id);
          return newMember;
        }
        currentOldOnes.push(member);
        return member;
      });

      // check if we delete something
      if (oldHelpUsers.length !== currentOldOnes.length) {
        // get missing one
        const missingOne = oldHelpUsers.filter((oldOne) => {
          const matches = currentOldOnes.filter(
            (newOne) => newOne.member_id === oldOne.member_id
          );
          return matches.length === 0;
        });
        if (missingOne.length > 0) {
          // remove it
          onDeleteQAMember(missingOne[0], newEntity.id);
        }
      }

      value = newHelpUsers;
    } catch (e) {
      console.log(e);
      value = oldHelpUsers;
      currentError = e;
    }

    newErrors[id] = currentError;
    newEntity[id] = value;
    this.setState({ entity: newEntity, errors: newErrors });
  }

  handleTimeChange(ev) {
    const { errors, entity } = this.state;
    const { id } = ev.target;

    let newEntity = { ...entity };
    const newErrors = { ...errors };
    newErrors[id] = "";
    newEntity = adjustEventDuration(ev, entity);
    this.setState({ entity: newEntity, errors: newErrors });
  }

  handleUploadFile(file) {
    const { onAttach } = this.props;
    const { entity } = this.state;
    const newEntity = { ...entity };

    newEntity.attachment = file.preview;
    this.setState({ entity: newEntity });

    const formData = new FormData();
    formData.append("file", file);

    onAttach(newEntity, formData, "file");
  }

  handleRemoveFile(attr) {
    const { onRemoveImage } = this.props;
    const { entity } = this.state;
    const newEntity = { ...entity };

    newEntity[attr] = "";

    if (attr === "image") {
      onRemoveImage(newEntity.id);
    }

    this.setState({ entity: newEntity });
  }

  handleCloneEvent(ev) {
    ev.preventDefault();
    const { entity } = this.state;
    const { onClone } = this.props;
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_event.clone_event")} "${entity.title}"`,
      type: "warning",
      showCancelButton: true,
      confirmButtonText: T.translate("general.yes")
    }).then((result) => {
      if (result.value) {
        onClone(entity);
      }
    });
  }

  async handleChangeSelectionPlan(ev) {
    const {
      currentSummit,
      selectionPlansOpts,
      fetchExtraQuestions,
      fetchExtraQuestionsAnswers
    } = this.props;
    const { errors, entity } = this.state;
    const newEntity = { ...entity };
    const { value, id } = ev.target;
    let extraQuestions = [];
    let extraQuestionsAnswers = [];
    let newSelectionPlan = null;

    if (value) {
      extraQuestions = await fetchExtraQuestions(currentSummit.id, value);
      newSelectionPlan = selectionPlansOpts.find((sp) => sp.id === value);
      newSelectionPlan.extra_questions = extraQuestions;

      if (newEntity?.id) {
        extraQuestionsAnswers = await fetchExtraQuestionsAnswers(
          currentSummit.id,
          value,
          newEntity.id
        );
      }
    }

    errors[id] = "";
    newEntity.selection_plan_id = value;
    newEntity.selection_plan = newSelectionPlan;
    newEntity.extra_questions = extraQuestionsAnswers;
    this.setState({ entity: newEntity });
  }

  handleChangeExtraQuestion(formValues) {
    const { entity } = this.state;
    const { onSubmit } = this.props;
    const qs = new QuestionsSet(entity?.selection_plan?.extra_questions || {});
    const formattedAnswers = [];

    Object.keys(formValues).map((name) => {
      const question = qs.getQuestionByName(name);
      const newQuestion = {
        question_id: question.id,
        value: `${formValues[name]}`
      };
      formattedAnswers.push(newQuestion);
    });

    const { publish } = this.state;
    this.setState(
      (prevState) => ({
        ...prevState,
        entity: { ...prevState.entity, extra_questions: formattedAnswers },
        publish: false
      }),
      () => {
        onSubmit(entity, publish);
      }
    );
  }

  handleUnpublish(ev) {
    const { onUnpublish } = this.props;
    const { entity } = this.state;
    ev.preventDefault();
    onUnpublish(entity);
  }

  handleScheduleLink(ev) {
    const { entity } = this.state;
    const { currentSummit, history } = this.props;

    ev.preventDefault();

    const start_date = epochToMomentTimeZone(
      entity.start_date,
      currentSummit.time_zone_id
    ).format("YYYY-MM-DD");
    const { location_id } = entity;
    const event_id = entity.id;

    history.push(
      `/app/summits/${currentSummit.id}/events/schedule#location_id=${location_id}&day=${start_date}&event=${event_id}`
    );
  }

  handleEventLink(ev) {
    const { entity } = this.state;
    const { currentSummit } = this.props;
    ev.preventDefault();

    const eventStart = epochToMomentTimeZone(
      entity.start_date + DELTA_SECS,
      currentSummit.time_zone_id
    ).format("YYYY-MM-DD,HH:mm:ss");

    const event_detail_url = `${currentSummit.virtual_site_url}event/${entity.id}#now=${eventStart}`;

    window.open(event_detail_url, "_blank");
  }

  handleMaterialEdit(materialId) {
    const { currentSummit, entity, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/events/${entity.id}/materials/${materialId}`
    );
  }

  handleNewMaterial(ev) {
    ev.preventDefault();

    const { currentSummit, entity, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/events/${entity.id}/materials/new`
    );
  }

  handleUploadPic(file) {
    const { entity } = this.state;
    const { onAttach } = this.props;
    const newEntity = { ...entity };

    newEntity.image = file.preview;
    this.setState({ entity: newEntity });

    const formData = new FormData();
    formData.append("file", file);
    onAttach(newEntity, formData, "profile");
  }

  getMaterialUrl(material) {
    let url = null;
    if (isValidUrl(material.private_url)) url = material.private_url;
    if (isValidUrl(material.public_url)) url = material.public_url;
    if (isValidUrl(material.link)) url = material.link;
    if (material.youtube_id)
      url = `https://www.youtube.com/watch?v=${material.youtube_id}`;
    if (material.external_url) url = material.external_url;

    return url;
  }

  handleMaterialDownload(materialId) {
    const { entity } = this.props;
    const material = entity.materials.find((m) => m.id === materialId);
    const url = this.getMaterialUrl(material);

    if (!url) {
      Swal.fire(
        "Not Found",
        T.translate("edit_event.invalid_material_url"),
        "warning"
      );
      return;
    }

    window.open(url, "_blank");
  }

  handleMaterialDelete(materialId) {
    const { entity, onMaterialDelete } = this.props;
    const material = entity.materials.find((m) => m.id === materialId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_event.delete_material")} ${material.filename}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        onMaterialDelete(materialId);
      }
    });
  }

  handleFeedbackExport(ev) {
    ev.preventDefault();
    const { entity } = this.state;
    const { feedbackState, getEventFeedbackCSV } = this.props;
    getEventFeedbackCSV(
      entity.id,
      feedbackState.term,
      feedbackState.order,
      feedbackState.orderDir
    );
  }

  handleFeedbackSearch(term) {
    const { entity } = this.state;
    const { feedbackState, getEventFeedback } = this.props;
    getEventFeedback(
      entity.id,
      term,
      feedbackState.page,
      feedbackState.perPage,
      feedbackState.order,
      feedbackState.orderDir
    );
  }

  handleFeedbackPageChange(page) {
    const { entity } = this.state;
    const { feedbackState, getEventFeedback } = this.props;
    getEventFeedback(
      entity.id,
      feedbackState.term,
      page,
      feedbackState.perPage,
      feedbackState.order,
      feedbackState.orderDir
    );
  }

  handleFeedbackSort(index, key, dir) {
    const { feedbackState, getEventFeedback } = this.props;
    const { entity } = this.state;
    getEventFeedback(
      entity.id,
      feedbackState.term,
      feedbackState.page,
      feedbackState.perPage,
      key,
      dir
    );
  }

  handleDeleteEventFeedback(id) {
    const { entity } = this.state;
    const { deleteEventFeedback } = this.props;
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_event.delete_feedback_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteEventFeedback(entity.id, id);
      }
    });
  }

  handleTrackChairCommentEdit(commentId) {
    const { currentSummit, entity, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/events/${entity.id}/comments/${commentId}`
    );
  }

  handleTrackChairCommentDelete(commentId) {
    const { commentState, onCommentDelete } = this.props;
    const comment = commentState.comments.find((c) => c.id === commentId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text:
        `${T.translate("edit_event.delete_comment")} ` + `"${comment.body}"`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        onCommentDelete(commentId);
      }
    });
  }

  handleSelectSpeakerToAdd(ev) {
    const { value } = ev.target;
    this.setState((prevState) => ({ ...prevState, speakerToAdd: value }));
  }

  handleSpeakerAssign() {
    const { entity, speakerToAdd } = this.state;
    if (speakerToAdd) {
      if (entity.speakers.some((s) => s.id === speakerToAdd.id)) return;
      const speakers = [...entity.speakers, speakerToAdd];
      this.setState((prevState) => ({
        ...prevState,
        speakerToAdd: null,
        entity: { ...entity, speakers }
      }));
    }
  }

  handleSpeakerUnassign(speakerId) {
    const { entity } = this.state;
    const speaker = entity.speakers.find((c) => c.id === speakerId);
    if (!speaker) return;
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text:
        `${T.translate("edit_event.unassign_speaker")} ` +
        `${speaker.first_name} ${speaker.last_name}?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        this.setState((prevState) => ({
          ...prevState,
          entity: {
            ...entity,
            speakers: entity.speakers.filter((e) => e.id !== speaker.id)
          }
        }));
      }
    });
  }

  handleSpeakersReordering(speakers) {
    const { entity } = this.state;
    this.setState((prevState) => ({
      ...prevState,
      entity: { ...entity, speakers }
    }));
  }

  handleSpeakerEdit(speakerId) {
    const { history } = this.props;
    history.push(`/app/speakers/${speakerId}`);
  }

  handleTrackChairCommentSearch(term) {
    const { entity } = this.state;
    const { commentState, getEventComments } = this.props;
    getEventComments(
      entity.id,
      term,
      commentState.page,
      commentState.perPage,
      commentState.order,
      commentState.orderDir
    );
  }

  handleTrackChairCommentPageChange(page) {
    const { entity } = this.state;
    const { commentState, getEventComments } = this.props;
    getEventComments(
      entity.id,
      commentState.term,
      page,
      commentState.perPage,
      commentState.order,
      commentState.orderDir
    );
  }

  handleTrackChairCommentSort(index, key, dir) {
    const { commentState, getEventComments } = this.props;
    const { entity } = this.state;
    getEventComments(
      entity.id,
      commentState.term,
      commentState.page,
      commentState.perPage,
      key,
      dir
    );
  }

  handleTrackChairFilterChange(ev) {
    const { entity, commentFilters } = this.state;
    const { commentState, getEventComments } = this.props;
    this.setState(
      (prevState) => ({
        ...prevState,
        commentFilters: {
          ...commentFilters,
          [ev.target.id]: ev.target.checked
        }
      }),
      () => {
        getEventComments(
          entity.id,
          commentState.term,
          commentState.page,
          commentState.perPage,
          commentState.order,
          commentState.orderDir,
          commentFilters
        );
      }
    );
  }

  handleEventTypeChange(oldEntity, newEntity) {
    const isEventUpgrade =
      !this.isEventType(EVENT_TYPE_PRESENTATION, oldEntity) &&
      this.isEventType(EVENT_TYPE_PRESENTATION, newEntity);
    const isEventDowngrade =
      this.isEventType(EVENT_TYPE_PRESENTATION, oldEntity) &&
      !this.isEventType(EVENT_TYPE_PRESENTATION, newEntity);

    if (isEventUpgrade) {
      Swal.fire({
        title: T.translate("general.attention"),
        html: `${T.translate("edit_event.upgrade_message")}<br>${T.translate(
          "edit_event.upgrade_message_2"
        )}`,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        confirmButtonText: T.translate("general.save")
      }).then((result) => {
        if (result.value) {
          const { onEventUpgrade } = this.props;
          onEventUpgrade(newEntity);
        }
        if (result.dismiss) {
          this.setState((prevState) => ({
            ...prevState,
            entity: oldEntity
          }));
        }
      });
    }

    if (isEventDowngrade) {
      Swal.fire({
        title: T.translate("general.attention"),
        text: T.translate("edit_event.downgrade_message"),
        type: "warning",
        showCancelButton: false,
        confirmButtonColor: "#DD6B55"
        // confirmButtonText: T.translate("general.yes_delete")
      }).then((result) => {
        if (result.value) {
          this.setState((prevState) => ({
            ...prevState,
            entity: oldEntity
          }));
        }
      });
    }
  }

  getPopupScores(score_id) {
    const { entity } = this.state;
    let res = "";
    const rating_type = entity?.selection_plan?.track_chair_rating_types.find(
      (st) => st.id === parseInt(score_id)
    );
    if (rating_type) {
      rating_type.score_types.forEach((st) => {
        if (res !== "") res += "<br>";
        res += `${
          st.score
        }. <b>${st.name.trim()}</b> <p>${st.description?.trim()}</p>`;
      });
    }
    return res;
  }

  getQAUsersOptionLabel(member) {
    if (member.hasOwnProperty("full_name")) {
      return member.full_name;
    }
    // default
    return `${member.first_name} ${member.last_name} (${member.id})`;
  }

  triggerFormSubmit(ev, publish = false) {
    ev.preventDefault();
    const { onSubmit } = this.props;
    const { entity } = this.state;
    // do regular submit
    const newEntity = { ...entity };
    // check current ( could not be rendered)
    if (this.formRef.current) {
      this.setState(
        (prevState) => ({ ...prevState, publish }),
        () => {
          this.formRef.current.doSubmit();
        }
      );
      return;
    }

    // if we did not changed the extra questions , then dont send them
    if (newEntity.extra_questions) {
      delete newEntity.extra_questions;
    }

    onSubmit(newEntity, publish);
  }

  isEventType(types, checkEntity = null) {
    const { entity } = this.state;
    const { typeOpts } = this.props;
    const entityToCheck = checkEntity || entity;
    if (!entityToCheck.type_id) return false;
    const entity_type = typeOpts.find((t) => t.id === entityToCheck.type_id);

    types = Array.isArray(types) ? types : [types];
    return (
      types.indexOf(entity_type.class_name) !== -1 ||
      types.indexOf(entity_type.name) !== -1
    );
  }

  isQuestionAllowed(question_id) {
    const { entity } = this.state;
    const { selectionPlansOpts } = this.props;
    if (!entity.selection_plan_id) return false;
    const selectionPlan = selectionPlansOpts.find(
      (sp) => sp.id === entity.selection_plan_id
    );
    return selectionPlan.allowed_presentation_questions.includes(question_id);
  }

  shouldShowField(flag) {
    const { entity } = this.state;
    const { typeOpts } = this.props;
    if (!entity.type_id) return false;
    const entity_type = typeOpts.find((t) => t.id === entity.type_id);

    return entity_type[flag];
  }

  toggleSection(section, ev) {
    const { showSection } = this.state;
    const newShowSection = showSection === section ? "main" : section;
    ev.preventDefault();

    this.setState({ showSection: newShowSection });
  }

  render() {
    const { entity, showSection, errors, speakerToAdd } = this.state;

    const {
      currentSummit,
      levelOpts,
      typeOpts,
      trackOpts,
      rsvpTemplateOpts,
      selectionPlansOpts,
      history,
      feedbackState,
      commentState,
      actionTypes
    } = this.props;

    const event_types_ddl = typeOpts.map((t) => {
      const disabled = entity.id ? !this.isEventType(t.class_name) : false;
      return {
        label: t.name,
        value: t.id,
        type: t.class_name,
        disabled
      };
    });

    const feedback_columns = [
      { columnKey: "created", value: "Created Date", sortable: true },
      { columnKey: "owner_full_name", value: "Author", sortable: true },
      { columnKey: "rate", value: "Rate", sortable: true },
      { columnKey: "note", value: "Note" }
    ];

    const feedback_table_options = {
      sortCol: feedbackState.order,
      sortDir: feedbackState.orderDir,
      actions: {
        delete: {
          onClick: this.handleDeleteEventFeedback
        }
      }
    };

    const tracks_ddl = trackOpts
      .filter((track) => track.subtracks.length === 0)
      .map((t) => ({ label: t.name, value: t.id }));

    const levels_ddl = levelOpts.map((l) => ({ label: l, value: l }));

    let selection_plans_ddl = [];

    if (entity.track_id) {
      const track = trackOpts.find((t) => t.id === entity.track_id);
      selection_plans_ddl = selectionPlansOpts
        .filter((sp) =>
          sp.track_groups.some((gr) => track.track_groups.includes(gr))
        )
        .map((sp) => ({ label: sp.name, value: sp.id }));
    }

    const rsvp_templates_ddl = rsvpTemplateOpts.map((t) => ({
      label: t.title,
      value: t.id
    }));

    const material_columns = [
      { columnKey: "class_name", value: T.translate("edit_event.type") },
      { columnKey: "name", value: T.translate("general.name") },
      { columnKey: "filename", value: T.translate("general.file") },
      {
        columnKey: "display_on_site_label",
        value: T.translate("edit_event.display_on_site")
      }
    ];

    const material_options = {
      actions: {
        edit: { onClick: this.handleMaterialEdit },
        custom: [
          {
            name: "download",
            tooltip: "download",
            icon: <i className="fa fa-download" />,
            onClick: this.handleMaterialDownload
          }
        ],
        delete: { onClick: this.handleMaterialDelete }
      }
    };

    const streaming_type_ddl = [
      { label: "LIVE", value: "LIVE" },
      { label: "VOD", value: "VOD" }
    ];

    const track_chair_comments_columns = [
      { columnKey: "body", value: T.translate("edit_event.body") },
      {
        columnKey: "owner_full_name",
        value: T.translate("edit_event.owner_full_name"),
        sortable: true
      },
      { columnKey: "created", value: T.translate("edit_event.created") },
      {
        columnKey: "last_edited",
        value: T.translate("edit_event.last_edited")
      },
      {
        columnKey: "is_activity",
        value: T.translate("edit_event.is_activity")
      },
      { columnKey: "is_public", value: T.translate("edit_event.is_public") }
    ];

    const track_chair_comments_options = {
      sortCol: commentState.order,
      sortDir: commentState.orderDir,
      actions: {
        edit: { onClick: this.handleTrackChairCommentEdit },
        delete: { onClick: this.handleTrackChairCommentDelete }
      }
    };

    const speakers_columns = [
      { columnKey: "id", value: T.translate("general.id") },
      {
        columnKey: "first_name",
        value: T.translate("edit_event.speaker_first_name")
      },
      {
        columnKey: "last_name",
        value: T.translate("edit_event.speaker_last_name")
      },
      {
        columnKey: "company",
        value: T.translate("edit_event.speaker_company")
      },
      { columnKey: "email", value: T.translate("edit_event.speaker_email") }
    ];

    const speakers_options = {
      actions: {
        edit: { onClick: this.handleSpeakerEdit },
        delete: { onClick: this.handleSpeakerUnassign }
      }
    };

    const submission_source_ddl = [
      { label: "Admin", value: "Admin" },
      { label: "Submission", value: "Submission" }
    ];

    return (
      <div>
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-8">
            <label> {T.translate("edit_event.submitter")} </label> &nbsp;
            {entity.created_by && (
              <CopyClipboard
                text={
                  entity.created_by.hasOwnProperty("email")
                    ? `${entity.created_by.first_name} ${entity.created_by.last_name} <${entity.created_by.email}>`
                    : `${entity.created_by.first_name} ${entity.created_by.last_name} (${entity.created_by.id})`
                }
                tooltipText="Copy Submitter"
              />
            )}
            <div>
              <MemberInput
                id="created_by"
                value={entity.created_by}
                getOptionLabel={(member) =>
                  member.hasOwnProperty("email")
                    ? `${member.first_name} ${member.last_name} ${
                        member.company ? `- ${member.company}` : ""
                      } (${member.email})`
                    : `${member.first_name} ${member.last_name} ${
                        member.company ? `- ${member.company}` : ""
                      } (${member.id})`
                }
                onChange={this.handleChange}
                error={hasErrors("created_by_id", errors)}
                placeholder={T.translate(
                  "edit_event.placeholders.select_submitter"
                )}
              />
            </div>
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_event.submission_source")} </label>
            <Dropdown
              id="submission_source"
              value={entity.submission_source}
              onChange={this.handleChange}
              placeholder={T.translate(
                "edit_event.placeholders.select_submission_source"
              )}
              options={submission_source_ddl}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-11">
            <label> {T.translate("edit_event.title")} *</label>
            <Input
              className="form-control"
              error={hasErrors("title", errors)}
              id="title"
              value={entity.title}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-1 published">
            <label> {T.translate("edit_event.published")} </label>
            <div>
              <i
                className={`fa fa-2x ${
                  entity.is_published ? "fa-check" : "fa-times"
                }`}
              />
            </div>
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-12">
            <label> {T.translate("edit_event.short_description")}</label>
            <TextEditor
              id="description"
              value={entity.description}
              onChange={this.handleChange}
              error={hasErrors("description", errors)}
            />
          </div>
        </div>
        {this.isQuestionAllowed(SOCIAL_DESCRIPTION) && (
          <div className="row form-group">
            <div className="col-md-12">
              <label> {T.translate("edit_event.social_summary")} </label>
              <textarea
                className="form-control"
                id="social_description"
                value={entity.social_description}
                onChange={this.handleChange}
              />
            </div>
          </div>
        )}
        {this.isEventType(EVENT_TYPE_PRESENTATION) &&
          this.isQuestionAllowed(ATTENDEES_EXPECTED_LEARNT) && (
            <div className="row form-group">
              <div className="col-md-12">
                <label> {T.translate("edit_event.expect_to_learn")} </label>
                <TextEditor
                  id="attendees_expected_learnt"
                  value={entity.attendees_expected_learnt}
                  onChange={this.handleChange}
                />
              </div>
            </div>
          )}
        <div className="row form-group">
          {this.shouldShowField("allows_publishing_dates") && (
            <>
              <div className="col-md-4">
                <label> {T.translate("edit_event.start_date")} </label>
                <DateTimePicker
                  id="start_date"
                  onChange={this.handleTimeChange}
                  validation={{
                    after: currentSummit.start_date,
                    before: currentSummit.end_date
                  }}
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  value={epochToMomentTimeZone(
                    entity.start_date,
                    currentSummit.time_zone_id
                  )}
                  inputProps={{
                    placeholder: T.translate(
                      "edit_event.placeholders.start_date"
                    )
                  }}
                  timezone={currentSummit.time_zone_id}
                  error={hasErrors("start_date", errors)}
                  viewDate={epochToMomentTimeZone(
                    currentSummit.start_date,
                    currentSummit.time_zone_id
                  )}
                />
              </div>
              <div className="col-md-4">
                <label> {T.translate("edit_event.end_date")} </label>
                <DateTimePicker
                  id="end_date"
                  onChange={this.handleTimeChange}
                  validation={{
                    after: currentSummit.start_date,
                    before: currentSummit.end_date
                  }}
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  value={epochToMomentTimeZone(
                    entity.end_date,
                    currentSummit.time_zone_id
                  )}
                  inputProps={{
                    placeholder: T.translate("edit_event.placeholders.end_date")
                  }}
                  timezone={currentSummit.time_zone_id}
                  error={hasErrors("end_date", errors)}
                  viewDate={epochToMomentTimeZone(
                    currentSummit.start_date,
                    currentSummit.time_zone_id
                  )}
                />
              </div>
              <div className="col-md-4">
                <label> {T.translate("edit_event.duration")} (minutes) </label>
                <input
                  className="form-control"
                  id="duration"
                  value={
                    entity.duration !== "" ? entity.duration / ONE_MINUTE : ""
                  }
                  onChange={this.handleTimeChange}
                  type="number"
                  min="0"
                  step="1"
                />
              </div>
            </>
          )}
        </div>
        <div className="row form-group">
          <div className="col-md-4">
            <label> {T.translate("edit_event.event_type")} *</label>
            <Dropdown
              id="type_id"
              value={entity.type_id}
              onChange={this.handleChange}
              placeholder={T.translate(
                "edit_event.placeholders.select_event_type"
              )}
              options={event_types_ddl}
              error={hasErrors("type_id", errors)}
            />
          </div>
          {this.shouldShowField("allows_location") && (
            <div className="col-md-4">
              <label> {T.translate("edit_event.location")} </label>
              <LocationGroupedAsyncDropdown
                id="location_id"
                value={entity.location_id}
                summitId={currentSummit.id}
                placeholder={T.translate(
                  "edit_event.placeholders.select_venue"
                )}
                onChange={this.handleChange}
                error={hasErrors("location_id", errors)}
              />
            </div>
          )}
          {this.isQuestionAllowed(LEVEL) && (
            <div className="col-md-4">
              <label> {T.translate("edit_event.level")} </label>
              <Dropdown
                id="level"
                value={entity.level}
                onChange={this.handleChange}
                placeholder={T.translate(
                  "edit_event.placeholders.select_level"
                )}
                options={levels_ddl}
              />
            </div>
          )}
        </div>
        <div className="row form-group">
          {this.isEventType(EVENT_TYPE_PRESENTATION) && (
            <div className="col-md-4">
              <label> {T.translate("edit_event.selection_plan")} </label>
              <Dropdown
                id="selection_plan_id"
                value={entity.selection_plan_id}
                onChange={this.handleChangeSelectionPlan}
                placeholder={T.translate(
                  "edit_event.placeholders.select_selection_plan"
                )}
                isClearable
                options={selection_plans_ddl}
              />
            </div>
          )}
          <div className="col-md-4">
            <label> {T.translate("edit_event.track")} *</label>
            <Dropdown
              id="track_id"
              value={entity.track_id}
              onChange={this.handleChange}
              placeholder={T.translate("edit_event.placeholders.select_track")}
              options={tracks_ddl}
              error={hasErrors("track_id", errors)}
            />
          </div>
          {this.isEventType(EVENT_TYPE_PRESENTATION) &&
            this.shouldShowField("allow_custom_ordering") && (
              <div className="col-md-4">
                <label> {T.translate("edit_event.custom_order")} </label>
                <Input
                  id="custom_order"
                  type="number"
                  className="form-control"
                  error={hasErrors("custom_order ", errors)}
                  value={entity.custom_order}
                  onChange={this.handleChange}
                />
              </div>
            )}
        </div>
        <hr />
        <div className="row form-group">
          <div className="col-md-3">
            <div className="form-check abc-checkbox">
              <input
                type="checkbox"
                id="allow_feedback"
                checked={entity.allow_feedback}
                onChange={this.handleChange}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="allow_feedback">
                {" "}
                {T.translate("edit_event.allow_feedback")}{" "}
              </label>
            </div>
          </div>
          {this.isEventType(EVENT_TYPE_PRESENTATION) && (
            <div className="col-md-3">
              <div className="form-check abc-checkbox">
                <input
                  id="to_record"
                  onChange={this.handleChange}
                  checked={entity.to_record}
                  className="form-check-input"
                  type="checkbox"
                />
                <label className="form-check-label" htmlFor="to_record">
                  {" "}
                  {T.translate("edit_event.to_record")}{" "}
                </label>
              </div>
            </div>
          )}
          {this.isEventType(EVENT_TYPE_PRESENTATION) &&
            this.isQuestionAllowed(ATTENDING_MEDIA) && (
              <div className="col-md-3">
                <div className="form-check abc-checkbox">
                  <input
                    id="attending_media"
                    onChange={this.handleChange}
                    checked={entity.attending_media}
                    className="form-check-input"
                    type="checkbox"
                  />
                  <label className="form-check-label" htmlFor="attending_media">
                    {" "}
                    {T.translate("edit_event.attending_media")}{" "}
                  </label>
                </div>
              </div>
            )}
          {this.isEventType(EVENT_TYPE_PRESENTATION) && (
            <div className="col-md-3">
              <div className="form-check abc-checkbox">
                <input
                  id="disclaimer_accepted"
                  onChange={this.handleChange}
                  checked={entity.disclaimer_accepted}
                  className="form-check-input"
                  type="checkbox"
                />
                <label
                  className="form-check-label"
                  htmlFor="disclaimer_accepted"
                >
                  {" "}
                  {T.translate("edit_event.disclaimer_accepted")}{" "}
                </label>
              </div>
            </div>
          )}
        </div>
        <hr />
        <div className="row form-group">
          <div className="col-md-12">
            <label> {T.translate("edit_event.tags")} </label>
            <TagInput
              id="tags"
              value={entity.tags}
              summitId={currentSummit.id}
              onChange={this.handleChange}
              error={hasErrors("tags", errors)}
            />
          </div>
        </div>
        {this.isEventType(EVENT_TYPE_PRESENTATION) && entity.id > 0 && (
          <div className="row form-group">
            <div className="col-md-12">
              <label>
                {" "}
                {T.translate("edit_event.qa_users")}{" "}
                <i
                  title={T.translate("edit_event.qa_users_info")}
                  className="fa fa-info-circle"
                />
              </label>
              <MemberInput
                id="qa_users"
                value={entity.qa_users}
                onChange={this.handleQAuserChange}
                error={hasErrors("qa_users", errors)}
                getOptionLabel={this.getQAUsersOptionLabel}
                multi
              />
            </div>
          </div>
        )}
        {this.shouldShowField("use_sponsors") && (
          <div className="row form-group">
            <div className="col-md-8">
              <label> {T.translate("edit_event.sponsors")} </label>
              <CompanyInput
                id="sponsors"
                value={entity.sponsors}
                onChange={this.handleChange}
                summitId={currentSummit.id}
                multi
              />
            </div>
            <div className="col-md-4">
              <div
                className="form-check abc-checkbox"
                style={{ marginTop: 30 }}
              >
                <input
                  id="show_sponsors"
                  onChange={this.handleChange}
                  checked={entity.show_sponsors}
                  className="form-check-input"
                  type="checkbox"
                />
                <label className="form-check-label" htmlFor="show_sponsors">
                  {" "}
                  {T.translate("edit_event.show_sponsors")}{" "}
                </label>
              </div>
            </div>
          </div>
        )}
        {this.shouldShowField("use_speakers") && (
          <>
            <div className="row form-group">
              <div className="col-md-10">
                <label> {T.translate("general.speakers")} *</label>
                <SpeakerInput
                  id="speaker"
                  value={speakerToAdd}
                  onChange={this.handleSelectSpeakerToAdd}
                  isClearable
                  placeholder={T.translate("edit_event.select_speaker")}
                  getOptionLabel={(speaker) =>
                    `${speaker.first_name} ${speaker.last_name} (${speaker.email})`
                  }
                />
              </div>
              <div className="col-md-2" style={{ marginTop: 25 }}>
                <button
                  className="btn btn-primary pull-right left-space"
                  onClick={this.handleSpeakerAssign}
                >
                  {T.translate("edit_event.assign_speaker")}
                </button>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                {entity?.speakers?.length > 0 ? (
                  <SortableTable
                    options={speakers_options}
                    data={entity?.speakers}
                    columns={speakers_columns}
                    dropCallback={this.handleSpeakersReordering}
                    orderField="order"
                  />
                ) : (
                  <div>{T.translate("edit_event.no_speakers")}</div>
                )}
              </div>
            </div>
            <div className="row">&nbsp;</div>
          </>
        )}
        {this.shouldShowField("use_moderator") && (
          <div className="row form-group">
            <div className="col-md-12">
              <label> {T.translate("edit_event.moderator")} </label>
              <SpeakerInput
                id="moderator"
                value={entity?.moderator}
                onChange={this.handleChange}
                history={history}
                isClearable
                getOptionLabel={(speaker) =>
                  `${speaker.first_name} ${speaker.last_name} (${speaker.email})`
                }
              />
            </div>
          </div>
        )}
        {this.isEventType(EVENT_TYPE_FISHBOWL) && (
          <div className="row form-group">
            <div className="col-md-12">
              <label> {T.translate("edit_event.discussion_leader")} </label>
              <SpeakerInput
                id="moderator"
                value={entity.moderator}
                onChange={this.handleChange}
                history={history}
                isClearable
              />
            </div>
          </div>
        )}
        {this.isEventType(EVENT_TYPE_GROUP_EVENTS) && (
          <div className="row form-group">
            <div className="col-md-12">
              <label> {T.translate("edit_event.groups")} </label>
              <GroupInput
                id="groups"
                value={entity.groups}
                onChange={this.handleChange}
                summitId={currentSummit.id}
                multi
              />
            </div>
          </div>
        )}
        {actionTypes?.length > 0 &&
          entity.id > 0 &&
          entity.selection_plan_id > 0 && (
            <div>
              <label>Status</label>
              <ProgressFlags
                flags={entity.actions}
                actionTypes={actionTypes}
                onChange={this.props.onFlagChange}
                eventId={entity.id}
                selectionPlanId={entity.selection_plan_id}
              />
            </div>
          )}

        {this.shouldShowField("allows_attachment") && (
          <div className="row form-group">
            <div className="col-md-12">
              <label> {T.translate("edit_event.attachment")} </label>
              <UploadInput
                value={entity.attachment}
                handleUpload={this.handleUploadFile}
                handleRemove={() => this.handleRemoveFile("attachment")}
                className="dropzone col-md-6"
                multiple={this.props.multi}
                accept="image/*"
              />
            </div>
          </div>
        )}
        <div className="row form-group">
          <div className="col-md-12">
            <label> {T.translate("edit_event.pic")} </label>
            <UploadInput
              value={entity.image}
              handleUpload={this.handleUploadPic}
              handleRemove={() => this.handleRemoveFile("image")}
              className="dropzone col-md-6"
              multiple={false}
              accept="image/*"
            />
          </div>
        </div>
        <Panel
          show={showSection === "live"}
          title={T.translate("edit_event.live")}
          handleClick={this.toggleSection.bind(this, "live")}
        >
          <div className="row form-group">
            <div className="col-md-6">
              <div className="form-group">
                <label>
                  {T.translate("edit_event.streaming_url")}&nbsp;
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate("edit_event.streaming_url_info")}
                  />
                </label>
                <input
                  className="form-control"
                  id="streaming_url"
                  value={entity.streaming_url}
                  onChange={this.handleChange}
                />
              </div>
              <div className="form-group">
                <label>
                  {" "}
                  {T.translate("edit_event.meeting_url")}&nbsp;
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate("edit_event.meeting_url_info")}
                  />
                </label>
                <input
                  className="form-control"
                  id="meeting_url"
                  value={entity.meeting_url}
                  onChange={this.handleChange}
                />
              </div>
              <div className="form-group">
                <label> {T.translate("edit_event.etherpad_link")} </label>
                <input
                  className="form-control"
                  id="etherpad_link"
                  value={entity.etherpad_link}
                  onChange={this.handleChange}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div>
                <label> {T.translate("edit_event.streaming_type")}</label>
                <Dropdown
                  id="streaming_type"
                  value={entity.streaming_type}
                  onChange={this.handleChange}
                  options={streaming_type_ddl}
                  error={hasErrors("streaming_type", errors)}
                />
              </div>
            </div>
            <div className="col-md-3 checkboxes-div">
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="stream_is_secure"
                  checked={entity.stream_is_secure}
                  onChange={this.handleChange}
                  className="form-check-input"
                />
                <label className="form-check-label" htmlFor="stream_is_secure">
                  {" "}
                  {T.translate("edit_event.stream_is_secure")}{" "}
                </label>
              </div>
            </div>
          </div>
        </Panel>
        <Panel
          show={showSection === "rsvp"}
          title={T.translate("edit_event.rsvp")}
          handleClick={this.toggleSection.bind(this, "rsvp")}
        >
          <div className="row form-group">
            <div className="col-md-4">
              <label> {T.translate("edit_event.head_count")} </label>
              <input
                className="form-control"
                type="number"
                id="head_count"
                value={entity.head_count}
                onChange={this.handleChange}
              />
            </div>
            <div className="col-md-4">
              <label> {T.translate("edit_event.rsvp_max_user_number")} </label>
              <input
                className="form-control"
                type="number"
                id="rsvp_max_user_number"
                value={entity.rsvp_max_user_number}
                onChange={this.handleChange}
              />
            </div>
            <div className="col-md-4">
              <label>
                {" "}
                {T.translate("edit_event.rsvp_max_user_wait_list_number")}{" "}
              </label>
              <input
                className="form-control"
                type="number"
                id="rsvp_max_user_wait_list_number"
                value={entity.rsvp_max_user_wait_list_number}
                onChange={this.handleChange}
              />
            </div>
          </div>
          <div className="row form-group">
            <div className="col-md-6">
              <label> {T.translate("edit_event.rsvp_link")} </label>
              <input
                className="form-control"
                id="rsvp_link"
                value={entity.rsvp_link}
                onChange={this.handleChange}
              />
            </div>
            <div className="col-md-6">
              <label> {T.translate("edit_event.rsvp_template")} </label>
              <Dropdown
                id="rsvp_template_id"
                value={entity.rsvp_template_id}
                onChange={this.handleChange}
                placeholder={T.translate(
                  "edit_event.placeholders.select_rsvp_template"
                )}
                options={rsvp_templates_ddl}
                clearable
              />
            </div>
          </div>
        </Panel>
        {entity.id != 0 && this.isEventType(EVENT_TYPE_PRESENTATION) && (
          <Panel
            show={showSection === "materials"}
            title={T.translate("edit_event.materials")}
            handleClick={this.toggleSection.bind(this, "materials")}
          >
            <button
              className="btn btn-primary pull-right left-space"
              onClick={this.handleNewMaterial}
            >
              {T.translate("edit_event.add_material")}
            </button>
            <Table
              options={material_options}
              data={entity.materials}
              columns={material_columns}
            />
          </Panel>
        )}

        {entity.id !== 0 &&
          entity.selection_plan?.extra_questions?.length > 0 && (
            <Panel
              show={showSection === "extra_questions"}
              title={T.translate("edit_event.extra_questions")}
              handleClick={this.toggleSection.bind(this, "extra_questions")}
            >
              <ExtraQuestionsForm
                extraQuestions={entity.selection_plan.extra_questions.sort(
                  (a, b) => a.order - b.order
                )}
                userAnswers={entity.extra_questions}
                onAnswerChanges={this.handleChangeExtraQuestion}
                ref={this.formRef}
                className="extra-questions"
              />
            </Panel>
          )}

        {entity.id !== 0 && entity.allow_feedback && (
          <Panel
            show={showSection === "feedback"}
            title={T.translate("edit_event.feedback")}
            handleClick={this.toggleSection.bind(this, "feedback")}
          >
            <div className="row">
              <div className="col-md-6">
                <FreeTextSearch
                  value={feedbackState.term ?? ""}
                  placeholder={T.translate(
                    "edit_event.placeholders.search_feedback"
                  )}
                  title={T.translate("edit_event.placeholders.search_feedback")}
                  onSearch={this.handleFeedbackSearch}
                  preventEvents
                />
              </div>
              <div className="col-md-6 text-right">
                <button
                  className="btn btn-default right-space"
                  onClick={this.handleFeedbackExport}
                >
                  {T.translate("general.export")}
                </button>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <Table
                  options={feedback_table_options}
                  data={feedbackState.items}
                  columns={feedback_columns}
                  onSort={this.handleFeedbackSort}
                />
                <Pagination
                  bsSize="medium"
                  prev
                  next
                  first
                  last
                  ellipsis
                  boundaryLinks
                  maxButtons={10}
                  items={feedbackState.lastPage}
                  activePage={feedbackState.currentPage}
                  onSelect={this.handleFeedbackPageChange}
                />
              </div>
            </div>
          </Panel>
        )}

        <Panel
          show={showSection === "audit_log"}
          title={T.translate("audit_log.title")}
          handleClick={this.toggleSection.bind(this, "audit_log")}
        >
          <AuditLogs
            entityFilter={[
              `event_id==${entity.id}`,
              "class_name==SummitEventAuditLog"
            ]}
          />
        </Panel>
        {entity.id !== 0 && (
          <Panel
            show={showSection === "track_chair_statistics"}
            title={T.translate("edit_event.track_chair_statistics")}
            handleClick={this.toggleSection.bind(
              this,
              "track_chair_statistics"
            )}
          >
            <div className="row">
              <div className="col-md-6">
                <p>
                  <label>
                    <i className="fa fa-thumbs-up" />{" "}
                    {T.translate("edit_event.selections")}:
                  </label>
                  &nbsp;{entity.selectors_count ? entity.selectors_count : 0}
                </p>
                <p>
                  <label>
                    <i className="fa fa-eye" />{" "}
                    {T.translate("edit_event.interested")}:
                  </label>
                  &nbsp;{entity.likers_count ? entity.likers_count : 0}
                </p>
                <p>
                  <label>
                    <i className="fa fa-thumbs-down" />{" "}
                    {T.translate("edit_event.no_thanks")}:
                  </label>
                  &nbsp;{entity.passers_count ? entity.passers_count : 0}
                </p>
                <p>
                  <label>
                    <i className="fa fa-star" />{" "}
                    {T.translate("edit_event.popularity_score")}:
                  </label>
                  &nbsp;{entity.popularity_score ? entity.popularity_score : 0}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <label>
                    {T.translate("edit_event.average_score")}:&nbsp;
                  </label>
                  {entity.track_chair_avg_score
                    ? entity.track_chair_avg_score
                    : 0}
                </p>
                {entity.hasOwnProperty("track_chair_scores_avg") &&
                  entity.track_chair_scores_avg.map((score) => {
                    const rating_type =
                      entity?.selection_plan?.track_chair_rating_types.find(
                        (e) => parseInt(score.ranking_type_id) === e.id
                      );
                    if (!rating_type) return null;
                    return (
                      <p>
                        <label>
                          {rating_type?.score_types?.length > 0 && (
                            <>
                              <a
                                data-tooltip-html={this.getPopupScores(
                                  score.ranking_type_id
                                )}
                                data-tooltip-id="help"
                              >
                                <Tooltip
                                  id="help"
                                  place="bottom"
                                  multiline
                                  clickable
                                  border="1px solid black"
                                  variant="light"
                                />
                                <i className="fa fa-question-circle" />
                              </a>
                              &nbsp;
                            </>
                          )}
                          {rating_type?.name}:
                        </label>{" "}
                        {parseFloat(score.avg_score).toFixed(DECIMAL_DIGITS)}
                      </p>
                    );
                  })}
                <p>
                  <label>
                    <i className="fa fa-trophy" />{" "}
                    {T.translate("edit_event.community_vote")}:
                  </label>
                  &nbsp;
                  {entity.vote_average
                    ? entity.vote_average.toFixed(DECIMAL_DIGITS)
                    : "0.00"}
                </p>
              </div>
            </div>
          </Panel>
        )}
        {entity.id !== 0 && (
          <Panel
            show={showSection === "track_chair_comments"}
            title={T.translate("edit_event.track_chair_comments")}
            handleClick={this.toggleSection.bind(this, "track_chair_comments")}
          >
            <div className="row">
              <div className="col-md-8">
                <FreeTextSearch
                  value={commentState.term ?? ""}
                  placeholder={T.translate(
                    "edit_event.placeholders.search_comment"
                  )}
                  onSearch={this.handleTrackChairCommentSearch}
                />
              </div>

              <div className="col-md-6">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={this.state.commentFilters.is_public}
                    onChange={this.handleTrackChairFilterChange}
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor="is_public">
                    {" "}
                    {T.translate("edit_event.is_public")}{" "}
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="is_activity"
                    checked={this.state.commentFilters.is_activity}
                    onChange={this.handleTrackChairFilterChange}
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor="is_activity">
                    {" "}
                    {T.translate("edit_event.is_activity")}{" "}
                  </label>
                </div>
              </div>

              {commentState.comments.length === 0 && (
                <div>{T.translate("edit_event.no_comments")}</div>
              )}

              {commentState.comments.length > 0 && (
                <div className="col-md-12">
                  <Table
                    options={track_chair_comments_options}
                    data={commentState.comments}
                    columns={track_chair_comments_columns}
                    onSort={this.handleTrackChairCommentSort}
                  />
                  <Pagination
                    bsSize="medium"
                    prev
                    next
                    first
                    last
                    ellipsis
                    boundaryLinks
                    maxButtons={10}
                    items={commentState.lastPage}
                    activePage={commentState.currentPage}
                    onSelect={this.handleTrackChairCommentPageChange}
                  />
                </div>
              )}
            </div>
          </Panel>
        )}

        <Panel
          show={showSection === "schedule_settings"}
          title={T.translate("edit_event.schedule_settings")}
          handleClick={this.toggleSection.bind(this, "schedule_settings")}
        >
          <div className="row">
            <div className="col-md-4">
              <label> {T.translate("edit_event.allowed_ticket_types")}</label>
              <TicketTypesInput
                id="allowed_ticket_types"
                value={entity?.allowed_ticket_types}
                placeholder={T.translate(
                  "edit_event.placeholders.allowed_ticket_types"
                )}
                summitId={currentSummit.id}
                onChange={this.handleChange}
                version="v2"
                defaultOptions
                optionsLimit={100}
                isMulti
              />
            </div>
          </div>
        </Panel>

        <div className="row">
          <div className="col-md-12 submit-buttons">
            {!entity.is_published && (
              <div>
                <input
                  type="button"
                  onClick={(ev) => this.triggerFormSubmit(ev, false)}
                  className="btn btn-primary pull-right"
                  value={T.translate("general.save")}
                />
                <input
                  type="button"
                  onClick={(ev) => this.triggerFormSubmit(ev, true)}
                  className="btn btn-success pull-right"
                  value={T.translate("general.save_and_publish")}
                />
              </div>
            )}

            {entity.is_published && (
              <div>
                <input
                  type="button"
                  onClick={(ev) => this.triggerFormSubmit(ev, true)}
                  className="btn btn-success pull-right"
                  value={T.translate("general.save_and_publish")}
                />
                <input
                  type="button"
                  onClick={(ev) => this.handleUnpublish(ev)}
                  className="btn btn-danger pull-right"
                  value={T.translate("edit_event.unpublish")}
                />
                <input
                  type="button"
                  onClick={this.handleScheduleLink.bind(this)}
                  className="btn btn-default pull-left"
                  value={T.translate("edit_event.go_to_calendar")}
                />
                <input
                  type="button"
                  onClick={this.handleEventLink.bind(this)}
                  disabled={!currentSummit.virtual_site_url}
                  className="btn btn-default pull-left"
                  value={T.translate("edit_event.view_event")}
                />
              </div>
            )}

            {entity.id !== 0 && (
              <div>
                <input
                  type="button"
                  onClick={(ev) => this.handleCloneEvent(ev, true)}
                  className="btn btn-default pull-right"
                  value={T.translate("general.clone")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default EventForm;
