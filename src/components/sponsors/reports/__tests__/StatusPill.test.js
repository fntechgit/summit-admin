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

  it("gives a partially canceled line a warning tone, distinct from canceled", () => {
    expect(statusTone("partially_canceled")).toBe("warning");
    expect(statusTone("canceled")).toBe("default");
  });
});

describe("StatusPill", () => {
  it("renders the given label, defaulting to the status text", () => {
    renderWithRedux(<StatusPill status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
