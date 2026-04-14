// mui-sponsor-input.test.js
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import MuiSponsorInput from "../formik-inputs/mui-sponsor-input";

// Mock the sponsor actions
jest.mock("../../../actions/sponsor-actions", () => ({
  querySponsors: jest.fn((query, summitId, callback) => {
    const mockResults = [
      { id: 1, name: "Sponsor One" },
      { id: 2, name: "Sponsor Two" },
      { id: 3, name: "Another Sponsor" }
    ].filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

    callback(mockResults);
    return Promise.resolve();
  })
}));

// Helper function to render the component with Formik
const renderWithFormik = (props, initialValues = { sponsor: "" }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={jest.fn()}>
      <Form>
        <MuiSponsorInput
          name="sponsor"
          placeholder="Search sponsors..."
          summitId={123}
          {...props}
        />
      </Form>
    </Formik>
  );

describe("MuiSponsorInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the component with placeholder", () => {
    renderWithFormik();

    // Placeholder should be visible
    expect(
      screen.getByPlaceholderText("Search sponsors...")
    ).toBeInTheDocument();
  });

  test("opens dropdown and fetches options when typing", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime
    });
    const { querySponsors } = require("../../../actions/sponsor-actions");

    renderWithFormik();

    const input = screen.getByPlaceholderText("Search sponsors...");
    await user.click(input);
    await user.type(input, "Sponsor");

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(querySponsors).toHaveBeenCalledWith(
        "Sponsor",
        123,
        expect.any(Function)
      );
    });

    expect(await screen.findByText("Sponsor One")).toBeInTheDocument();
    expect(await screen.findByText("Sponsor Two")).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("selects a sponsor in single selection mode", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime
    });
    renderWithFormik();

    const input = screen.getByPlaceholderText("Search sponsors...");
    await user.click(input);
    await user.type(input, "Sponsor");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const option = screen.getAllByText(/Sponsor One/)[0];
    await user.click(option);

    await waitFor(() => {
      expect(input.value).toBe("Sponsor One");
    });

    jest.useRealTimers();
  });

  test("supports multiple selection when isMulti is true", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime
    });
    renderWithFormik({ isMulti: true }, { sponsor: [] });

    const input = screen.getByPlaceholderText("Search sponsors...");
    await user.click(input);
    await user.type(input, "Sponsor");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const option1 = screen.getAllByText(/Sponsor One/)[0];
    await user.click(option1);

    await user.clear(input);
    await user.type(input, "Two");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const option2 = screen.getAllByText(/Sponsor Two/)[0];
    await user.click(option2);

    expect(screen.getByText(/Sponsor One/)).toBeInTheDocument();
    expect(screen.getByText(/Sponsor Two/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("handles plain value format correctly", async () => {
    renderWithFormik({ plainValue: true });

    // Type and select an option
    const input = screen.getByPlaceholderText("Search sponsors...");
    await userEvent.click(input);
    await userEvent.type(input, "Sponsor");

    // Wait for options to load
    await waitFor(() => {
      expect(screen.getByText("Sponsor One")).toBeInTheDocument();
    });

    // Select the first option
    await userEvent.click(screen.getByText("Sponsor One"));

    // Check that the value is set correctly (this would need to inspect Formik's state)
    // We can't easily test this directly, but we can confirm the displayed value
    expect(input.value).toBe("Sponsor One");
  });

  test("displays error message when field has error", () => {
    render(
      <Formik
        initialValues={{ sponsor: "" }}
        initialErrors={{ sponsor: "Sponsor is required" }}
        initialTouched={{ sponsor: true }}
        onSubmit={jest.fn()}
      >
        <Form>
          <MuiSponsorInput
            name="sponsor"
            placeholder="Search sponsors..."
            summitId={123}
          />
        </Form>
      </Formik>
    );

    // Error message should be displayed
    expect(screen.getByText("Sponsor is required")).toBeInTheDocument();
  });

  test("initializes with preselected value in single selection mode", () => {
    renderWithFormik(
      { plainValue: false },
      { sponsor: { id: 1, name: "Sponsor One" } }
    );

    // The selected value should be displayed
    expect(screen.getByDisplayValue("Sponsor One")).toBeInTheDocument();
  });

  test("initializes with preselected values in multi selection mode", () => {
    renderWithFormik(
      { isMulti: true, plainValue: false },
      {
        sponsor: [
          { id: 1, name: "Sponsor One" },
          { id: 2, name: "Sponsor Two" }
        ]
      }
    );

    // Both selected values should be displayed as chips
    expect(screen.getByText("Sponsor One")).toBeInTheDocument();
    expect(screen.getByText("Sponsor Two")).toBeInTheDocument();
  });

  test("debounces API calls", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime
    });
    const { querySponsors } = require("../../../actions/sponsor-actions");
    renderWithFormik();

    const input = screen.getByPlaceholderText("Search sponsors...");
    await user.click(input);

    // Type characters rapidly
    await user.type(input, "Spo");

    // Debounce hasn't fired yet — timer is still pending
    expect(querySponsors).toHaveBeenCalledTimes(0);

    // Advance past the 250ms debounce
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(querySponsors).toHaveBeenCalledTimes(1);
    expect(querySponsors).toHaveBeenCalledWith(
      "Spo",
      123,
      expect.any(Function)
    );

    jest.useRealTimers();
  });
});
