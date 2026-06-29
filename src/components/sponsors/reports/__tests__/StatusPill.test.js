// src/components/sponsors/reports/__tests__/StatusPill.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import StatusPill, { statusTone } from "../StatusPill";

describe("statusTone", () => {
  it("maps completed/paid/confirmed to success", () => {
    expect(statusTone("completed")).toBe("success");
    expect(statusTone("paid")).toBe("success");
    expect(statusTone("Confirmed")).toBe("success");
  });
  it("maps pending to warning, in_progress to info", () => {
    expect(statusTone("pending")).toBe("warning");
    expect(statusTone("in_progress")).toBe("info");
  });
  it("maps not_applicable/canceled and unknown to default", () => {
    expect(statusTone("not_applicable")).toBe("default");
    expect(statusTone("Canceled")).toBe("default");
    expect(statusTone("whatever")).toBe("default");
    expect(statusTone(null)).toBe("default");
  });
});

describe("StatusPill", () => {
  it("renders the given label, defaulting to the status text", () => {
    renderWithRedux(<StatusPill status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
  it("uses an explicit label when provided", () => {
    renderWithRedux(<StatusPill status="paid" label="Paid" />);
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });
});
