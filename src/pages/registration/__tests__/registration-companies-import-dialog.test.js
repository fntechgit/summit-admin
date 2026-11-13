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
  it("stays open on a failed import, locks ingest while pending, and closes after a successful import of the selected file", async () => {
    const user = userEvent.setup();
    let resolveImport;
    const onClose = jest.fn();
    const onImport = jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("failed")))
      .mockImplementationOnce(
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
    const ingestBtn = screen.getByRole("button", {
      name: "registration_companies.ingest"
    });

    await user.click(screen.getByTestId("upload-trigger"));
    await user.click(ingestBtn);
    await waitFor(() => expect(ingestBtn).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();

    await user.click(ingestBtn);
    expect(ingestBtn).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    const formData = onImport.mock.calls[1][0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("file").name).toBe("companies.csv");
  });
});
