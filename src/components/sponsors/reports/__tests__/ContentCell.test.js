import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import ContentCell from "../ContentCell";

// Sibling report-component tests mock i18n so T.translate returns the key (e.g.
// StatusRollupChips.test.js) — needed for the pending-upload assertion.
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

  it("always gives the image a string alt (empty when module/title is missing, never a missing attribute)", () => {
    const url = "https://x/logo.png";
    const { container, rerender } = render(
      <ContentCell
        row={{ module: { title: "Logo" }, content: { preview_url: url } }}
      />
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "Logo");

    // Falls back to component_name when title is absent.
    rerender(
      <ContentCell
        row={{
          module: { component_name: "Logo Widget" },
          content: { preview_url: url }
        }}
      />
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "alt",
      "Logo Widget"
    );

    // Undefined module → alt="" (decorative), NOT an omitted attribute.
    rerender(<ContentCell row={{ content: { preview_url: url } }} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img.hasAttribute("alt")).toBe(true);
  });

  it("renders the pending placeholder when there is no url or text", () => {
    render(<ContentCell row={{ module: { title: "Logo" }, content: {} }} />);
    expect(
      screen.getByText("sponsor_reports_page.pending_upload")
    ).toBeInTheDocument();
  });
});
