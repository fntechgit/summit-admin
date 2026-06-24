import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import T from "i18n-react/dist/i18n-react";
import PreviewModal from "../PreviewModal";

describe("PreviewModal", () => {
  const baseProps = {
    title: "Test Image",
    open: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title", () => {
    render(<PreviewModal {...baseProps} />);
    expect(screen.getByText("Test Image")).toBeInTheDocument();
  });

  test("shows image when url is provided", () => {
    render(
      <PreviewModal
        {...baseProps}
        url="https://example.com/img.png"
        filename="img.png"
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/img.png"
    );
  });

  test("shows broken image icon when url is not provided", () => {
    render(<PreviewModal {...baseProps} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("shows filename when provided", () => {
    render(<PreviewModal {...baseProps} filename="sponsor.png" />);
    expect(
      screen.getByText(T.translate("preview_modal.file_name"))
    ).toBeInTheDocument();
    expect(screen.getByText("sponsor.png")).toBeInTheDocument();
  });

  test("does not show filename row when filename is empty", () => {
    render(<PreviewModal {...baseProps} filename="" />);
    expect(
      screen.queryByText(T.translate("preview_modal.file_name"))
    ).not.toBeInTheDocument();
  });

  test("shows formatted uploadDate when provided", () => {
    render(<PreviewModal {...baseProps} uploadDate={1748995860} />);
    expect(
      screen.getByText(T.translate("preview_modal.uploaded"))
    ).toBeInTheDocument();
  });

  test("does not show uploaded row when uploadDate is 0", () => {
    render(<PreviewModal {...baseProps} uploadDate={0} />);
    expect(
      screen.queryByText(T.translate("preview_modal.uploaded"))
    ).not.toBeInTheDocument();
  });

  test("calls onClose when X button is clicked", async () => {
    const user = userEvent.setup();
    render(<PreviewModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "close" }));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when clicking outside the dialog", async () => {
    render(<PreviewModal {...baseProps} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("does not render dialog when open is false", () => {
    render(<PreviewModal {...baseProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows broken image icon when image fails to load", () => {
    render(
      <PreviewModal
        {...baseProps}
        url="https://example.com/img.png"
        filename="img.png"
      />
    );
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("resets image error when modal is reopened", () => {
    const { rerender } = render(
      <PreviewModal
        {...baseProps}
        url="https://example.com/img.png"
        filename="img.png"
      />
    );

    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(
      <PreviewModal
        {...baseProps}
        open={false}
        url="https://example.com/img.png"
        filename="img.png"
      />
    );
    rerender(
      <PreviewModal
        {...baseProps}
        open
        url="https://example.com/img.png"
        filename="img.png"
      />
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
