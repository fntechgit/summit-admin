import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaTypeFilter from "..";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

// Mirrors the real react-select single-select contract: the operator control
// receives and emits whole option objects, not raw values.
jest.mock(
  "react-select",
  () =>
    function MockSelect({ id, value, options, onChange }) {
      return (
        <select
          data-testid="operator-select"
          aria-label={id}
          value={value?.value ?? ""}
          onChange={(e) =>
            onChange(options.find((o) => o.value === e.target.value) || null)
          }
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
);

// Mirrors the real Dropdown (react-select) wrapper's isMulti contract:
// value/onChange both deal in a flat array of raw option ids.
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/dropdown",
  () =>
    function MockDropdown({ id, value, options, onChange }) {
      return (
        <select
          multiple
          data-testid="media-type-dropdown"
          aria-label={id}
          value={value}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (option) => option.value
            );
            onChange({ target: { id, value: selected } });
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
);

describe("MediaTypeFilter", () => {
  const mediaTypes = [
    { id: "1", name: "Video" },
    { id: "2", name: "Slides" }
  ];

  const getAllMediaUploadTypes = jest.fn();

  const baseProps = {
    onChange: jest.fn(),
    filterInitialValue: null,
    id: "media-type-filter",
    summitId: 1,
    getAllMediaUploadTypes
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAllMediaUploadTypes.mockResolvedValue(mediaTypes);
  });

  test("loads the available media types for the given summit", async () => {
    render(<MediaTypeFilter {...baseProps} />);

    await waitFor(() => expect(getAllMediaUploadTypes).toHaveBeenCalledWith(1));
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.getByText("Slides")).toBeInTheDocument();
  });

  test("selecting a media type reports it as an inclusive filter", async () => {
    render(<MediaTypeFilter {...baseProps} />);
    await waitFor(() => screen.getByText("Video"));

    const select = screen.getByTestId("media-type-dropdown");
    select.querySelector("option[value='1']").selected = true;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(baseProps.onChange).toHaveBeenCalledWith({
      target: {
        id: "media-type-filter",
        value: [{ id: "1", name: "Video" }],
        type: "mediatypeinput",
        operator: "has_media_upload_with_type=="
      }
    });
  });

  test("clearing the selection clears the filter", async () => {
    render(
      <MediaTypeFilter
        {...baseProps}
        filterInitialValue={[{ id: "1", name: "Video" }]}
      />
    );
    await waitFor(() => screen.getByText("Video"));

    const select = screen.getByTestId("media-type-dropdown");
    select.querySelector("option[value='1']").selected = false;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(baseProps.onChange).toHaveBeenCalledWith({
      target: {
        id: "media-type-filter",
        value: [],
        type: "mediatypeinput",
        operator: null
      }
    });
  });

  test("switching the operator reports the current selection as an exclusion", async () => {
    const user = userEvent.setup();
    render(<MediaTypeFilter {...baseProps} />);
    await waitFor(() => screen.getByText("Video"));

    await user.selectOptions(screen.getByTestId("media-type-dropdown"), ["1"]);
    await user.selectOptions(
      screen.getByTestId("operator-select"),
      "has_not_media_upload_with_type=="
    );

    expect(baseProps.onChange).toHaveBeenCalledTimes(2);
    expect(baseProps.onChange).toHaveBeenLastCalledWith({
      target: {
        id: "media-type-filter",
        value: [{ id: "1", name: "Video" }],
        type: "mediatypeinput",
        operator: "has_not_media_upload_with_type=="
      }
    });
  });
});
