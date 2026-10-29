import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ScheduleSettingsForm from "..";
import { FILTER_TYPES } from "../../../../actions/schedule-settings-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  __esModule: true,
  queryTags: jest.fn(),
  querySpeakers: jest.fn(),
  queryCompanies: jest.fn()
}));

// drag-and-drop can't run in jsdom, so expose onReorder through a button
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/sortable-table",
  () => ({
    __esModule: true,
    default: ({ data, columns, onReorder }) => (
      <div>
        {data.map((row) => (
          <div key={row.type}>{columns[0].render(row)}</div>
        ))}
        <button type="button" onClick={() => onReorder([...data].reverse())}>
          reverse-filters
        </button>
      </div>
    )
  })
);

const summit = {
  id: 42,
  tracks: [{ id: 1, name: "Cloud" }],
  track_groups: [],
  locations: [],
  event_types: []
};

const buildEntity = (overrides = {}) => ({
  id: 7,
  key: "schedule_1",
  is_enabled: true,
  is_my_schedule: false,
  only_events_with_attendee_access: false,
  hide_past_events_with_show_always_on_schedule: false,
  color_source: "TRACK",
  time_format: "12h",
  filters: [
    { id: 1, type: FILTER_TYPES.date, label: "Date", is_enabled: true },
    { id: 2, type: FILTER_TYPES.track, label: "Category", is_enabled: false }
  ],
  pre_filters: [
    { type: FILTER_TYPES.track, values: ["1"] },
    { type: FILTER_TYPES.tags, values: [{ id: 10, tag: "kubernetes" }] },
    {
      type: FILTER_TYPES.speakers,
      values: [{ id: 5, first_name: "Jane", last_name: "Doe" }]
    },
    { type: FILTER_TYPES.company, values: [{ id: 3, name: "Acme" }] },
    { type: FILTER_TYPES.date, values: [] }
  ],
  ...overrides
});

const renderForm = async (props = {}) => {
  const onSubmit = jest.fn(() => Promise.resolve());
  let utils;
  await act(async () => {
    utils = render(
      <ScheduleSettingsForm
        entity={buildEntity()}
        summit={summit}
        errors={{}}
        onSubmit={onSubmit}
        {...props}
      />
    );
  });
  return { ...utils, onSubmit };
};

const clickSave = () =>
  userEvent.click(screen.getByRole("button", { name: "general.save" }));

describe("ScheduleSettingsForm", () => {
  test("submits tags and speakers back in API shape", async () => {
    const { onSubmit } = await renderForm();

    await clickSave();

    const submitted = onSubmit.mock.calls[0][0];
    const byType = (type) =>
      submitted.pre_filters.find((pf) => pf.type === type).values;

    expect(byType(FILTER_TYPES.tags)).toEqual([{ tag: "kubernetes" }]);
    expect(byType(FILTER_TYPES.speakers)).toEqual([
      { id: 5, first_name: "Jane Doe", last_name: "" }
    ]);
    expect(byType(FILTER_TYPES.company)).toEqual([{ id: 3, name: "Acme" }]);
    expect(byType(FILTER_TYPES.track)).toEqual(["1"]);
  });

  test("a resubmitted entity keeps the speaker label intact", async () => {
    const { onSubmit, rerender } = await renderForm();

    await clickSave();

    await act(async () => {
      rerender(
        <ScheduleSettingsForm
          entity={onSubmit.mock.calls[0][0]}
          summit={summit}
          errors={{}}
          onSubmit={onSubmit}
        />
      );
    });

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  test("submits filters in their reordered order", async () => {
    const { onSubmit } = await renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: "reverse-filters" })
    );
    await clickSave();

    expect(onSubmit.mock.calls[0][0].filters.map((f) => f.type)).toEqual([
      FILTER_TYPES.track,
      FILTER_TYPES.date
    ]);
  });

  test("filter label edits land on the right filter after reordering", async () => {
    const { onSubmit } = await renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: "reverse-filters" })
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Category" }));
    await clickSave();

    const { filters } = onSubmit.mock.calls[0][0];
    expect(filters.find((f) => f.type === FILTER_TYPES.track).is_enabled).toBe(
      true
    );
    expect(filters.find((f) => f.type === FILTER_TYPES.date).is_enabled).toBe(
      true
    );
  });

  test("turning off Enabled disables the rest of the form", async () => {
    await renderForm();

    const myScheduleSwitch = screen.getByRole("checkbox", {
      name: "edit_schedule_settings.is_my_schedule"
    });
    expect(myScheduleSwitch).toBeEnabled();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "edit_schedule_settings.enabled" })
    );

    expect(myScheduleSwitch).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Category" })).toBeDisabled();
  });

  test("hides pre-filter types without an input", async () => {
    await renderForm();

    expect(
      screen.getByText("edit_schedule_settings.speakers")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("edit_schedule_settings.date")
    ).not.toBeInTheDocument();
  });

  test("shows server errors on their fields", async () => {
    await renderForm({ errors: { key: "Key already in use" } });

    expect(await screen.findByText("Key already in use")).toBeInTheDocument();
  });
});
