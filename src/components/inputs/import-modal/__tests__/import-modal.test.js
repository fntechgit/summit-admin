/* eslint-disable react/jsx-props-no-spreading */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ImportModal from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input",
  () => ({
    __esModule: true,
    default: ({ handleUpload }) => (
      <button
        type="button"
        onClick={() => handleUpload(new File([""], "data.csv"))}
        data-testid="upload-trigger"
      >
        pick file
      </button>
    )
  })
);

describe("ImportModal", () => {
  const baseProps = {
    title: "Import Members",
    show: true,
    wrapperClass: "test-wrapper",
    onHide: jest.fn(),
    onIngest: jest.fn(),
    children: <span>format help</span>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders in MUI Dialog layer (not bootstrap modal)", () => {
    render(<ImportModal {...baseProps} />);
    // MUI Dialog root must exist - proves it uses MUI, not bootstrap
    expect(document.querySelector(".MuiDialog-root")).toBeTruthy();
    // Bootstrap modal-backdrop must NOT exist - proves no z-index 1040/1050 layer
    expect(document.querySelector(".modal-backdrop")).toBeNull();
  });

  it("shows title and children when open", () => {
    render(<ImportModal {...baseProps} />);
    expect(screen.getByText("Import Members")).toBeInTheDocument();
    expect(screen.getByText("format help")).toBeInTheDocument();
  });

  it("ingest button is disabled before a file is selected", () => {
    render(<ImportModal {...baseProps} />);
    expect(
      screen.getByRole("button", { name: "general.ingest" })
    ).toBeDisabled();
  });

  it("enables ingest and calls onIngest after a file is selected", async () => {
    render(<ImportModal {...baseProps} />);
    await userEvent.click(screen.getByTestId("upload-trigger"));
    const ingestBtn = screen.getByRole("button", { name: "general.ingest" });
    expect(ingestBtn).not.toBeDisabled();
    await userEvent.click(ingestBtn);
    expect(baseProps.onIngest).toHaveBeenCalledWith(expect.any(File));
  });

  it("calls onHide when the close button is clicked", async () => {
    render(<ImportModal {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(baseProps.onHide).toHaveBeenCalled();
  });

  it("does not render dialog content when show is false", () => {
    render(<ImportModal {...baseProps} show={false} />);
    expect(document.querySelector(".MuiDialog-root")).toBeNull();
  });
});
