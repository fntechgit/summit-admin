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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import moment from "moment-timezone";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { scrollToError } from "../../utils/methods";
import MainTab from "./selection-plan-form/main-tab";
import TrackGroupsTab from "./selection-plan-form/track-groups-tab";
import EventTypesTab from "./selection-plan-form/event-types-tab";
import ExtraQuestionsTab from "./selection-plan-form/extra-questions-tab";
import EmailTemplatesTab from "./selection-plan-form/email-templates-tab";
import TrackChairSettingsTab from "./selection-plan-form/track-chair-settings-tab";
import PresentationActionTypesTab from "./selection-plan-form/presentation-action-types-tab";
import AllowedMembersTab from "./selection-plan-form/allowed-members-tab";
import CfpSettingsTab from "./selection-plan-form/cfp-settings-tab";

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

  const handleFormikSubmit = (values) => {
    const normalized = { ...values };
    DATE_FIELDS.forEach((field) => {
      normalized[field] = values[field]
        ? moment.tz(values[field], currentSummit.time_zone_id).unix()
        : 0;
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

  const isNewPlan = formik.values.id === 0;

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

        {!isNewPlan && (
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

        {/* Main tab always in DOM - TextEditorV3 must not remount on tab switch */}
        <MainTab
          hidden={!isNewPlan && activeTab !== "main"}
          currentSummit={currentSummit}
        />

        {!isNewPlan && (
          <>
            <TrackGroupsTab
              hidden={activeTab !== "track_groups"}
              currentSummit={currentSummit}
              onTrackGroupLink={onTrackGroupLink}
              onTrackGroupUnLink={onTrackGroupUnLink}
            />
            <EventTypesTab
              hidden={activeTab !== "event_types"}
              currentSummit={currentSummit}
              onAddEventType={onAddEventType}
              onDeleteEventType={onDeleteEventType}
            />
            <ExtraQuestionsTab
              hidden={activeTab !== "extra_questions"}
              currentSummit={currentSummit}
              extraQuestionsOrder={extraQuestionsOrder}
              extraQuestionsOrderDir={extraQuestionsOrderDir}
              onEditExtraQuestion={onEditExtraQuestion}
              onDeleteExtraQuestion={onDeleteExtraQuestion}
              onAddNewExtraQuestion={onAddNewExtraQuestion}
              onAssignExtraQuestion2SelectionPlan={
                onAssignExtraQuestion2SelectionPlan
              }
              updateExtraQuestionOrder={updateExtraQuestionOrder}
            />
            <EmailTemplatesTab hidden={activeTab !== "email_templates"} />
            <TrackChairSettingsTab
              hidden={activeTab !== "track_chair_settings"}
              onAddRatingType={onAddRatingType}
              onEditRatingType={onEditRatingType}
              onDeleteRatingType={onDeleteRatingType}
              onUpdateRatingTypeOrder={onUpdateRatingTypeOrder}
            />
            <PresentationActionTypesTab
              hidden={activeTab !== "presentation_action_types"}
              currentSummit={currentSummit}
              actionTypesOrder={actionTypesOrder}
              actionTypesOrderDir={actionTypesOrderDir}
              onAssignProgressFlag2SelectionPlan={
                onAssignProgressFlag2SelectionPlan
              }
              onUnassignProgressFlag={onUnassignProgressFlag}
              onUpdateProgressFlagOrder={onUpdateProgressFlagOrder}
            />
            {!formik.values.is_hidden && (
              <AllowedMembersTab
                hidden={activeTab !== "allowed_members"}
                allowedMembers={allowedMembers}
                onImportAllowedMembers={onImportAllowedMembers}
                onAllowedMemberAdd={onAllowedMemberAdd}
                onAllowedMemberDelete={onAllowedMemberDelete}
                onAllowedMembersPageChange={onAllowedMembersPageChange}
              />
            )}
            {/* cfp_settings kept in DOM always - contains TextEditorV3 */}
            <CfpSettingsTab
              hidden={activeTab !== "cfp_settings"}
              currentSummit={currentSummit}
            />
          </>
        )}
      </Box>
    </FormikProvider>
  );
};

SelectionPlanForm.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.number,
    track_groups: PropTypes.arrayOf(PropTypes.shape({})),
    event_types: PropTypes.arrayOf(PropTypes.shape({})),
    extra_questions: PropTypes.arrayOf(PropTypes.shape({})),
    track_chair_rating_types: PropTypes.arrayOf(PropTypes.shape({})),
    allowed_presentation_action_types: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  errors: PropTypes.shape({}),
  currentSummit: PropTypes.shape({
    id: PropTypes.number.isRequired,
    time_zone_id: PropTypes.string.isRequired,
    slug: PropTypes.string
  }).isRequired,
  extraQuestionsOrder: PropTypes.string.isRequired,
  extraQuestionsOrderDir: PropTypes.number.isRequired,
  actionTypesOrder: PropTypes.string.isRequired,
  actionTypesOrderDir: PropTypes.number.isRequired,
  allowedMembers: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({ id: PropTypes.number, email: PropTypes.string })
    ).isRequired,
    currentPage: PropTypes.number.isRequired,
    lastPage: PropTypes.number.isRequired
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onTrackGroupLink: PropTypes.func.isRequired,
  onTrackGroupUnLink: PropTypes.func.isRequired,
  onAddEventType: PropTypes.func.isRequired,
  onDeleteEventType: PropTypes.func.isRequired,
  onAddRatingType: PropTypes.func.isRequired,
  onEditRatingType: PropTypes.func.isRequired,
  onDeleteRatingType: PropTypes.func.isRequired,
  onEditExtraQuestion: PropTypes.func.isRequired,
  onDeleteExtraQuestion: PropTypes.func.isRequired,
  onAddNewExtraQuestion: PropTypes.func.isRequired,
  onAssignExtraQuestion2SelectionPlan: PropTypes.func.isRequired,
  onAssignProgressFlag2SelectionPlan: PropTypes.func.isRequired,
  onUnassignProgressFlag: PropTypes.func.isRequired,
  onUpdateProgressFlagOrder: PropTypes.func.isRequired,
  onUpdateRatingTypeOrder: PropTypes.func.isRequired,
  updateExtraQuestionOrder: PropTypes.func.isRequired,
  onImportAllowedMembers: PropTypes.func.isRequired,
  onAllowedMemberAdd: PropTypes.func.isRequired,
  onAllowedMemberDelete: PropTypes.func.isRequired,
  onAllowedMembersPageChange: PropTypes.func.isRequired
};

SelectionPlanForm.defaultProps = {
  errors: {}
};

export default SelectionPlanForm;
