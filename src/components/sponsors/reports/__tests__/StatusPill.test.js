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
});

describe("StatusPill", () => {
  it("renders the given label, defaulting to the status text", () => {
    renderWithRedux(<StatusPill status="pending" />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
