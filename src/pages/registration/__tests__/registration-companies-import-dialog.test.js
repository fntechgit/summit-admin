import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RegistrationCompaniesImportDialog from "../registration-companies-import-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
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
        onClick={() => handleUpload(new File([""], "companies.csv"))}
        data-testid="upload-trigger"
      >
        pick file
      </button>
    )
  })
);

describe("RegistrationCompaniesImportDialog", () => {
  const selectFile = async (user) => {
    await user.click(screen.getByTestId("upload-trigger"));
  };

  const getIngestButton = () =>
    screen.getByRole("button", { name: "registration_companies.ingest" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onImport with a FormData containing the selected file", async () => {
    const user = userEvent.setup();
    const onImport = jest.fn(() => Promise.resolve());
    render(
      <RegistrationCompaniesImportDialog
        onClose={jest.fn()}
        onImport={onImport}
      />
    );

    await selectFile(user);
    await user.click(getIngestButton());

    expect(onImport).toHaveBeenCalledTimes(1);
    const formData = onImport.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("file").name).toBe("companies.csv");
  });

  it("closes the dialog when onImport resolves", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onImport = jest.fn(() => Promise.resolve());
    render(
      <RegistrationCompaniesImportDialog
        onClose={onClose}
        onImport={onImport}
      />
    );

    await selectFile(user);
    await user.click(getIngestButton());

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("keeps the dialog open and re-enables the ingest button when onImport rejects", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onImport = jest.fn(() => Promise.reject(new Error("failed")));
    render(
      <RegistrationCompaniesImportDialog
        onClose={onClose}
        onImport={onImport}
      />
    );

    await selectFile(user);
    await user.click(getIngestButton());

    await waitFor(() => expect(getIngestButton()).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("guards against double-submit and close while a save is pending, then settles", async () => {
    const user = userEvent.setup();
    let resolveImport;
    const onClose = jest.fn();
    const onImport = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        })
    );
    render(
      <RegistrationCompaniesImportDialog
        onClose={onClose}
        onImport={onImport}
      />
    );

    await selectFile(user);
    const ingestBtn = getIngestButton();
    await user.click(ingestBtn);

    expect(ingestBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: "close" })).toBeDisabled();
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledTimes(1);
  });
});
