import React from "react";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import SelectionPlanForm from "../selection-plan-form";
import {
  addAllowedMemberToSelectionPlan,
  deleteEventTypeSelectionPlan,
  importAllowedMembersCSV,
  removeAllowedMemberFromSelectionPlan,
  removeTrackGroupFromSelectionPlan,
  unassignProgressFlagFromSelectionPlan
} from "../../../actions/selection-plan-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/editor-input-v3",
  () => ({ __esModule: true, default: () => null })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog",
  () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve(true))
  })
);

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onDelete }) => (
    <ul>
      {(data || []).map((row) => (
        <li key={row.id}>
          {row.name || row.email || row.label}
          <button type="button" onClick={() => onDelete && onDelete(row.id)}>
            delete
          </button>
        </li>
      ))}
    </ul>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/sortable-table",
  () => ({
    __esModule: true,
    default: ({ data, onEdit, onDelete }) => (
      <ul>
        {(data || []).map((row) => (
          <li key={row.id}>
            {row.name || row.label}
            {onEdit && (
              <button type="button" onClick={() => onEdit(row)}>
                edit
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={() => onDelete(row.id)}>
                delete
              </button>
            )}
          </li>
        ))}
      </ul>
    )
  })
);

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryTrackGroups: jest.fn(),
  queryEventTypes: jest.fn()
}));

jest.mock("../../mui/formik-inputs/mui-formik-datetimepicker", () => ({
  __esModule: true,
  default: ({ name }) => <div data-testid={name} />
}));

jest.mock("../../inputs/email-template-input", () => ({
  __esModule: true,
  default: ({ id }) => <input data-testid={id} />
}));

jest.mock("../../inputs/import-modal", () => ({
  __esModule: true,
  default: ({ show, onIngest }) =>
    show ? (
      <div role="dialog">
        <button
          type="button"
          onClick={() => onIngest(new File([""], "test.csv"))}
        >
          ingest
        </button>
      </div>
    ) : null
}));

jest.mock("../../inputs/many-2-many-dropdown", () => ({
  __esModule: true,
  default: () => null
}));

// Action creators are dispatched through connect's bindActionCreators, and
// redux-mock-store requires every dispatched action to be a plain object -
// each mock must return one instead of the default undefined.
jest.mock("../../../actions/selection-plan-actions", () => {
  const mockAction = () => jest.fn(() => ({ type: "MOCK_ACTION" }));
  return {
    __esModule: true,
    querySelectionPlanExtraQuestions: jest.fn(),
    addAllowedMemberToSelectionPlan: mockAction(),
    addEventTypeSelectionPlan: mockAction(),
    addTrackGroupToSelectionPlan: mockAction(),
    assignExtraQuestion2SelectionPlan: mockAction(),
    assignProgressFlag2SelectionPlan: mockAction(),
    deleteEventTypeSelectionPlan: mockAction(),
    deleteRatingType: mockAction(),
    deleteSelectionPlanExtraQuestion: mockAction(),
    getAllowedMembers: mockAction(),
    importAllowedMembersCSV: mockAction(),
    removeAllowedMemberFromSelectionPlan: mockAction(),
    removeTrackGroupFromSelectionPlan: mockAction(),
    unassignProgressFlagFromSelectionPlan: mockAction(),
    updateProgressFlagOrder: mockAction(),
    updateRatingTypeOrder: mockAction(),
    updateSelectionPlanExtraQuestionOrder: mockAction()
  };
});

jest.mock("../../../actions/track-chair-actions", () => ({
  querySummitProgressFlags: jest.fn()
}));

jest.mock("../../../reducers/selection_plans/selection-plan-reducer", () => ({
  DEFAULT_ALLOWED_EDITABLE_QUESTIONS: [],
  DEFAULT_ALLOWED_QUESTIONS: [],
  DEFAULT_CFP_PRESENTATION_EDITION_TABS: []
}));

