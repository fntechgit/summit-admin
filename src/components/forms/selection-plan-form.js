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

import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import moment from "moment-timezone";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  queryTrackGroups,
  queryEventTypes
} from "openstack-uicore-foundation/lib/utils/query-actions";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input";
import MuiFormikDatepicker from "openstack-uicore-foundation/lib/components/mui/formik-inputs/datepicker";
import SimpleLinkList from "openstack-uicore-foundation/lib/components/simple-link-list";
import SortableTable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import Panel from "openstack-uicore-foundation/lib/components/sections/panel";
import Table from "openstack-uicore-foundation/lib/components/mui/table";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid2 from "@mui/material/Grid2";
import MuiSwitch from "@mui/material/Switch";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import { scrollToError, stripTags } from "../../utils/methods";
import EmailTemplateInput from "../inputs/email-template-input";
import ImportModal from "../inputs/import-modal";
import { PresentationTypeClassName } from "../../utils/constants";
import Many2ManyDropDown from "../inputs/many-2-many-dropdown";
import { querySelectionPlanExtraQuestions } from "../../actions/selection-plan-actions";
import { querySummitProgressFlags } from "../../actions/track-chair-actions";
import {
  DEFAULT_ALLOWED_EDITABLE_QUESTIONS,
  DEFAULT_ALLOWED_QUESTIONS,
  DEFAULT_CFP_PRESENTATION_EDITION_TABS
} from "../../reducers/selection_plans/selection-plan-reducer";

const DATE_FIELDS = [
  "submission_begin_date",
  "submission_end_date",
  "submission_lock_down_presentation_status_date",
  "voting_begin_date",
  "voting_end_date",
  "selection_begin_date",
  "selection_end_date"
];

const buildInitialValues = (entity, timezone) => {
  const values = { ...entity };
  DATE_FIELDS.forEach((field) => {
    values[field] = entity[field]
      ? epochToMomentTimeZone(entity[field], timezone)
      : null;
  });
  return values;
};

