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
import moment from "moment-timezone";
import { Tooltip } from "react-tooltip";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import GroupedDropdown from "openstack-uicore-foundation/lib/components/inputs/grouped-dropdown";
import DateTimePicker from "openstack-uicore-foundation/lib/components/inputs/datetimepicker";
import TagInput from "openstack-uicore-foundation/lib/components/inputs/tag-input";
import SpeakerInput from "openstack-uicore-foundation/lib/components/inputs/speaker-input";
import CompanyInput from "openstack-uicore-foundation/lib/components/inputs/company-input";
import GroupInput from "openstack-uicore-foundation/lib/components/inputs/group-input";
import UploadInput from "openstack-uicore-foundation/lib/components/inputs/upload-input";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input";
import Panel from "openstack-uicore-foundation/lib/components/sections/panel";
import Table from "openstack-uicore-foundation/lib/components/table";
import MemberInput from "openstack-uicore-foundation/lib/components/inputs/member-input";
import FreeTextSearch from "openstack-uicore-foundation/lib/components/free-text-search";
import TicketTypesInput from "openstack-uicore-foundation/lib/components/inputs/ticket-types-input";
import SortableTable from "openstack-uicore-foundation/lib/components/table-sortable";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
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
  DEFAULT_REOPEN_HOURS,
  EVENT_TYPE_FISHBOWL,
  EVENT_TYPE_GROUP_EVENTS,
  EVENT_TYPE_PRESENTATION,
  MILLISECONDS_TO_SECONDS,
  ONE_MINUTE,
  REOPEN_PRESET_HOURS_48,
  REOPEN_PRESET_HOURS_72,
  RSVP_TYPE_NONE,
  RSVP_TYPE_PRIVATE,
  RSVP_TYPE_PUBLIC
} from "../../utils/constants";
import CopyClipboard from "../buttons/copy-clipboard";
import EventRsvpList from "../rsvp/event-rsvp-list";
import EventRsvpInvitationList from "../rsvp/event-rsvp-invitation-list";
import showConfirmDialog from "../mui/showConfirmDialog";
import {
  buildRecipientRows,
  toNotifyPayload,
  ROLE
} from "../../models/reopen-notification-recipients";

const REOPEN_DEADLINE_FORMAT = "MMMM DD, YYYY h:mm a";

const ROLE_LABEL = {
  [ROLE.SUBMITTER]: "edit_event.notify_role_submitter",
  [ROLE.MODERATOR]: "edit_event.notify_role_moderator",
  [ROLE.SPEAKER]: "edit_event.notify_role_speaker"
};

class EventForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      speakerToAdd: null,
      entity: { ...props.entity },
      showSection: "main",
      errors: props.errors,
      publish: false,
      commentFilters: { ...props.commentState.filters },
      reopenHours: DEFAULT_REOPEN_HOURS,
      reopenCustomHours: "",
      // Transient and per-form by design: there is no server-side record of who was
      // notified last time, so remembering a selection would assert more than the
      // backend can back up. Empty on mount, emptied again after a successful send.
      notifyChecked: []
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
    this.handleRSVPTypeChange = this.handleRSVPTypeChange.bind(this);
    this.handleSaveIncomplete = this.handleSaveIncomplete.bind(this);
    this.handleReopenSubmission = this.handleReopenSubmission.bind(this);
    this.handleCloseSubmission = this.handleCloseSubmission.bind(this);
    this.handleNotifySpeakers = this.handleNotifySpeakers.bind(this);
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

  handleRSVPTypeChange(ev) {
    const { entity } = this.state;
    const { onUpdate } = this.props;
    const newEntity = { ...entity };
    const { value, id } = ev.target;

    newEntity[id] = value;
    this.setState({ entity: newEntity }, () => {
      if (newEntity.id) onUpdate({ [id]: value });
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

  handleSaveIncomplete(ev) {
    ev.preventDefault();
    const { onSaveIncomplete } = this.props;
    const { entity } = this.state;
    onSaveIncomplete({ ...entity });
  }

  isPresentation() {
    const { entity } = this.state;
    return entity.class_name === "Presentation";
  }

  // entity from state, not props: handleChangeSelectionPlan writes the plan into
  // state without saving, so props would judge a plan the form is not showing.
  isReopenApplicable() {
    const { selectionPlansOpts } = this.props;
    const { entity } = this.state;
    const plan = selectionPlansOpts?.find(
      (sp) => sp.id === entity.selection_plan_id
    );
    if (!plan || plan.is_enabled === false || !plan.submission_end_date) {
      return false;
    }
    return moment().unix() > plan.submission_end_date;
  }

  // Title and section body must share this gate: a grant whose plan window was
  // since extended is no longer the operative deadline.
  isReopenSectionVisible() {
    const { entity } = this.state;
    return (
      this.isPresentation() &&
      !this.isNew() &&
      entity.selection_plan_id > 0 &&
      this.isReopenApplicable()
    );
  }

  isSubmissionReopened() {
    const deadline = this.getReopenDeadline();
    return !!deadline?.isAfter(moment());
  }

  getReopenDeadline() {
    const { currentSummit } = this.props;
    const { entity } = this.state;
    // normalizeEventResponse coerces server nulls to "", so "" means no grant.
    if (!entity.submission_reopened_until) return null;
    return epochToMomentTimeZone(
      entity.submission_reopened_until,
      currentSummit.time_zone_id
    );
  }

  getMaterialsPanelTitle() {
    if (!this.isReopenSectionVisible() || !this.isSubmissionReopened()) {
      return T.translate("edit_event.materials");
    }
    return T.translate("edit_event.materials_reopened", {
      deadline: this.getReopenDeadline().format(REOPEN_DEADLINE_FORMAT)
    });
  }

  // Mirrors the server's CFP_MAX_REOPEN_HOURS so an over-ceiling value is caught
  // before the confirm dialog rather than by the 412 after it. dotenv values are
  // strings, hence the coercion. Unset means uncapped: the server's 412 stays the
  // authoritative ceiling, so a deployment that never sets this behaves as before.
  getMaxReopenHours() {
    return Number(window.CFP_MAX_REOPEN_HOURS) || 0;
  }

  getSelectedReopenHours() {
    const { reopenHours, reopenCustomHours } = this.state;
    const raw = String(
      reopenHours === "custom" ? reopenCustomHours : reopenHours
    ).trim();
    // Not parseInt: it reads "-1" as a truthy negative, and "1.5"/"1e3" as 1, which
    // would silently grant an hour instead of what the admin typed. Only a plain
    // positive integer is a valid window.
    if (!/^\d+$/.test(raw) || Number(raw) <= 0) return 0;
    const hours = Number(raw);
    // Uncapped, a digit-only value can still overflow moment: the deadline comes back NaN,
    // which epochToMomentTimeZone passes through unwrapped, so the confirm dialog throws.
    if (!moment().add(hours, "hours").isValid()) return 0;
    const max = this.getMaxReopenHours();
    // Applied to the presets too, not just the custom entry, so a ceiling
    // configured below 72 can't offer a preset the server would refuse.
    return max && hours > max ? 0 : hours;
  }

  async handleReopenSubmission() {
    const { currentSummit, onReopenSubmission } = this.props;
    const { entity } = this.state;
    const hours = this.getSelectedReopenHours();
    if (!hours) return;

    // Deliberately optimistic: the deadline shown here is computed client-side for the
    // confirm copy only. The server derives the real one. They agree to within the
    // round trip, and naming it is what stops an admin pasting a link that will
    // quietly go read-only (the CFP route hard-gates on the live grant).
    const deadline = epochToMomentTimeZone(
      moment().add(hours, "hours").unix(),
      currentSummit.time_zone_id
    ).format(REOPEN_DEADLINE_FORMAT);

    const confirmed = await showConfirmDialog({
      title: T.translate("edit_event.reopen_confirm_title"),
      text: T.translate("edit_event.reopen_confirm_text", { deadline }),
      iconType: "warning",
      confirmButtonText: T.translate("edit_event.reopen_submission")
    });

    // snackbarErrorHandler has already put the API message in front of the admin, and an
    // over-ceiling hours value is an expected 412 rather than a fault. Swallow the
    // rejection so it doesn't reach Sentry as an unhandled one.
    if (confirmed) onReopenSubmission(entity.id, hours)?.catch(() => {});
  }

  async handleCloseSubmission() {
    const { onCloseSubmission } = this.props;
    const { entity } = this.state;

    const confirmed = await showConfirmDialog({
      title: T.translate("edit_event.close_submission_confirm_title"),
      text: T.translate("edit_event.close_submission_confirm_text"),
      iconType: "warning",
      confirmButtonText: T.translate("edit_event.close_submission"),
      confirmButtonColor: "error"
    });

    // See handleReopenSubmission: the error is already surfaced, so don't let the
    // rejection escape as an unhandled one.
    if (confirmed) onCloseSubmission(entity.id)?.catch(() => {});
  }

  // Persisted entity, not the editable one: `include_submitter` carries no identity,
  // so the server resolves it from the SAVED creator. Deriving rows from unsaved form
  // state would let the list name one person while the send reaches another.
  // Persisted entity, not the editable one: `include_submitter` carries no identity,
  // so the server resolves it from the SAVED creator. Deriving rows from unsaved form
  // state would let the list name one person while the send reaches another.
  getRecipientRows() {
    const { entity } = this.props;
    return buildRecipientRows(entity);
  }

  toggleNotifyRecipient(key) {
    this.setState((prev) => ({
      notifyChecked: prev.notifyChecked.includes(key)
        ? prev.notifyChecked.filter((k) => k !== key)
        : [...prev.notifyChecked, key]
    }));
  }

  async handleNotifySpeakers() {
    const { onNotifySubmissionReopened } = this.props;
    const { entity, notifyChecked } = this.state;

    const rows = this.getRecipientRows();
    const checked = rows.filter(
      (row) => !row.disabled && notifyChecked.includes(row.key)
    );
    if (checked.length === 0) return;

    const submitterAtConfirm = this.props.entity?.created_by?.id ?? null;

    const confirmed = await showConfirmDialog({
      title: T.translate("edit_event.notify_speakers_confirm_title", {
        count: checked.length
      }),
      text: T.translate("edit_event.notify_speakers_confirm_text", {
        deadline: this.getReopenDeadline().format(REOPEN_DEADLINE_FORMAT),
        names: checked.map((row) => row.name).join(", ")
      }),
      iconType: "warning",
      confirmButtonText: T.translate("edit_event.notify_speakers")
    });

    if (!confirmed) return;

    // Intersection, not replacement. `intended` is what the admin saw and ticked;
    // `current` is what is still valid after any refresh that landed while the
    // dialog was open. Intersecting can only ever shrink the CHANNEL set: a row
    // that split away drops out via `current`, and a row that newly merged in
    // cannot add anyone via `intended`.
    const intended = toNotifyPayload(rows, notifyChecked);
    const current = toNotifyPayload(this.getRecipientRows(), notifyChecked);
    // The submitter channel is a bare boolean, so unlike speakerIds it carries no
    // identity and cannot be intersected on one. Pin it explicitly: if the persisted
    // creator changed while the dialog was open, the boolean would silently denote
    // someone the dialog never named.
    const submitterUnchanged =
      (this.props.entity?.created_by?.id ?? null) === submitterAtConfirm;
    const payload = {
      speakerIds: intended.speakerIds.filter((id) =>
        current.speakerIds.includes(id)
      ),
      includeSubmitter:
        intended.includeSubmitter &&
        current.includeSubmitter &&
        submitterUnchanged
    };
    // No request when the intersection emptied the selection: the client already
    // knows there is nothing to send, and the endpoint that would reject it does
    // not exist yet, so relying on its 412 would be relying on an untested contract.
    if (payload.speakerIds.length === 0 && !payload.includeSubmitter) return;

    // See handleReopenSubmission: snackbarErrorHandler has already surfaced the
    // API's message and an expired-window 412 is expected, so don't let the
    // rejection escape as an unhandled one.
    onNotifySubmissionReopened(entity.id, payload)
      ?.then(() => {
        // Cleared rather than retained so a second press is a deliberate
        // re-selection, not a repeat of whatever was ticked a moment ago.
        this.setState({ notifyChecked: [] });
      })
      ?.catch(() => {});
  }

  isNew() {
    const { entity } = this.state;
    return !entity.id;
  }

  isComplete() {
    const { entity } = this.state;
    return (
      ["Accepted", "Received"].includes(entity?.status) &&
      entity?.progress === "COMPLETE"
    );
  }

  getMissingDraftFields() {
    const { entity } = this.state;
    const missing = [];

    if (!entity.title) missing.push("Title");
    if (!entity.type_id) missing.push("Activity Type");
    if (!entity.track_id) missing.push("Activity Category");

    if (!entity.type_id || this.shouldShowField("allows_publishing_dates")) {
      if (!entity.start_date) missing.push("Start Date");
      if (!entity.end_date) missing.push("End Date");
      if (!entity.duration) missing.push("Duration");
    }

    if (!entity.type_id || this.isEventType(EVENT_TYPE_PRESENTATION)) {
      if (!entity.disclaimer_accepted) missing.push("Disclaimer Accepted");
    }

    return missing;
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
    const {
      entity,
      showSection,
      errors,
      speakerToAdd,
      reopenHours,
      reopenCustomHours,
      notifyChecked
    } = this.state;

    const maxReopenHours = this.getMaxReopenHours();

    const recipientRows = this.getRecipientRows();
    const notifySelection = toNotifyPayload(recipientRows, notifyChecked);
    // The button asks the same function that builds the payload whether there is
    // anything to send, so a checked key whose row has since disappeared or gone
    // disabled cannot leave an enabled button that does nothing.
    const canNotify =
      notifySelection.speakerIds.length > 0 || notifySelection.includeSubmitter;

    const {
      currentSummit,
      levelOpts,
      typeOpts,
      trackOpts,
      locationOpts,
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

    const venues = locationOpts
      .filter((v) => v.class_name === "SummitVenue")
      .map((l) => {
        let options = [];
        if (l.rooms) {
          options = l.rooms.map((r) => ({ label: r.name, value: r.id }));
        }
        return { label: l.name, value: l.id, options };
      });

    const locations_ddl = [{ label: "TBD", value: 0 }, ...venues];

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

    const rsvp_types_ddl = [
      {
        label: T.translate("edit_event.rsvp_type_none"),
        value: RSVP_TYPE_NONE
      },
      {
        label: T.translate("edit_event.rsvp_type_public"),
        value: RSVP_TYPE_PUBLIC
      },
      {
        label: T.translate("edit_event.rsvp_type_private"),
        value: RSVP_TYPE_PRIVATE
      }
    ];

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

    const missingDraftFields =
      !this.isPresentation() || this.isNew() || this.isComplete()
        ? []
        : this.getMissingDraftFields();

    const speakerDeepLink = `${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans/${entity.selection_plan_id}/presentations/${entity.id}/summary`;

    return (
      <div>
        <input type="hidden" id="id" value={entity.id} />
        {this.isPresentation() && !this.isNew() && !this.isComplete() && (
          <div className="alert alert-warning" role="alert">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8
              }}
            >
              <strong>{T.translate("edit_event.draft_state_label")}</strong>
              <span
                className="label label-warning"
                style={{
                  fontSize: "0.85em",
                  padding: "3px 8px",
                  borderRadius: 3
                }}
              >
                {T.translate("edit_event.draft_state_badge")}
              </span>
            </div>
            {missingDraftFields.length > 0 && (
              <p style={{ marginBottom: 6 }}>
                <strong>
                  {T.translate("edit_event.draft_state_missing_fields")}
                </strong>{" "}
                {missingDraftFields.join(", ")}
              </p>
            )}
            <p style={{ marginBottom: 0 }}>
              {T.translate("edit_event.draft_state_note")}
            </p>
          </div>
        )}
        <div className="row form-group">
          <div className="col-md-8">
            <label> {T.translate("edit_event.submitter")} </label> &nbsp;
            {entity?.created_by && (
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
            <TextEditorV3
              id="description"
              value={entity.description}
              onChange={this.handleChange}
              error={hasErrors("description", errors)}
              license={process.env.JODIT_LICENSE_KEY}
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
                <TextEditorV3
                  id="attendees_expected_learnt"
                  value={entity.attendees_expected_learnt}
                  onChange={this.handleChange}
                  license={process.env.JODIT_LICENSE_KEY}
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
              <GroupedDropdown
                id="location_id"
                value={entity.location_id}
                options={locations_ddl}
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
              <label> {T.translate("edit_event.rsvp_type")} </label>
              <Dropdown
                id="rsvp_type"
                value={entity.rsvp_type}
                onChange={this.handleRSVPTypeChange}
                placeholder={T.translate(
                  "edit_event.placeholders.select_rsvp_type"
                )}
                options={rsvp_types_ddl}
              />
            </div>
            {entity.rsvp_type !== RSVP_TYPE_NONE && (
              <>
                <div className="col-md-4">
                  <label>
                    {" "}
                    {T.translate("edit_event.rsvp_max_user_number")}{" "}
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_event.rsvp_max_user_number_info"
                      )}
                    />
                  </label>
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
                    {T.translate(
                      "edit_event.rsvp_max_user_wait_list_number"
                    )}{" "}
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_event.rsvp_max_user_wait_list_number_info"
                      )}
                    />
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    id="rsvp_max_user_wait_list_number"
                    value={entity.rsvp_max_user_wait_list_number}
                    onChange={this.handleChange}
                  />
                </div>
              </>
            )}
          </div>
          {entity.rsvp_type !== RSVP_TYPE_NONE && (
            <>
              {entity.rsvp_type === RSVP_TYPE_PRIVATE && (
                <div className="row form-group">
                  <div className="col-md-12">
                    <EventRsvpInvitationList
                      rsvpTemplateOpts={rsvpTemplateOpts}
                    />
                  </div>
                </div>
              )}
              <div className="row form-group">
                <div className="col-md-12">
                  <EventRsvpList currentEvent={entity?.id} history={history} />
                </div>
              </div>
            </>
          )}
        </Panel>
        {entity.id != 0 && this.isEventType(EVENT_TYPE_PRESENTATION) && (
          <Panel
            id="materials"
            show={showSection === "materials"}
            title={this.getMaterialsPanelTitle()}
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
            {this.isReopenSectionVisible() && (
              <div className="row form-group">
                <div className="col-md-12">
                  {!this.isSubmissionReopened() && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <label htmlFor="reopen_hours">
                        {T.translate("edit_event.reopen_duration")}
                      </label>
                      <select
                        id="reopen_hours"
                        className="form-control"
                        style={{ width: "auto" }}
                        value={reopenHours}
                        onChange={(ev) =>
                          this.setState({ reopenHours: ev.target.value })
                        }
                      >
                        <option value={DEFAULT_REOPEN_HOURS}>
                          {T.translate("edit_event.reopen_duration_24")}
                        </option>
                        <option value={REOPEN_PRESET_HOURS_48}>
                          {T.translate("edit_event.reopen_duration_48")}
                        </option>
                        <option value={REOPEN_PRESET_HOURS_72}>
                          {T.translate("edit_event.reopen_duration_72")}
                        </option>
                        <option value="custom">
                          {T.translate("edit_event.reopen_duration_custom")}
                        </option>
                      </select>
                      {reopenHours === "custom" && (
                        <>
                          <label htmlFor="reopen_custom_hours">
                            {maxReopenHours
                              ? T.translate(
                                  "edit_event.reopen_custom_hours_capped",
                                  { max: maxReopenHours }
                                )
                              : T.translate("edit_event.reopen_custom_hours")}
                          </label>
                          <input
                            id="reopen_custom_hours"
                            type="number"
                            min="1"
                            max={maxReopenHours || undefined}
                            className="form-control"
                            style={{ width: 120 }}
                            value={reopenCustomHours}
                            onChange={(ev) =>
                              this.setState({
                                reopenCustomHours: ev.target.value
                              })
                            }
                          />
                        </>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!this.getSelectedReopenHours()}
                        onClick={this.handleReopenSubmission}
                      >
                        {T.translate("edit_event.reopen_submission")}
                      </button>
                    </div>
                  )}
                  {this.isSubmissionReopened() && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap"
                      }}
                    >
                      <span>
                        {T.translate("edit_event.reopened_until", {
                          deadline: this.getReopenDeadline().format(
                            REOPEN_DEADLINE_FORMAT
                          )
                        })}
                      </span>
                      {entity.submission_reopened_by && (
                        <span>
                          {T.translate("edit_event.reopened_by", {
                            admin: `${entity.submission_reopened_by.first_name} ${entity.submission_reopened_by.last_name}`
                          })}
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={this.handleCloseSubmission}
                      >
                        {T.translate("edit_event.close_submission")}
                      </button>
                      {window.CFP_APP_BASE_URL && (
                        <span>
                          <label>
                            {T.translate("edit_event.reopen_deep_link_label")}
                          </label>
                          &nbsp;
                          <CopyClipboard text={speakerDeepLink} />
                          &nbsp;
                          {speakerDeepLink}
                        </span>
                      )}
                      <div style={{ flexBasis: "100%" }}>
                        <label>
                          {T.translate("edit_event.notify_recipients_label")}
                        </label>
                        {recipientRows.map((row) => (
                          <div
                            className="form-check abc-checkbox"
                            key={row.key}
                          >
                            <input
                              type="checkbox"
                              id={`notify_recipient_${row.key}`}
                              className="form-check-input"
                              disabled={row.disabled}
                              checked={notifyChecked.includes(row.key)}
                              onChange={() =>
                                this.toggleNotifyRecipient(row.key)
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`notify_recipient_${row.key}`}
                            >
                              {row.name}
                              &nbsp;-&nbsp;
                              {row.roles
                                .map((role) => T.translate(ROLE_LABEL[role]))
                                .join(", ")}
                            </label>
                            {row.disabled && (
                              <span>
                                &nbsp;
                                {T.translate("edit_event.notify_no_email")}
                              </span>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={!canNotify}
                          onClick={this.handleNotifySpeakers}
                        >
                          {T.translate("edit_event.notify_speakers")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                {entity.selection_plan &&
                  entity.hasOwnProperty("track_chair_scores_avg") &&
                  entity.track_chair_scores_avg.map((score) => {
                    const rating_type =
                      entity.selection_plan.track_chair_rating_types.find(
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
                  value={T.translate("edit_event.save_and_mark_complete")}
                />
                <input
                  type="button"
                  onClick={(ev) => this.triggerFormSubmit(ev, true)}
                  className="btn btn-success pull-right"
                  value={T.translate("general.save_and_publish")}
                />
                {this.isPresentation() &&
                  !this.isNew() &&
                  !this.isComplete() && (
                    <input
                      type="button"
                      onClick={this.handleSaveIncomplete}
                      className="btn btn-warning pull-right"
                      value={T.translate("edit_event.save_as_incomplete")}
                    />
                  )}
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