// Base entity for a new plan (no tabs shown)
const newEntity = {
  id: 0,
  name: "",
  is_enabled: false,
  is_hidden: false,
  allow_proposed_schedules: false,
  allow_new_presentations: false,
  submission_begin_date: null,
  submission_end_date: null,
  submission_lock_down_presentation_status_date: null,
  voting_begin_date: null,
  voting_end_date: null,
  selection_begin_date: null,
  selection_end_date: null,
  submission_period_disclaimer: "",
  max_submission_allowed_per_user: 0,
  presentation_creator_notification_email_template: "",
  presentation_moderator_notification_email_template: "",
  presentation_speaker_notification_email_template: "",
  track_chair_rating_types: [],
  allow_track_change_requests: true,
  track_groups: [],
  event_types: [],
  extra_questions: [],
  extraQuestionsOrder: "order",
  extraQuestionsOrderDir: 1,
  allowed_presentation_action_types: [],
  actionTypesOrder: "order",
  actionTypesOrderDir: 1,
  allowed_presentation_questions: [],
  allowed_presentation_editable_questions: [],
  marketing_settings: {}
};

// Existing plan entity (tabs shown)
const existingEntity = { ...newEntity, id: 42, name: "Spring CFP" };

const mockHistory = { push: jest.fn() };

const baseProps = {
  history: mockHistory,
  onSave: jest.fn(() => Promise.resolve())
};

const stateFor = (
  entity,
  allowedMembers = { data: [], currentPage: 1, lastPage: 1 },
  errors = {}
) => ({
  currentSummitState: {
    currentSummit: { id: 1, time_zone_id: "UTC", slug: "test-summit" }
  },
  currentSelectionPlanState: { entity, allowedMembers, errors }
});

// Mirrors the popup - external submit button via form attribute
const FormWithButton = (props) => (
  <>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <SelectionPlanForm {...props} />
    <button type="submit" form="selection-plan-form">
      general.save
    </button>
  </>
);

const renderForm = ({
  entity = newEntity,
  allowedMembers,
  errors,
  ...props
} = {}) =>
  renderWithRedux(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormWithButton {...baseProps} {...props} />,
    { initialState: stateFor(entity, allowedMembers, errors) }
  );

const renderExistingForm = (overrides = {}) =>
  renderForm({ entity: existingEntity, ...overrides });

