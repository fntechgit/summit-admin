import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
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
  currentSummit: { id: 1 },
  extraQuestionsOrder: "id",
  extraQuestionsOrderDir: 1,
  actionTypesOrder: "id",
  actionTypesOrderDir: 1,
  allowedMembers: { data: [], total: 0 },
  onSaved: jest.fn(),
  onSavingChange: jest.fn(),
  saveSelectionPlanSettings: jest.fn(() => Promise.resolve()),
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

// Mirrors the popup: form renders without a button; an external button submits
// via the `form` attribute and tracks saving state via onSavingChange.
const FormWithExternalButton = ({
  onSavingChange: onSavingChangeProp,
  ...rest
}) => {
  const [saving, setSaving] = React.useState(false);
  const handleSavingChange = (s) => {
    setSaving(s);
    onSavingChangeProp(s);
  };
  return (
    <>
      <SelectionPlanForm {...rest} onSavingChange={handleSavingChange} />
      <button type="submit" form="selection-plan-form" disabled={saving}>
        general.save
      </button>
    </>
  );
};

describe("SelectionPlanForm — save guard", () => {
  let onSubmit;
  let onSavingChange;

  beforeEach(() => {
    onSubmit = jest.fn();
    onSavingChange = jest.fn();
    jest.clearAllMocks();
  });

  const renderForm = (props = {}) =>
    render(
      <FormWithExternalButton
        {...defaultProps}
        onSubmit={onSubmit}
        onSavingChange={onSavingChange}
        {...props}
      />
    );

  it("disables submit and calls onSavingChange(true) while save is pending", async () => {
    let resolveSave;
    onSubmit.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled();
    });
    expect(onSavingChange).toHaveBeenCalledWith(true);

    await act(async () => {
      resolveSave({ id: 1 });
      await Promise.resolve();
    });
  });

  it("does not re-trigger onSubmit while a save is in flight", async () => {
    let resolveSave;
    onSubmit.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled()
    );

    // Second click on disabled button — should not fire onSubmit again
    fireEvent.click(screen.getByRole("button", { name: "general.save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave({ id: 1 });
      await Promise.resolve();
    });
  });

  it("re-enables submit and calls onSavingChange(false) when onSubmit rejects", async () => {
    onSubmit.mockImplementation(() => Promise.reject(new Error("API error")));

    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).not.toBeDisabled();
    });
    expect(onSavingChange).toHaveBeenCalledWith(false);
  });

  it("calls saveSelectionPlanSettings then onSaved on successful submit", async () => {
    const savedEntity = { id: 42 };
    const onSubmitMock = jest.fn().mockResolvedValue(savedEntity);
    const onSavedMock = jest.fn();
    const saveSettingsMock = jest.fn().mockResolvedValue();

    renderForm({
      onSubmit: onSubmitMock,
      onSaved: onSavedMock,
      saveSelectionPlanSettings: saveSettingsMock
    });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => {
      expect(saveSettingsMock).toHaveBeenCalledWith(
        defaultEntity.marketing_settings,
        savedEntity.id
      );
      expect(onSavedMock).toHaveBeenCalledWith(savedEntity);
    });
  });
});