const SelectionPlanForm = (props) => {
  const {
    entity: propsEntity,
    errors: propsErrors,
    currentSummit,
    extraQuestionsOrderDir,
    extraQuestionsOrder,
    actionTypesOrderDir,
    actionTypesOrder,
    allowedMembers,
    onSaved,
    onSavingChange,
    onSubmit,
    saveSelectionPlanSettings,
    onTrackGroupLink,
    onTrackGroupUnLink,
    onAddEventType,
    onDeleteEventType,
    onAddRatingType,
    onEditRatingType,
    onDeleteRatingType,
    onEditExtraQuestion,
    onDeleteExtraQuestion,
    onAddNewExtraQuestion,
    onAssignExtraQuestion2SelectionPlan,
    onAssignProgressFlag2SelectionPlan,
    onUnassignProgressFlag,
    onUpdateProgressFlagOrder,
    onUpdateRatingTypeOrder,
    updateExtraQuestionOrder,
    onImportAllowedMembers,
    onAllowedMemberAdd,
    onAllowedMemberDelete,
    onAllowedMembersPageChange
  } = props;

  const [showSection, setShowSection] = useState("main");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFormikSubmit = (values) => {
    setIsSaving(true);
    if (onSavingChange) onSavingChange(true);

    const normalized = { ...values };
    DATE_FIELDS.forEach((field) => {
      if (values[field]) {
        normalized[field] = moment
          .tz(values[field], currentSummit.time_zone_id)
          .unix();
      } else {
        normalized[field] = 0;
      }
    });

    return onSubmit(normalized)
      .then((e) => {
        if (!e?.id) return null;
        return saveSelectionPlanSettings(values.marketing_settings, e.id).then(
          () => {
            if (onSaved) onSaved(e);
          }
        );
      })
      .catch(() => {
        // errors are surfaced via error handler
      })
      .finally(() => {
        setIsSaving(false);
        if (onSavingChange) onSavingChange(false);
      });
  };

  const formik = useFormik({
    initialValues: buildInitialValues(propsEntity, currentSummit.time_zone_id),
    onSubmit: handleFormikSubmit,
    enableReinitialize: true,
    validateOnChange: false
  });

  useEffect(() => {
    scrollToError(propsErrors);
    if (propsErrors && Object.keys(propsErrors).length > 0) {
      formik.setErrors(propsErrors);
    }
  }, [propsErrors]);

  const hasErrors = (field) => formik.errors[field] ?? "";

  const handleChange = (ev) => {
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (id.startsWith("cfp_")) {
      const current = formik.values.marketing_settings[id] || {};
      formik.setFieldValue(`marketing_settings.${id}`, { ...current, value });
    } else {
      formik.setFieldValue(id, value);
    }
  };

  const handleNotificationEmailTemplateChange = (ev) => {
    formik.setFieldValue(ev.target.id, ev.target.value);
  };

  const handleTrackGroupLink = (value) =>
    onTrackGroupLink(formik.values.id, value);
  const handleTrackGroupUnLink = (valueId) =>
    onTrackGroupUnLink(formik.values.id, valueId);
  const handleAddEventType = (value) => onAddEventType(formik.values.id, value);
  const handleDeleteEventType = (valueId) =>
    onDeleteEventType(formik.values.id, valueId);
  const handleAddRatingType = () => onAddRatingType();
  const handleEditRatingType = (ratingTypeId) => onEditRatingType(ratingTypeId);
  const handleDeleteRatingType = (ratingTypeId) =>
    onDeleteRatingType(ratingTypeId);
  const handleEditExtraQuestion = (questionId) =>
    onEditExtraQuestion(questionId);
  const handleDeleteExtraQuestion = (questionId) =>
    onDeleteExtraQuestion(questionId);
  const handleNewExtraQuestion = () => onAddNewExtraQuestion();
  const handleRemoveProgressFlag = (progressFlagId) =>
    onUnassignProgressFlag(progressFlagId);
  const handleDeleteAllowedMember = (valueId) =>
    onAllowedMemberDelete(formik.values.id, valueId);
  const handleAllowedMembersPageChange = (page) =>
    onAllowedMembersPageChange(formik.values.id, page);

  const handleAddAllowedMember = () =>
    onAllowedMemberAdd(formik.values.id, newMemberEmail);

  const handleImportAllowedMembers = (importFile) => {
    if (importFile) onImportAllowedMembers(formik.values.id, importFile);
    setShowImportModal(false);
  };

  const fetchSummitSelectionPlanExtraQuestions = (input, callback) => {
    if (!input) return Promise.resolve({ options: [] });
    querySelectionPlanExtraQuestions(currentSummit.id, input, callback);
  };

  const linkSummitSelectionPlanExtraQuestion = (question) => {
    onAssignExtraQuestion2SelectionPlan(
      currentSummit.id,
      formik.values.id,
      question.id
    );
  };

  const fetchSummitPresentationActionTypes = (input, callback) => {
    if (!input) return Promise.resolve({ options: [] });
    querySummitProgressFlags(currentSummit.id, input, callback);
  };

  const linkSummitProgressFlag = (progressFlag) => {
    onAssignProgressFlag2SelectionPlan(
      currentSummit.id,
      formik.values.id,
      progressFlag.id
    );
  };

  const handleOnSwitchChange = (setting, value) => {
    const current = formik.values.marketing_settings[setting] || {};
    formik.setFieldValue(`marketing_settings.${setting}`, {
      ...current,
      value
    });
  };

  const toggleSection = (section) => {
    setShowSection((prev) => (prev === section ? "main" : section));
  };

  const trackGroupsColumns = [
    { columnKey: "name", value: T.translate("edit_selection_plan.name") },
    {
      columnKey: "description",
      value: T.translate("edit_selection_plan.description")
    }
  ];

  const trackGroupsOptions = {
    valueKey: "name",
    labelKey: "name",
    defaultOptions: true,
    actions: {
      search: (input, callback) => {
        queryTrackGroups(currentSummit.id, input, callback);
      },
      delete: { onClick: handleTrackGroupUnLink },
      add: { onClick: handleTrackGroupLink }
    }
  };

  const eventTypesColumns = [
    { columnKey: "name", value: T.translate("edit_selection_plan.name") }
  ];

  const eventTypesOptions = {
    valueKey: "name",
    labelKey: "name",
    defaultOptions: true,
    actions: {
      search: (input, callback) => {
        queryEventTypes(
          currentSummit.id,
          input,
          callback,
          PresentationTypeClassName
        );
      },
      delete: { onClick: handleDeleteEventType },
      add: { onClick: handleAddEventType }
    }
  };

  const extraQuestionColumns = [
    {
      columnKey: "type",
      header: T.translate("order_extra_question_list.question_type")
    },
    {
      columnKey: "label",
      header: T.translate("order_extra_question_list.visible_question")
    },
    {
      columnKey: "name",
      header: T.translate("order_extra_question_list.question_id")
    }
  ];

  const extraQuestionsOptions = {
    sortCol: extraQuestionsOrder,
    sortDir: extraQuestionsOrderDir,
    actions: {
      edit: { onClick: handleEditExtraQuestion },
      delete: { onClick: handleDeleteExtraQuestion }
    }
  };

  const ratingTypesColumns = [
    { columnKey: "name", header: T.translate("rating_type_list.name") },
    { columnKey: "weight", header: T.translate("rating_type_list.weight") }
  ];

  const ratingTypesOptions = {
    actions: {
      edit: { onClick: handleEditRatingType },
      delete: { onClick: handleDeleteRatingType }
    }
  };

  const actionTypesColumns = [
    { columnKey: "label", header: T.translate("progress_flags.label") }
  ];

  const actionTypesOptions = {
    sortCol: actionTypesOrder,
    sortDir: actionTypesOrderDir,
    actions: {
      delete: { onClick: handleRemoveProgressFlag }
    }
  };

  const allowedMembersColumns = [
    { columnKey: "id", header: T.translate("edit_selection_plan.id") },
    { columnKey: "email", header: T.translate("edit_selection_plan.email") }
  ];

  const allowedMembersOptions = {
    sortCol: "email",
    sortDir: 1,
    actions: {
      delete: { onClick: handleDeleteAllowedMember }
    }
  };

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        className="selection-plan-form"
        onSubmit={formik.handleSubmit}
      >
        <input type="hidden" id="id" value={formik.values.id} />

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("edit_selection_plan.name")} *</label>
            <Input
              id="name"
              className="form-control"
              error={hasErrors("name")}
              onChange={handleChange}
              value={formik.values.name}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="is_enabled"
                  checked={formik.values.is_enabled}
                  onChange={handleChange}
                />
              }
              label={T.translate("edit_selection_plan.enabled")}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="is_hidden"
                  checked={formik.values.is_hidden}
                  onChange={handleChange}
                />
              }
              label={T.translate("edit_selection_plan.hidden")}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="allow_proposed_schedules"
                  checked={formik.values.allow_proposed_schedules}
                  onChange={handleChange}
                />
              }
              label={T.translate(
                "edit_selection_plan.allow_proposed_schedules"
              )}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }} sx={{ mt: "30px" }}>
            <FormControlLabel
              control={
                <Checkbox
                  id="allow_new_presentations"
                  checked={formik.values.allow_new_presentations}
                  onChange={handleChange}
                />
              }
              label={T.translate("edit_selection_plan.allow_new_presentations")}
            />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>
              {T.translate("edit_selection_plan.submission_begin_date")}
            </label>
            <MuiFormikDatepicker name="submission_begin_date" />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>
              {T.translate("edit_selection_plan.submission_end_date")}
            </label>
            <MuiFormikDatepicker name="submission_end_date" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label> {T.translate("edit_selection_plan.max_submissions")}</label>
            <Input
              className="form-control"
              type="number"
              error={hasErrors("max_submission_allowed_per_user")}
              id="max_submission_allowed_per_user"
              value={formik.values.max_submission_allowed_per_user}
              onChange={handleChange}
              min={0}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>
              {T.translate(
                "edit_selection_plan.submission_lock_down_presentation_status_date"
              )}{" "}
              &nbsp;
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate(
                  "edit_selection_plan.submission_lock_down_presentation_status_date_info"
                )}
              />
            </label>
            <MuiFormikDatepicker name="submission_lock_down_presentation_status_date" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>
              {T.translate("edit_selection_plan.voting_begin_date")}
            </label>
            <MuiFormikDatepicker name="voting_begin_date" />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>{T.translate("edit_selection_plan.voting_end_date")}</label>
            <MuiFormikDatepicker name="voting_end_date" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>
              {T.translate("edit_selection_plan.selection_begin_date")}
            </label>
            <MuiFormikDatepicker name="selection_begin_date" />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <label>
              {T.translate("edit_selection_plan.selection_end_date")}
            </label>
            <MuiFormikDatepicker name="selection_end_date" />
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12}>
            <label>
              {T.translate("edit_selection_plan.submission_period_disclaimer")}{" "}
              *
            </label>
            <TextEditorV3
              id="submission_period_disclaimer"
              value={formik.values.submission_period_disclaimer}
              onChange={handleChange}
              error={hasErrors("submission_period_disclaimer")}
              license={process.env.JODIT_LICENSE_KEY}
            />
          </Grid2>
        </Grid2>

        <hr />

        {formik.values.id !== 0 && (
          <>
            <Panel
              show={showSection === "track_groups"}
              title={T.translate("edit_selection_plan.track_groups")}
              handleClick={() => toggleSection("track_groups")}
            >
              <SimpleLinkList
                values={formik.values.track_groups}
                columns={trackGroupsColumns}
                options={trackGroupsOptions}
              />
            </Panel>

            <Panel
              show={showSection === "event_types"}
              title={T.translate("edit_selection_plan.event_types")}
              handleClick={() => toggleSection("event_types")}
            >
              <SimpleLinkList
                values={formik.values.event_types}
                columns={eventTypesColumns}
                options={eventTypesOptions}
              />
            </Panel>

            <Panel
              show={showSection === "extra_questions"}
              title={T.translate("edit_selection_plan.extra_questions")}
              handleClick={() => toggleSection("extra_questions")}
            >
              <Grid2 container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <Many2ManyDropDown
                    id="addAllowedExtraQuestions"
                    isClearable
                    CSSClass=""
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.link_question"
                    )}
                    fetchOptions={fetchSummitSelectionPlanExtraQuestions}
                    onAdd={linkSummitSelectionPlanExtraQuestion}
                  />
                </Grid2>
                <Grid2
                  size={{ xs: 12, md: 6 }}
                  sx={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleNewExtraQuestion}
                  >
                    {T.translate("edit_selection_plan.add_extra_questions")}
                  </Button>
                </Grid2>
              </Grid2>
              {formik.values.extra_questions.length === 0 && (
                <div>
                  {T.translate("edit_selection_plan.no_extra_questions")}
                </div>
              )}
              {formik.values.extra_questions.length > 0 && (
                <SortableTable
                  options={extraQuestionsOptions}
                  data={formik.values.extra_questions.map((q) => ({
                    ...q,
                    label: stripTags(q.label)
                  }))}
                  columns={extraQuestionColumns}
                  onReorder={updateExtraQuestionOrder}
                  updateOrderKey="order"
                />
              )}
            </Panel>

            <Panel
              show={showSection === "email_templates"}
              title={T.translate("edit_selection_plan.email_templates")}
              handleClick={() => toggleSection("email_templates")}
            >
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.creator_notification_email_template"
                    )}
                  </label>
                  <EmailTemplateInput
                    id="presentation_creator_notification_email_template"
                    value={
                      formik.values
                        .presentation_creator_notification_email_template
                    }
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.creator_notification_email_select_template"
                    )}
                    onChange={handleNotificationEmailTemplateChange}
                    isClearable
                    plainValue
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.moderator_notification_email_template"
                    )}
                  </label>
                  <EmailTemplateInput
                    id="presentation_moderator_notification_email_template"
                    value={
                      formik.values
                        .presentation_moderator_notification_email_template
                    }
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.moderator_notification_email_select_template"
                    )}
                    onChange={handleNotificationEmailTemplateChange}
                    isClearable
                    plainValue
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.speaker_notification_email_template"
                    )}
                  </label>
                  <EmailTemplateInput
                    id="presentation_speaker_notification_email_template"
                    value={
                      formik.values
                        .presentation_speaker_notification_email_template
                    }
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.speaker_notification_email_select_template"
                    )}
                    onChange={handleNotificationEmailTemplateChange}
                    isClearable
                    plainValue
                  />
                </Grid2>
              </Grid2>
            </Panel>

            <Panel
              show={showSection === "track_chair_settings"}
              title={T.translate("track_chair_settings.title")}
              handleClick={() => toggleSection("track_chair_settings")}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    id="allow_track_change_requests"
                    checked={formik.values.allow_track_change_requests}
                    onChange={handleChange}
                  />
                }
                label={T.translate(
                  "track_chair_settings.allow_change_requests"
                )}
              />
              <hr />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleAddRatingType}
                >
                  {T.translate("track_chair_settings.add_rating_type")}
                </Button>
              </Box>
              <SortableTable
                options={ratingTypesOptions}
                data={formik.values.track_chair_rating_types}
                columns={ratingTypesColumns}
                onReorder={onUpdateRatingTypeOrder}
                updateOrderKey="order"
              />
            </Panel>

            <Panel
              show={showSection === "presentation_action_types"}
              title={T.translate(
                "edit_selection_plan.presentation_action_types"
              )}
              handleClick={() => toggleSection("presentation_action_types")}
            >
              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 size={{ xs: 12, md: 9 }}>
                  <Many2ManyDropDown
                    id="addAllowedPresentationActionType"
                    isClearable
                    CSSClass=""
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.link_presentation_action_type"
                    )}
                    fetchOptions={fetchSummitPresentationActionTypes}
                    onAdd={linkSummitProgressFlag}
                  />
                </Grid2>
              </Grid2>
              {formik.values.allowed_presentation_action_types.length === 0 && (
                <div>
                  {T.translate(
                    "edit_selection_plan.no_presentation_action_types"
                  )}
                </div>
              )}
              {formik.values.allowed_presentation_action_types.length > 0 && (
                <SortableTable
                  options={actionTypesOptions}
                  data={formik.values.allowed_presentation_action_types}
                  columns={actionTypesColumns}
                  onReorder={onUpdateProgressFlagOrder}
                  updateOrderKey="order"
                />
              )}
            </Panel>

            {!formik.values.is_hidden && (
              <Panel
                show={showSection === "allowed_members"}
                title={T.translate("edit_selection_plan.allowed_members")}
                handleClick={() => toggleSection("allowed_members")}
                className="allowed-members-panel"
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => setShowImportModal(true)}
                  >
                    {T.translate("edit_selection_plan.import")}
                  </Button>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      value={newMemberEmail}
                      onChange={(ev) => setNewMemberEmail(ev.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleAddAllowedMember}
                      disabled={!newMemberEmail}
                    >
                      {T.translate("general.add")}
                    </Button>
                  </Box>
                </Box>
                <Table
                  data={allowedMembers.data}
                  columns={allowedMembersColumns}
                  options={allowedMembersOptions}
                />
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Pagination
                    count={allowedMembers.lastPage}
                    page={allowedMembers.currentPage}
                    onChange={(_, page) => handleAllowedMembersPageChange(page)}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </Panel>
            )}

            <Panel
              show={showSection === "cfp_settings"}
              title={T.translate("edit_selection_plan.cfp_settings")}
              handleClick={() => toggleSection("cfp_settings")}
            >
              <Grid2 container spacing={2}>
                <Grid2 size={12}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_edition_custom_message"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_edition_custom_message_info"
                      )}
                    />
                  </label>
                  <TextEditorV3
                    id="cfp_presentation_edition_custom_message"
                    error={hasErrors("cfp_presentation_edition_custom_message")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentation_edition_custom_message?.value || ""
                    }
                    license={process.env.JODIT_LICENSE_KEY}
                  />
                </Grid2>
                <Grid2 size={12}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.allowed_presentation_questions"
                    )}
                  </label>
                  <Dropdown
                    id="allowed_presentation_questions"
                    value={formik.values.allowed_presentation_questions}
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.allowed_presentation_questions"
                    )}
                    onChange={handleChange}
                    options={DEFAULT_ALLOWED_QUESTIONS}
                    isMulti
                  />
                </Grid2>
                <Grid2 size={12}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.allowed_presentation_editable_questions"
                    )}{" "}
                    *
                  </label>
                  <Dropdown
                    id="allowed_presentation_editable_questions"
                    value={
                      formik.values.allowed_presentation_editable_questions
                    }
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.allowed_presentation_editable_questions"
                    )}
                    onChange={handleChange}
                    options={DEFAULT_ALLOWED_EDITABLE_QUESTIONS}
                    isMulti
                  />
                </Grid2>
                <Grid2 size={12}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_edition_default_tab"
                    )}
                  </label>
                  <Dropdown
                    id="cfp_presentation_edition_default_tab"
                    value={
                      formik.values.marketing_settings
                        .cfp_presentation_edition_default_tab?.value || ""
                    }
                    placeholder={T.translate(
                      "edit_selection_plan.placeholders.cfp_presentation_edition_default_tab"
                    )}
                    onChange={handleChange}
                    options={DEFAULT_CFP_PRESENTATION_EDITION_TABS}
                    isMulti={false}
                    isClearable
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate("edit_selection_plan.cfp_landing_page_title")}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_landing_page_title_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_landing_page_title"
                    className="form-control"
                    error={hasErrors("cfp_landing_page_title")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings.cfp_landing_page_title
                        ?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_track_question_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_track_question_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_track_question_label"
                    className="form-control"
                    error={hasErrors("cfp_track_question_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings.cfp_track_question_label
                        ?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_speakers_singular_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_speakers_singular_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_speakers_singular_label"
                    className="form-control"
                    error={hasErrors("cfp_speakers_singular_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_speakers_singular_label?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_speakers_plural_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_speakers_plural_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_speakers_plural_label"
                    className="form-control"
                    error={hasErrors("cfp_speakers_plural_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings.cfp_speakers_plural_label
                        ?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentations_singular_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentations_singular_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_presentations_singular_label"
                    className="form-control"
                    error={hasErrors("cfp_presentations_singular_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentations_singular_label?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentations_plural_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentations_plural_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_presentations_plural_label"
                    className="form-control"
                    error={hasErrors("cfp_presentations_plural_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentations_plural_label?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_summary_title_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_summary_title_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_presentation_summary_title_label"
                    className="form-control"
                    error={hasErrors("cfp_presentation_summary_title_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentation_summary_title_label?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_summary_abstract_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_summary_abstract_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_presentation_summary_abstract_label"
                    className="form-control"
                    error={hasErrors("cfp_presentation_summary_abstract_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentation_summary_abstract_label?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_summary_social_summary_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_summary_social_summary_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_presentation_summary_social_summary_label"
                    className="form-control"
                    error={hasErrors(
                      "cfp_presentation_summary_social_summary_label"
                    )}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentation_summary_social_summary_label?.value ||
                      ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_summary_links_label"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_summary_links_label_info"
                      )}
                    />
                  </label>
                  <Input
                    id="cfp_presentation_summary_links_label"
                    className="form-control"
                    error={hasErrors("cfp_presentation_summary_links_label")}
                    onChange={handleChange}
                    value={
                      formik.values.marketing_settings
                        .cfp_presentation_summary_links_label?.value || ""
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_summary_hide_track_selection"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_summary_hide_track_selection_info"
                      )}
                    />
                  </label>
                  <br />
                  <MuiSwitch
                    checked={
                      formik.values.marketing_settings
                        .cfp_presentation_summary_hide_track_selection?.value ||
                      false
                    }
                    onChange={(ev) =>
                      handleOnSwitchChange(
                        "cfp_presentation_summary_hide_track_selection",
                        ev.target.checked
                      )
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <label>
                    {T.translate(
                      "edit_selection_plan.cfp_presentation_summary_hide_activity_type_selection"
                    )}
                    &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate(
                        "edit_selection_plan.cfp_presentation_summary_hide_activity_type_selection_info"
                      )}
                    />
                  </label>
                  <br />
                  <MuiSwitch
                    checked={
                      formik.values.marketing_settings
                        .cfp_presentation_summary_hide_activity_type_selection
                        ?.value || false
                    }
                    onChange={(ev) =>
                      handleOnSwitchChange(
                        "cfp_presentation_summary_hide_activity_type_selection",
                        ev.target.checked
                      )
                    }
                  />
                </Grid2>
                {window.CFP_APP_BASE_URL && (
                  <>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <label>
                        {T.translate(
                          "edit_selection_plan.cfp_presentation_selection_plan_link"
                        )}
                      </label>
                      <br />
                      <a
                        className="text-table-link"
                        href={`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans/${formik.values.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans/${formik.values.id}`}
                      </a>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <label>
                        {T.translate(
                          "edit_selection_plan.cfp_presentation_all_selection_plan_link"
                        )}
                      </label>
                      <br />
                      <a
                        className="text-table-link"
                        href={`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans`}
                      </a>
                    </Grid2>
                  </>
                )}
              </Grid2>
            </Panel>
          </>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {T.translate("general.save")}
          </Button>
        </Box>

        <ImportModal
          title={T.translate("edit_selection_plan.import_allowed_members")}
          show={showImportModal}
          wrapperClass="allowed-members-import-upload-wrapper"
          onHide={() => setShowImportModal(false)}
          onIngest={handleImportAllowedMembers}
        >
          * email ( text )<br />
        </ImportModal>
      </Box>
    </FormikProvider>
  );
};

export default SelectionPlanForm;
