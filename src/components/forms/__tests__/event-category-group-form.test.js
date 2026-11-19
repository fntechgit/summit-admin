import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EventCategoryGroupForm from "../event-category-group-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/link-list", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../audit-logs", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("../../mui/formik-inputs/mui-formik-datetimepicker", () => ({
  __esModule: true,
  default: ({ name }) => <div data-testid={name} />
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock("mui-color-input", () => ({
  MuiColorInput: ({ value, name }) => (
    <input data-testid="color-input" name={name} value={value} readOnly />
  )
}));

// class metadata shape from summit-api track-groups/metadata
const PUBLIC_CLASS = {
  class_name: "PresentationCategoryGroup",
  begin_attendee_voting_period_date: "datetime",
  end_attendee_voting_period_date: "datetime",
  max_attendee_votes: "integer"
};

const PRIVATE_CLASS = {
  ...PUBLIC_CLASS,
  class_name: "PrivatePresentationCategoryGroup",
  submission_begin_date: "datetime",
  submission_end_date: "datetime",
  max_submission_allowed_per_user: "integer",
  allowed_groups: "array"
};

const ENTITY = {
  id: 5,
  class_name: PRIVATE_CLASS.class_name,
  name: "Track Chairs",
  color: "#ff0000",
  description: "",
  begin_attendee_voting_period_date: 1700000000,
  end_attendee_voting_period_date: 0,
  max_attendee_votes: 0,
  submission_begin_date: 1700003600,
  submission_end_date: "",
  max_submission_allowed_per_user: 0,
  tracks: [],
  allowed_groups: []
};

const renderForm = (props) =>
  render(
    <EventCategoryGroupForm
      currentSummit={{ id: 1, time_zone_id: "UTC", tracks: [] }}
      allClasses={[PUBLIC_CLASS, PRIVATE_CLASS]}
      entity={ENTITY}
      errors={{}}
      onSubmit={jest.fn()}
      onTrackLink={jest.fn()}
      onTrackUnLink={jest.fn()}
      onAllowedGroupLink={jest.fn()}
      onAllowedGroupUnLink={jest.fn()}
      {...props}
    />
  );

describe("EventCategoryGroupForm", () => {
  it("submits loaded dates back as epochs and empty dates as 0", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          begin_attendee_voting_period_date: 1700000000,
          end_attendee_voting_period_date: 0,
          submission_begin_date: 1700003600,
          submission_end_date: 0
        })
      )
    );
  });

  it.each([
    [PUBLIC_CLASS.class_name, false],
    [PRIVATE_CLASS.class_name, true]
  ])(
    "for %s, shows submission fields and allowed groups: %s",
    (className, visible) => {
      renderForm({ entity: { ...ENTITY, class_name: className } });

      const submissionField = screen.queryByTestId("submission_begin_date");
      const allowedGroups = screen.queryByText(
        "edit_event_category_group.allowed_groups"
      );

      expect(!!submissionField).toBe(visible);
      expect(!!allowedGroups).toBe(visible);
    }
  );
});
