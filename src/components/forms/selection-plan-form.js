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
import SortableTable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import Table from "openstack-uicore-foundation/lib/components/mui/table";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid2 from "@mui/material/Grid2";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import MuiSwitch from "@mui/material/Switch";
import Pagination from "@mui/material/Pagination";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import MuiFormikDropdownCheckbox from "../mui/formik-inputs/mui-formik-dropdown-checkbox";
import MuiFormikDatetimepicker from "../mui/formik-inputs/mui-formik-datetimepicker";
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

const TAB_SX = {
  fontSize: "1.4rem",
  lineHeight: "1.8rem",
  minHeight: "36px",
  px: 2,
  py: 1
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
    onSave,
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

  const [activeTab, setActiveTab] = useState("main");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [trackGroupSelection, setTrackGroupSelection] = useState(null);
  const [trackGroupSearchOptions, setTrackGroupSearchOptions] = useState([]);
  const [eventTypeSelection, setEventTypeSelection] = useState(null);
  const [eventTypeSearchOptions, setEventTypeSearchOptions] = useState([]);

  const handleFormikSubmit = (values) => {
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

    return onSave(normalized);
  };

  const formik = useFormik({
    initialValues: buildInitialValues(propsEntity, currentSummit.time_zone_id),
    onSubmit: handleFormikSubmit,
    validateOnChange: false
  });

  useEffect(() => {
    scrollToError(propsErrors);
    formik.setErrors(
      propsErrors && Object.keys(propsErrors).length > 0 ? propsErrors : {}
    );
  }, [propsErrors]);

  // Sync sub-resource arrays from Redux without resetting user-editable main tab fields
  useEffect(() => {
    formik.setValues((current) => ({
      ...current,
      track_groups: propsEntity.track_groups ?? [],
      event_types: propsEntity.event_types ?? [],
      extra_questions: propsEntity.extra_questions ?? [],
      track_chair_rating_types: propsEntity.track_chair_rating_types ?? [],
      allowed_presentation_action_types:
        propsEntity.allowed_presentation_action_types ?? []
    }));
  }, [
    propsEntity.track_groups,
    propsEntity.event_types,
    propsEntity.extra_questions,
    propsEntity.track_chair_rating_types,
    propsEntity.allowed_presentation_action_types
  ]);

  // Reset tab if allowed_members becomes unavailable
  useEffect(() => {
    if (formik.values.is_hidden && activeTab === "allowed_members") {
      setActiveTab("main");
    }
  }, [formik.values.is_hidden]);

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

  const trackGroupsColumns = [
    { columnKey: "name", header: T.translate("edit_selection_plan.name") },
    {
      columnKey: "description",
      header: T.translate("edit_selection_plan.description")
    }
  ];

  const trackGroupsOptions = {};

  const eventTypesColumns = [
    { columnKey: "name", header: T.translate("edit_selection_plan.name") }
  ];

  const eventTypesOptions = {};

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
    sortDir: extraQuestionsOrderDir
  };

  const ratingTypesColumns = [
    { columnKey: "name", header: T.translate("rating_type_list.name") },
    { columnKey: "weight", header: T.translate("rating_type_list.weight") }
  ];

  const ratingTypesOptions = {};

  const actionTypesColumns = [
    { columnKey: "label", header: T.translate("progress_flags.label") }
  ];

  const actionTypesOptions = {
    sortCol: actionTypesOrder,
    sortDir: actionTypesOrderDir
  };

  const allowedMembersColumns = [
    { columnKey: "id", header: T.translate("edit_selection_plan.id") },
    { columnKey: "email", header: T.translate("edit_selection_plan.email") }
  ];

  const allowedMembersOptions = {
    sortCol: "email",
    sortDir: 1
  };

  const tabs = [
    { value: "main", label: "Main" },
    {
      value: "track_groups",
      label: T.translate("edit_selection_plan.track_groups")
    },
    {
      value: "event_types",
      label: T.translate("edit_selection_plan.event_types")
    },
    {
      value: "extra_questions",
      label: T.translate("edit_selection_plan.extra_questions")
    },
    {
      value: "email_templates",
      label: T.translate("edit_selection_plan.email_templates")
    },
    {
      value: "track_chair_settings",
      label: T.translate("track_chair_settings.title")
    },
    {
      value: "presentation_action_types",
      label: T.translate("edit_selection_plan.presentation_action_types")
    },
    ...(!formik.values.is_hidden
      ? [
          {
            value: "allowed_members",
            label: T.translate("edit_selection_plan.allowed_members")
          }
        ]
      : []),
    {
      value: "cfp_settings",
      label: T.translate("edit_selection_plan.cfp_settings")
    }
  ];

  return (
    <FormikProvider value={formik}>
      <Box
        id="selection-plan-form"
        component="form"
        className="selection-plan-form"
        onSubmit={formik.handleSubmit}
      >
        <input type="hidden" id="id" value={formik.values.id} />

        {formik.values.id !== 0 && (
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTabScrollButton-root.Mui-disabled": { display: "none" }
              }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  id={`tab-${tab.value}`}
                  aria-controls={`tabpanel-${tab.value}`}
                  sx={TAB_SX}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* Main tab — always in DOM so the rich text editor is not re-initialized on tab switch */}
        <div
          role="tabpanel"
          id="tabpanel-main"
          hidden={formik.values.id !== 0 && activeTab !== "main"}
        >
          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 4 }}>
              <label> {T.translate("edit_selection_plan.name")} *</label>
              <TextField
                id="name"
                fullWidth
                size="small"
                error={!!hasErrors("name")}
                helperText={hasErrors("name") || undefined}
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
                label={T.translate(
                  "edit_selection_plan.allow_new_presentations"
                )}
              />
            </Grid2>
          </Grid2>

          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.submission_begin_date")}
              </label>
              <MuiFormikDatetimepicker
                name="submission_begin_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.submission_end_date")}
              </label>
              <MuiFormikDatetimepicker
                name="submission_end_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
          </Grid2>

          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.max_submissions")}
              </label>
              <TextField
                id="max_submission_allowed_per_user"
                type="number"
                fullWidth
                size="small"
                error={!!hasErrors("max_submission_allowed_per_user")}
                helperText={
                  hasErrors("max_submission_allowed_per_user") || undefined
                }
                value={formik.values.max_submission_allowed_per_user}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0 } }}
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
              <MuiFormikDatetimepicker
                name="submission_lock_down_presentation_status_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
          </Grid2>

          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.voting_begin_date")}
              </label>
              <MuiFormikDatetimepicker
                name="voting_begin_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.voting_end_date")}
              </label>
              <MuiFormikDatetimepicker
                name="voting_end_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
          </Grid2>

          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.selection_begin_date")}
              </label>
              <MuiFormikDatetimepicker
                name="selection_begin_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <label>
                {T.translate("edit_selection_plan.selection_end_date")}
              </label>
              <MuiFormikDatetimepicker
                name="selection_end_date"
                timezone={currentSummit.time_zone_id}
              />
            </Grid2>
          </Grid2>

          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={12}>
              <label>
                {T.translate(
                  "edit_selection_plan.submission_period_disclaimer"
                )}{" "}
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
        </div>

        {formik.values.id !== 0 && (
          <>
            <div
              role="tabpanel"
              id="tabpanel-track_groups"
              hidden={activeTab !== "track_groups"}
            >
              <Box sx={{ pt: 2 }}>
                <Box
                  sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}
                >
                  <Autocomplete
                    size="small"
                    value={trackGroupSelection}
                    options={trackGroupSearchOptions}
                    getOptionLabel={(opt) => opt.name ?? ""}
                    filterOptions={(x) => x}
                    onInputChange={(_, val) => {
                      if (val)
                        queryTrackGroups(
                          currentSummit.id,
                          val,
                          setTrackGroupSearchOptions
                        );
                    }}
                    onChange={(_, val) => setTrackGroupSelection(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={T.translate(
                          "edit_selection_plan.placeholders.track_groups_search"
                        )}
                      />
                    )}
                    sx={{ width: 320 }}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    disabled={!trackGroupSelection}
                    onClick={() => {
                      handleTrackGroupLink(trackGroupSelection);
                      setTrackGroupSelection(null);
                      setTrackGroupSearchOptions([]);
                    }}
                  >
                    {T.translate("general.add")}
                  </Button>
                </Box>
                {formik.values.track_groups.length === 0 && (
                  <div>
                    {T.translate("edit_selection_plan.no_track_groups")}
                  </div>
                )}
                {formik.values.track_groups.length > 0 && (
                  <Table
                    data={formik.values.track_groups.map((tg) => ({
                      ...tg,
                      description: stripTags(tg.description ?? "")
                    }))}
                    columns={trackGroupsColumns}
                    options={trackGroupsOptions}
                    onDelete={handleTrackGroupUnLink}
                    confirmButtonColor="error"
                    deleteDialogBody={(name) =>
                      `${T.translate(
                        "edit_selection_plan.delete_confirm.track_group"
                      )} ${name}`
                    }
                  />
                )}
              </Box>
            </div>

            <div
              role="tabpanel"
              id="tabpanel-event_types"
              hidden={activeTab !== "event_types"}
            >
              <Box sx={{ pt: 2 }}>
                <Box
                  sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}
                >
                  <Autocomplete
                    size="small"
                    value={eventTypeSelection}
                    options={eventTypeSearchOptions}
                    getOptionLabel={(opt) => opt.name ?? ""}
                    filterOptions={(x) => x}
                    onInputChange={(_, val) => {
                      if (val)
                        queryEventTypes(
                          currentSummit.id,
                          val,
                          setEventTypeSearchOptions,
                          PresentationTypeClassName
                        );
                    }}
                    onChange={(_, val) => setEventTypeSelection(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={T.translate(
                          "edit_selection_plan.placeholders.event_type_search"
                        )}
                      />
                    )}
                    sx={{ width: 320 }}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    disabled={!eventTypeSelection}
                    onClick={() => {
                      handleAddEventType(eventTypeSelection);
                      setEventTypeSelection(null);
                      setEventTypeSearchOptions([]);
                    }}
                  >
                    {T.translate("general.add")}
                  </Button>
                </Box>
                {formik.values.event_types.length === 0 && (
                  <div>{T.translate("edit_selection_plan.no_event_types")}</div>
                )}
                {formik.values.event_types.length > 0 && (
                  <Table
                    data={formik.values.event_types}
                    columns={eventTypesColumns}
                    options={eventTypesOptions}
                    onDelete={handleDeleteEventType}
                    confirmButtonColor="error"
                    deleteDialogBody={(name) =>
                      `${T.translate(
                        "edit_selection_plan.delete_confirm.event_type"
                      )} ${name}`
                    }
                  />
                )}
              </Box>
            </div>

            <div
              role="tabpanel"
              id="tabpanel-extra_questions"
              hidden={activeTab !== "extra_questions"}
            >
              <Box sx={{ pt: 2 }}>
                <Grid2
                  container
                  spacing={2}
                  sx={{ alignItems: "center", mb: 2 }}
                >
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
                    onEdit={(item) => handleEditExtraQuestion(item.id)}
                    onDelete={handleDeleteExtraQuestion}
                    confirmButtonColor="error"
                  />
                )}
              </Box>
            </div>

            <div
              role="tabpanel"
              id="tabpanel-email_templates"
              hidden={activeTab !== "email_templates"}
            >
              <Box sx={{ pt: 2 }}>
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
              </Box>
            </div>

            <div
              role="tabpanel"
              id="tabpanel-track_chair_settings"
              hidden={activeTab !== "track_chair_settings"}
            >
              <Box sx={{ pt: 2 }}>
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
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
                >
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
                  onEdit={(item) => handleEditRatingType(item.id)}
                  onDelete={handleDeleteRatingType}
                  confirmButtonColor="error"
                />
              </Box>
            </div>

            <div
              role="tabpanel"
              id="tabpanel-presentation_action_types"
              hidden={activeTab !== "presentation_action_types"}
            >
              <Box sx={{ pt: 2 }}>
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
                {formik.values.allowed_presentation_action_types.length ===
                  0 && (
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
                    onDelete={handleRemoveProgressFlag}
                    confirmButtonColor="error"
                  />
                )}
              </Box>
            </div>

            {!formik.values.is_hidden && (
              <div
                role="tabpanel"
                id="tabpanel-allowed_members"
                hidden={activeTab !== "allowed_members"}
              >
                <Box sx={{ pt: 2 }}>
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
                    onDelete={handleDeleteAllowedMember}
                    confirmButtonColor="error"
                    getName={(item) => item.email}
                    deleteDialogBody={(email) =>
                      `${T.translate(
                        "edit_selection_plan.delete_confirm.allowed_member"
                      )} ${email}`
                    }
                  />
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <Pagination
                      count={allowedMembers.lastPage}
                      page={allowedMembers.currentPage}
                      onChange={(_, page) =>
                        handleAllowedMembersPageChange(page)
                      }
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                </Box>
              </div>
            )}

            {/* cfp_settings kept in DOM always (contains TextEditorV3) */}
            <div
              role="tabpanel"
              id="tabpanel-cfp_settings"
              hidden={activeTab !== "cfp_settings"}
            >
              <Box sx={{ pt: 2 }}>
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
                      error={hasErrors(
                        "cfp_presentation_edition_custom_message"
                      )}
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
                    <MuiFormikDropdownCheckbox
                      name="allowed_presentation_questions"
                      placeholder={T.translate(
                        "edit_selection_plan.placeholders.allowed_presentation_questions"
                      )}
                      options={DEFAULT_ALLOWED_QUESTIONS}
                      size="small"
                    />
                  </Grid2>
                  <Grid2 size={12}>
                    <label>
                      {T.translate(
                        "edit_selection_plan.allowed_presentation_editable_questions"
                      )}{" "}
                      *
                    </label>
                    <MuiFormikDropdownCheckbox
                      name="allowed_presentation_editable_questions"
                      placeholder={T.translate(
                        "edit_selection_plan.placeholders.allowed_presentation_editable_questions"
                      )}
                      options={DEFAULT_ALLOWED_EDITABLE_QUESTIONS}
                      size="small"
                    />
                  </Grid2>
                  <Grid2 size={12}>
                    <label>
                      {T.translate(
                        "edit_selection_plan.cfp_presentation_edition_default_tab"
                      )}
                    </label>
                    <FormControl fullWidth size="small">
                      <Select
                        displayEmpty
                        value={
                          formik.values.marketing_settings
                            .cfp_presentation_edition_default_tab?.value || ""
                        }
                        onChange={(ev) =>
                          handleOnSwitchChange(
                            "cfp_presentation_edition_default_tab",
                            ev.target.value
                          )
                        }
                      >
                        <MenuItem value="">
                          <em>
                            {T.translate(
                              "edit_selection_plan.placeholders.cfp_presentation_edition_default_tab"
                            )}
                          </em>
                        </MenuItem>
                        {DEFAULT_CFP_PRESENTATION_EDITION_TABS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <label>
                      {T.translate(
                        "edit_selection_plan.cfp_landing_page_title"
                      )}
                      &nbsp;
                      <i
                        className="fa fa-info-circle"
                        aria-hidden="true"
                        title={T.translate(
                          "edit_selection_plan.cfp_landing_page_title_info"
                        )}
                      />
                    </label>
                    <TextField
                      id="cfp_landing_page_title"
                      fullWidth
                      size="small"
                      error={!!hasErrors("cfp_landing_page_title")}
                      helperText={
                        hasErrors("cfp_landing_page_title") || undefined
                      }
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
                    <TextField
                      id="cfp_track_question_label"
                      fullWidth
                      size="small"
                      error={!!hasErrors("cfp_track_question_label")}
                      helperText={
                        hasErrors("cfp_track_question_label") || undefined
                      }
                      onChange={handleChange}
                      value={
                        formik.values.marketing_settings
                          .cfp_track_question_label?.value || ""
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
                    <TextField
                      id="cfp_speakers_singular_label"
                      fullWidth
                      size="small"
                      error={!!hasErrors("cfp_speakers_singular_label")}
                      helperText={
                        hasErrors("cfp_speakers_singular_label") || undefined
                      }
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
                    <TextField
                      id="cfp_speakers_plural_label"
                      fullWidth
                      size="small"
                      error={!!hasErrors("cfp_speakers_plural_label")}
                      helperText={
                        hasErrors("cfp_speakers_plural_label") || undefined
                      }
                      onChange={handleChange}
                      value={
                        formik.values.marketing_settings
                          .cfp_speakers_plural_label?.value || ""
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
                    <TextField
                      id="cfp_presentations_singular_label"
                      fullWidth
                      size="small"
                      error={!!hasErrors("cfp_presentations_singular_label")}
                      helperText={
                        hasErrors("cfp_presentations_singular_label") ||
                        undefined
                      }
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
                    <TextField
                      id="cfp_presentations_plural_label"
                      fullWidth
                      size="small"
                      error={!!hasErrors("cfp_presentations_plural_label")}
                      helperText={
                        hasErrors("cfp_presentations_plural_label") || undefined
                      }
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
                    <TextField
                      id="cfp_presentation_summary_title_label"
                      fullWidth
                      size="small"
                      error={
                        !!hasErrors("cfp_presentation_summary_title_label")
                      }
                      helperText={
                        hasErrors("cfp_presentation_summary_title_label") ||
                        undefined
                      }
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
                    <TextField
                      id="cfp_presentation_summary_abstract_label"
                      fullWidth
                      size="small"
                      error={
                        !!hasErrors("cfp_presentation_summary_abstract_label")
                      }
                      helperText={
                        hasErrors("cfp_presentation_summary_abstract_label") ||
                        undefined
                      }
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
                    <TextField
                      id="cfp_presentation_summary_social_summary_label"
                      fullWidth
                      size="small"
                      error={
                        !!hasErrors(
                          "cfp_presentation_summary_social_summary_label"
                        )
                      }
                      helperText={
                        hasErrors(
                          "cfp_presentation_summary_social_summary_label"
                        ) || undefined
                      }
                      onChange={handleChange}
                      value={
                        formik.values.marketing_settings
                          .cfp_presentation_summary_social_summary_label
                          ?.value || ""
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
                    <TextField
                      id="cfp_presentation_summary_links_label"
                      fullWidth
                      size="small"
                      error={
                        !!hasErrors("cfp_presentation_summary_links_label")
                      }
                      helperText={
                        hasErrors("cfp_presentation_summary_links_label") ||
                        undefined
                      }
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
                          .cfp_presentation_summary_hide_track_selection
                          ?.value || false
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
              </Box>
            </div>
          </>
        )}

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
