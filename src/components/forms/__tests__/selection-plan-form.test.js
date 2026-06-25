import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SelectionPlanForm from "../selection-plan-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/components", () => ({
  Input: ({ id, value, onChange }) => (
    <input id={id} value={value} onChange={onChange} />
  ),
  SimpleLinkList: () => null,
  SortableTable: () => null,
  Table: () => null,
  UploadInput: () => null
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../inputs/email-template-input", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../inputs/import-modal", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../inputs/many-2-many-dropdown", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../../actions/selection-plan-actions", () => ({
  querySelectionPlanExtraQuestions: jest.fn()
}));

jest.mock("../../../actions/track-chair-actions", () => ({
  querySummitProgressFlags: jest.fn()
}));

jest.mock("../../../reducers/selection_plans/selection-plan-reducer", () => ({
  DEFAULT_ALLOWED_EDITABLE_QUESTIONS: [],
  DEFAULT_ALLOWED_QUESTIONS: [],
  DEFAULT_CFP_PRESENTATION_EDITION_TABS: []
}));

const defaultEntity = {
  id: 0,
  name: "",
  is_enabled: false,
  is_hidden: false,
  allow_proposed_schedules: false,
  submission_begin_date: null,
  submission_end_date: null,
  voting_begin_date: null,
  voting_end_date: null,
  selection_begin_date: null,
  selection_end_date: null,
  track_chair_rating_types: [],
  extra_questions: [],
  allowed_presentation_action_types: [],
  allowed_event_types: [],
  track_groups: [],
  marketing_settings: {},
  allowed_editable_questions: [],
  allowed_questions: [],
  cfp_presentation_edition_custom_message: "",
  cfp_presentations_editable_allowed_status: []
};

const defaultProps = {
  entity: defaultEntity,
  errors: {},
  currentSummit: { id: 1, time_zone_id: "UTC" },
  extraQuestionsOrder: "id",
  extraQuestionsOrderDir: 1,
  actionTypesOrder: "id",
  actionTypesOrderDir: 1,
  allowedMembers: { data: [], total: 0 },
  onSave: jest.fn(() => Promise.resolve()),
  onTrackGroupLink: jest.fn(),
  onTrackGroupUnLink: jest.fn(),
  onAddEventType: jest.fn(),
  onDeleteEventType: jest.fn(),
  onAddRatingType: jest.fn(),
  onEditRatingType: jest.fn(),
  onDeleteRatingType: jest.fn(),
  onEditExtraQuestion: jest.fn(),
  onDeleteExtraQuestion: jest.fn(),
  onAddNewExtraQuestion: jest.fn(),
  onAssignExtraQuestion2SelectionPlan: jest.fn(),
  onAssignProgressFlag2SelectionPlan: jest.fn(),
  onUnassignProgressFlag: jest.fn(),
  onUpdateProgressFlagOrder: jest.fn(),
  onUpdateRatingTypeOrder: jest.fn(),
  updateExtraQuestionOrder: jest.fn(),
  onImportAllowedMembers: jest.fn(),
  onAllowedMemberAdd: jest.fn(),
  onAllowedMemberDelete: jest.fn(),
  onAllowedMembersPageChange: jest.fn(),
  onAddProgressFlag: jest.fn(),
  onEditProgressFlag: jest.fn()
};

// Mirrors the popup: form has no internal submit button; an external button
// submits via the `form` attribute. The popup owns isSaving — not the form.
const FormWithExternalButton = (props) => (
  <>
    <SelectionPlanForm {...props} />
    <button type="submit" form="selection-plan-form">
      general.save
    </button>
  </>
);

describe("SelectionPlanForm — save behaviour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = (props = {}) =>
    render(<FormWithExternalButton {...defaultProps} {...props} />);

  it("calls onSave when the form is submitted", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderForm({ onSave });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it("passes normalized values to onSave", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderForm({ onSave });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const [calledWith] = onSave.mock.calls[0];
    // Dates that were null become 0 (unix epoch sentinel) after normalization
    expect(calledWith.submission_begin_date).toBe(0);
    expect(calledWith.marketing_settings).toEqual(
      defaultEntity.marketing_settings
    );
  });
});
