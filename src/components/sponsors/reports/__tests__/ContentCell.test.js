import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import ContentCell from "../ContentCell";

// Sibling report-component tests mock i18n so T.translate returns the key (e.g.
// GroupByToggle.test.js, StatusRollupChips.test.js) — needed for the pending-upload assertion.
jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("ContentCell", () => {
  it("renders an <img> for an image preview_url", () => {
    const row = {
      module: { title: "Logo" },
      content: { preview_url: "https://x/logo.png", filename: "logo.png" }
    };
    render(<ContentCell row={row} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://x/logo.png"
    );
  });

  it("renders the pending placeholder when there is no url or text", () => {
    render(<ContentCell row={{ module: { title: "Logo" }, content: {} }} />);
    expect(
      screen.getByText("sponsor_reports_page.pending_upload")
    ).toBeInTheDocument();
  });
});
