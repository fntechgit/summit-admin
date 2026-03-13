import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "utils/test-utils";
import { cloneGlobalTemplate } from "actions/sponsor-forms-actions";
import GlobalTemplatePopup from "../global-template-popup";

jest.mock("@mui/material", () => {
  const originalModule = jest.requireActual("@mui/material");
  return {
    ...originalModule,
    Dialog: ({ open, onClose, children }) =>
      open ? (
        <div>
          <button type="button" onClick={() => onClose({}, "backdropClick")}>
            dialog-onclose
          </button>
          {children}
        </div>
      ) : null
  };
});

jest.mock("actions/sponsor-forms-actions", () => ({
  cloneGlobalTemplate: jest.fn()
}));

jest.mock("../select-templates-dialog", () => ({
  __esModule: true,
  default: ({ onSave }) => (
    <div>
      <button type="button" onClick={() => onSave([1])}>
        go-sponsorships
      </button>
    </div>
  )
}));

jest.mock("../select-sponsorships-dialog", () => ({
  __esModule: true,
  default: ({ onSave, isSaving }) => (
    <div>
      <span>sponsorships-step</span>
      <button
        type="button"
        onClick={() => onSave([10], false)}
        disabled={isSaving}
      >
        apply-sponsorships
      </button>
    </div>
  )
}));

describe("GlobalTemplatePopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps popup open on clone error", async () => {
    const onClose = jest.fn();
    cloneGlobalTemplate.mockReturnValue(() => Promise.reject(new Error("dup")));

    renderWithRedux(<GlobalTemplatePopup open onClose={onClose} />, {
      initialState: {}
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "go-sponsorships" })
      );
      await userEvent.click(
        screen.getByRole("button", { name: "apply-sponsorships" })
      );
      await Promise.resolve();
    });

    expect(cloneGlobalTemplate).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("sponsorships-step")).toBeTruthy();
  });

  it("resets stage to templates on dialog onClose", async () => {
    const onClose = jest.fn();

    renderWithRedux(<GlobalTemplatePopup open onClose={onClose} />, {
      initialState: {}
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "go-sponsorships" })
      );
    });
    expect(screen.getByText("sponsorships-step")).toBeTruthy();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "dialog-onclose" })
      );
      await Promise.resolve();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "go-sponsorships" })
    ).toBeTruthy();
  });

  it("prevents duplicate clone requests while saving", async () => {
    const onClose = jest.fn();
    let resolveClone;
    const pendingPromise = new Promise((resolve) => {
      resolveClone = resolve;
    });
    cloneGlobalTemplate.mockReturnValue(() => pendingPromise);

    renderWithRedux(<GlobalTemplatePopup open onClose={onClose} />, {
      initialState: {}
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "go-sponsorships" })
      );
    });

    const applyButton = screen.getByRole("button", {
      name: "apply-sponsorships"
    });
    await act(async () => {
      await userEvent.click(applyButton);
      await userEvent.click(applyButton);
    });

    expect(cloneGlobalTemplate).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveClone();
      await Promise.resolve();
    });
  });
});
