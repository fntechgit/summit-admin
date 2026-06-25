import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import SponsorAvatar from "../SponsorAvatar";

describe("SponsorAvatar", () => {
  it("renders the logo image when logoUrl is provided", () => {
    render(<SponsorAvatar name="Acme Corp" logoUrl="http://x/logo.png" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://x/logo.png");
    expect(img).toHaveAttribute("alt", "Acme Corp");
  });

  it("falls back to up-to-two uppercase initials when there is no logo", () => {
    render(<SponsorAvatar name="Advanced Energy" />);
    expect(screen.getByText("AE")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uses a single initial for a one-word name", () => {
    render(<SponsorAvatar name="Adeia" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders '?' for an empty/whitespace name with no logo", () => {
    render(<SponsorAvatar name="   " />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
