import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import T from "i18n-react/dist/i18n-react";
import { ImagePreviewCell } from "../image-preview-cell";

describe("ImagePreviewCell", () => {
  const imageUrl = "https://example.com/path/sponsor_banner.png";
  const title = T.translate("preview_modal.title");

  test("does not render when imageUrl is null or empty", () => {
    const { rerender } = render(<ImagePreviewCell imageUrl={null} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<ImagePreviewCell imageUrl="" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("renders a trigger button", () => {
    render(<ImagePreviewCell imageUrl={imageUrl} />);
    expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
  });

  test("opens PreviewModal on click", async () => {
    const user = userEvent.setup();
    render(<ImagePreviewCell imageUrl={imageUrl} />);

    await user.click(screen.getByRole("button", { name: title }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("passes itemName as dialog title", async () => {
    const user = userEvent.setup();
    render(<ImagePreviewCell imageUrl={imageUrl} itemName="Sponsor Banner" />);

    await user.click(screen.getByRole("button", { name: title }));
    expect(screen.getByText("Sponsor Banner")).toBeInTheDocument();
  });

  test("extracts filename from URL when no fileName prop", async () => {
    const user = userEvent.setup();
    render(<ImagePreviewCell imageUrl={imageUrl} />);

    await user.click(screen.getByRole("button", { name: title }));
    expect(screen.getByText("sponsor_banner.png")).toBeInTheDocument();
  });

  test("uses fileName prop over URL extraction", async () => {
    const user = userEvent.setup();
    render(<ImagePreviewCell imageUrl={imageUrl} fileName="custom.png" />);

    await user.click(screen.getByRole("button", { name: title }));
    expect(screen.getByText("custom.png")).toBeInTheDocument();
  });

  test("closes dialog when X is clicked", async () => {
    const user = userEvent.setup();
    render(<ImagePreviewCell imageUrl={imageUrl} />);

    await user.click(screen.getByRole("button", { name: title }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });
});