const clickTab = async (label) => {
  await userEvent.click(screen.getByRole("tab", { name: label }));
};

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// Save behaviour
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - save behaviour", () => {
  it("calls onSave when the form is submitted", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderForm({ onSave });
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it("normalizes null dates to 0 before calling onSave", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderForm({ onSave });
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const [payload] = onSave.mock.calls[0];
    expect(payload.submission_begin_date).toBe(0);
    expect(payload.voting_begin_date).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - tab navigation", () => {
  it("hides tabs for a new plan (id=0)", () => {
    renderForm();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("shows tab bar for an existing plan (id>0)", () => {
    renderExistingForm();
    expect(screen.getByRole("tab", { name: "Main" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "edit_selection_plan.track_groups" })
    ).toBeInTheDocument();
  });

  it("hides the allowed_members tab when is_hidden is true", () => {
    renderExistingForm({ entity: { ...existingEntity, is_hidden: true } });
    expect(
      screen.queryByRole("tab", { name: "edit_selection_plan.allowed_members" })
    ).toBeNull();
  });

  it("shows the allowed_members tab when is_hidden is false", () => {
    renderExistingForm({ entity: { ...existingEntity, is_hidden: false } });
    expect(
      screen.getByRole("tab", { name: "edit_selection_plan.allowed_members" })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - main tab", () => {
  it("renders the name field", () => {
    renderForm();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders enabled and hidden checkboxes", () => {
    renderForm();
    expect(
      screen.getByLabelText("edit_selection_plan.enabled")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("edit_selection_plan.hidden")
    ).toBeInTheDocument();
  });

  it("renders all date pickers", () => {
    renderForm();
    expect(screen.getByTestId("submission_begin_date")).toBeInTheDocument();
    expect(screen.getByTestId("submission_end_date")).toBeInTheDocument();
    expect(screen.getByTestId("voting_begin_date")).toBeInTheDocument();
    expect(screen.getByTestId("selection_begin_date")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Track groups tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - track_groups tab", () => {
  const goToTab = async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.track_groups");
  };

  it("shows empty state when no track groups", async () => {
    await goToTab();
    const panel = document.getElementById("tabpanel-track_groups");
    expect(
      within(panel).getByText("edit_selection_plan.no_track_groups")
    ).toBeInTheDocument();
  });

  it("renders linked track groups in table", async () => {
    renderExistingForm({
      entity: {
        ...existingEntity,
        track_groups: [{ id: 1, name: "Group A", description: "" }]
      }
    });
    await clickTab("edit_selection_plan.track_groups");
    const panel = document.getElementById("tabpanel-track_groups");
    expect(within(panel).getByText("Group A")).toBeInTheDocument();
  });

  it("calls removeTrackGroupFromSelectionPlan when delete is clicked", async () => {
    renderExistingForm({
      entity: {
        ...existingEntity,
        track_groups: [{ id: 7, name: "G", description: "" }]
      }
    });
    await clickTab("edit_selection_plan.track_groups");
    await userEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(removeTrackGroupFromSelectionPlan).toHaveBeenCalledWith(
      existingEntity.id,
      7
    );
  });
});

// ---------------------------------------------------------------------------
// Event types tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - event_types tab", () => {
  const goToTab = async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.event_types");
  };

  it("shows empty state when no event types", async () => {
    await goToTab();
    const panel = document.getElementById("tabpanel-event_types");
    expect(
      within(panel).getByText("edit_selection_plan.no_event_types")
    ).toBeInTheDocument();
  });

  it("renders linked event types in table", async () => {
    renderExistingForm({
      entity: {
        ...existingEntity,
        event_types: [{ id: 3, name: "Presentation" }]
      }
    });
    await clickTab("edit_selection_plan.event_types");
    const panel = document.getElementById("tabpanel-event_types");
    expect(within(panel).getByText("Presentation")).toBeInTheDocument();
  });

  it("calls deleteEventTypeSelectionPlan when delete is clicked", async () => {
    renderExistingForm({
      entity: { ...existingEntity, event_types: [{ id: 5, name: "Talk" }] }
    });
    await clickTab("edit_selection_plan.event_types");
    await userEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(deleteEventTypeSelectionPlan).toHaveBeenCalledWith(
      existingEntity.id,
      5
    );
  });
});

// ---------------------------------------------------------------------------
// Extra questions tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - extra_questions tab", () => {
  const goToTab = async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.extra_questions");
  };

  it("shows empty state when no extra questions", async () => {
    await goToTab();
    const panel = document.getElementById("tabpanel-extra_questions");
    expect(
      within(panel).getByText("edit_selection_plan.no_extra_questions")
    ).toBeInTheDocument();
  });

  it("navigates to the new extra question route when Add button is clicked", async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.extra_questions");
    await userEvent.click(
      screen.getByRole("button", {
        name: "edit_selection_plan.add_extra_questions"
      })
    );
    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/1/selection-plans/${existingEntity.id}/extra-questions/new`
    );
  });

  it("renders extra questions and navigates to edit route on edit", async () => {
    renderExistingForm({
      entity: {
        ...existingEntity,
        extra_questions: [{ id: 10, name: "q1", label: "Q One", type: "text" }]
      }
    });
    await clickTab("edit_selection_plan.extra_questions");
    await userEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/1/selection-plans/${existingEntity.id}/extra-questions/10`
    );
  });
});

// ---------------------------------------------------------------------------
// Email templates tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - email_templates tab", () => {
  it("renders the three email template inputs", async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.email_templates");
    const panel = document.getElementById("tabpanel-email_templates");
    expect(
      within(panel).getByTestId(
        "presentation_creator_notification_email_template"
      )
    ).toBeInTheDocument();
    expect(
      within(panel).getByTestId(
        "presentation_moderator_notification_email_template"
      )
    ).toBeInTheDocument();
    expect(
      within(panel).getByTestId(
        "presentation_speaker_notification_email_template"
      )
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Track chair settings tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - track_chair_settings tab", () => {
  const goToTab = async () => {
    renderExistingForm();
    await clickTab("track_chair_settings.title");
  };

  it("renders the allow track change requests checkbox", async () => {
    await goToTab();
    expect(
      screen.getByLabelText("track_chair_settings.allow_change_requests")
    ).toBeInTheDocument();
  });

  it("navigates to the new rating type route when Add Rating Type is clicked", async () => {
    renderExistingForm();
    await clickTab("track_chair_settings.title");
    await userEvent.click(
      screen.getByRole("button", {
        name: "track_chair_settings.add_rating_type"
      })
    );
    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/1/selection-plans/${existingEntity.id}/rating-types/new`
    );
  });

  it("renders rating types and navigates to edit route on edit", async () => {
    renderExistingForm({
      entity: {
        ...existingEntity,
        track_chair_rating_types: [{ id: 20, name: "Excellent", weight: 10 }]
      }
    });
    await clickTab("track_chair_settings.title");
    await userEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/1/selection-plans/${existingEntity.id}/rating-types/20`
    );
  });
});

