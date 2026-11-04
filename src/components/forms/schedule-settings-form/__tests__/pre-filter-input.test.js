import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, useFormikContext } from "formik";
import "@testing-library/jest-dom";
import {
  querySpeakers,
  queryTags
} from "openstack-uicore-foundation/lib/utils/query-actions";
import PreFilterInput from "../pre-filter-input";
import { FILTER_TYPES } from "../../../../actions/schedule-settings-actions";

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

const summit = {
  id: 42,
  tracks: [
    { id: 1, name: "Cloud" },
    { id: 2, name: "Edge" }
  ],
  track_groups: [],
  locations: [],
  event_types: []
};

const FieldValue = () => {
  const { values } = useFormikContext();
  return (
    <div data-testid="field-value">
      {JSON.stringify(values.pre_filters[0].values)}
    </div>
  );
};

const renderWithFormik = (type, values = [], props = {}) =>
  render(
    <Formik
      initialValues={{ pre_filters: [{ type, values }] }}
      onSubmit={jest.fn()}
    >
      <>
        <PreFilterInput
          name="pre_filters[0]"
          type={type}
          summit={summit}
          {...props}
        />
        <FieldValue />
      </>
    </Formik>
  );

const fieldValue = () =>
  JSON.parse(screen.getByTestId("field-value").textContent);

describe("PreFilterInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows option labels for stored ids even when they are strings", () => {
    renderWithFormik(FILTER_TYPES.track, ["2"]);

    expect(screen.getByRole("combobox")).toHaveTextContent("Edge");
  });

  test("selecting a track adds its id to the pre-filter values", async () => {
    renderWithFormik(FILTER_TYPES.track, ["2"]);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: "Cloud"
      })
    );

    expect(fieldValue()).toEqual(["2", 1]);
  });

  test("tag options use the nested tag name as value and label", async () => {
    queryTags.mockImplementation((summitId, input, callback) =>
      callback([{ id: 7, tag: { id: 99, tag: "kubernetes" } }])
    );

    await act(async () => {
      renderWithFormik(FILTER_TYPES.tags);
    });

    expect(queryTags).toHaveBeenCalledWith(42, "", expect.any(Function));

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "kubernetes" }));

    expect(fieldValue()).toEqual([
      { value: "kubernetes", label: "kubernetes" }
    ]);
  });

  test("speaker options are labelled by full name", async () => {
    querySpeakers.mockImplementation((summitId, input, callback) =>
      callback([{ id: 5, first_name: "Jane", last_name: "Doe" }])
    );

    await act(async () => {
      renderWithFormik(FILTER_TYPES.speakers);
    });

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Jane Doe" }));

    expect(fieldValue()).toEqual([{ value: "5", label: "Jane Doe" }]);
  });

  test("renders nothing for pre-filter types without an input", () => {
    renderWithFormik(FILTER_TYPES.date);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
