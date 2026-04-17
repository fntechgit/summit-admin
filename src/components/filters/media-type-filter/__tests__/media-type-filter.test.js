import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MediaTypeFilter from "..";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

jest.mock("react-select", () => function MockSelect({ id, value, options, onChange }) {
    return (
      <select
        aria-label={id}
        data-testid="operator-select"
        value={value?.value || ""}
        onChange={(e) => {
          const option =
            options.find((o) => o.value === e.target.value) || null;
          onChange(option);
        }}
      >
        <option value="">none</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  });

jest.mock("../../../inputs/media-upload-type-input", () => function MockMediaUploadTypeInput({ id, value, onChange }) {
    return (
      <input
        data-testid="media-upload-type-input"
        id={id}
        value={value || ""}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
      />
    );
  });

describe("MediaTypeFilter", () => {
  const baseProps = {
    onChange: jest.fn(),
    operatorInitialValue: null,
    filterInitialValue: null,
    id: "media-type-filter",
    summitId: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not crash when selecting media type before selecting operator", () => {
    render(<MediaTypeFilter {...baseProps} />);

    expect(() => {
      fireEvent.change(screen.getByTestId("media-upload-type-input"), {
        target: { value: "video" }
      });
    }).not.toThrow();

    expect(baseProps.onChange).toHaveBeenCalledTimes(1);
    expect(baseProps.onChange).toHaveBeenCalledWith({
      target: {
        id: "media-type-filter",
        value: "video",
        type: "mediatypeinput",
        operator: null
      }
    });
  });

  test("keeps existing behavior when selecting operator first and then value", () => {
    render(<MediaTypeFilter {...baseProps} />);

    fireEvent.change(screen.getByTestId("operator-select"), {
      target: { value: "has_media_upload_with_type==" }
    });

    fireEvent.change(screen.getByTestId("media-upload-type-input"), {
      target: { value: "slides" }
    });

    expect(baseProps.onChange).toHaveBeenCalledTimes(2);
    expect(baseProps.onChange).toHaveBeenNthCalledWith(1, {
      target: {
        id: "media-type-filter",
        value: null,
        type: "mediatypeinput",
        operator: "has_media_upload_with_type=="
      }
    });
    expect(baseProps.onChange).toHaveBeenNthCalledWith(2, {
      target: {
        id: "media-type-filter",
        value: "slides",
        type: "mediatypeinput",
        operator: "has_media_upload_with_type=="
      }
    });
  });

  test("does not crash when clearing operator and re-selecting filter value", () => {
    render(
      <MediaTypeFilter
        {...baseProps}
        operatorInitialValue="has_media_upload_with_type=="
      />
    );

    fireEvent.change(screen.getByTestId("media-upload-type-input"), {
      target: { value: "video" }
    });

    fireEvent.change(screen.getByTestId("operator-select"), {
      target: { value: "" }
    });

    expect(() => {
      fireEvent.change(screen.getByTestId("media-upload-type-input"), {
        target: { value: "slides" }
      });
    }).not.toThrow();

    expect(baseProps.onChange).toHaveBeenCalledTimes(2);
    expect(baseProps.onChange).toHaveBeenLastCalledWith({
      target: {
        id: "media-type-filter",
        value: "slides",
        type: "mediatypeinput",
        operator: null
      }
    });
  });
});