// ---------------------------------------------------------------------------
// Presentation action types tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - presentation_action_types tab", () => {
  const goToTab = async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.presentation_action_types");
  };

  it("shows empty state when no action types", async () => {
    await goToTab();
    const panel = document.getElementById("tabpanel-presentation_action_types");
    expect(
      within(panel).getByText(
        "edit_selection_plan.no_presentation_action_types"
      )
    ).toBeInTheDocument();
  });

  it("renders action types and calls unassignProgressFlagFromSelectionPlan on delete", async () => {
    renderExistingForm({
      entity: {
        ...existingEntity,
        allowed_presentation_action_types: [{ id: 30, label: "Approve" }]
      }
    });
    await clickTab("edit_selection_plan.presentation_action_types");
    await userEvent.click(screen.getByRole("button", { name: "delete" }));
    await waitFor(() =>
      expect(unassignProgressFlagFromSelectionPlan).toHaveBeenCalledWith(
        existingEntity.id,
        30
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Allowed members tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - allowed_members tab", () => {
  const membersEntity = { ...existingEntity, is_hidden: false };
  const membersOverrides = {
    entity: membersEntity,
    allowedMembers: {
      data: [{ id: 1, email: "user@example.com" }],
      currentPage: 1,
      lastPage: 2
    }
  };

  it("renders members and calls removeAllowedMemberFromSelectionPlan on delete", async () => {
    renderExistingForm(membersOverrides);
    await clickTab("edit_selection_plan.allowed_members");
    await userEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(removeAllowedMemberFromSelectionPlan).toHaveBeenCalledWith(
      membersEntity.id,
      1
    );
  });

  it("calls addAllowedMemberToSelectionPlan when Add is clicked with an email", async () => {
    renderExistingForm(membersOverrides);
    await clickTab("edit_selection_plan.allowed_members");
    const panel = document.getElementById("tabpanel-allowed_members");
    const emailInput = within(panel).getByRole("textbox");
    await userEvent.type(emailInput, "new@test.com");
    await userEvent.click(
      within(panel).getByRole("button", { name: "general.add" })
    );
    expect(addAllowedMemberToSelectionPlan).toHaveBeenCalledWith(
      membersEntity.id,
      "new@test.com"
    );
  });

  it("calls importAllowedMembersCSV when import modal is confirmed", async () => {
    renderExistingForm(membersOverrides);
    await clickTab("edit_selection_plan.allowed_members");
    const panel = document.getElementById("tabpanel-allowed_members");
    await userEvent.click(
      within(panel).getByRole("button", { name: "edit_selection_plan.import" })
    );
    await userEvent.click(screen.getByRole("button", { name: "ingest" }));
    expect(importAllowedMembersCSV).toHaveBeenCalledWith(
      membersEntity.id,
      expect.any(File)
    );
  });
});

// ---------------------------------------------------------------------------
// CFP settings tab
// ---------------------------------------------------------------------------

describe("SelectionPlanForm - cfp_settings tab", () => {
  it("renders the allowed_presentation_questions autocomplete", async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.cfp_settings");
    const panel = document.getElementById("tabpanel-cfp_settings");
    expect(
      within(panel).getByPlaceholderText(
        "edit_selection_plan.placeholders.allowed_presentation_questions"
      )
    ).toBeInTheDocument();
  });

  it("renders the allowed_presentation_editable_questions autocomplete", async () => {
    renderExistingForm();
    await clickTab("edit_selection_plan.cfp_settings");
    const panel = document.getElementById("tabpanel-cfp_settings");
    expect(
      within(panel).getByPlaceholderText(
        "edit_selection_plan.placeholders.allowed_presentation_editable_questions"
      )
    ).toBeInTheDocument();
  });
});
