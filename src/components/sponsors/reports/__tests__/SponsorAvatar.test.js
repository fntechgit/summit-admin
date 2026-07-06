import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import SponsorAvatar from "../SponsorAvatar";

describe("SponsorAvatar", () => {
  it("falls back to up-to-two uppercase initials when there is no logo", () => {
    render(<SponsorAvatar name="Advanced Energy" />);
    expect(screen.getByText("AE")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders '?' for an empty/whitespace name with no logo", () => {
    render(<SponsorAvatar name="   " />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
