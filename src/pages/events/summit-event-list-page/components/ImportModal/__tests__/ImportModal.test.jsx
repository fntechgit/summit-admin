import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImportModal from "../index";

const mockErrorMessage = jest.fn();

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ errorMessage: mockErrorMessage })
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input",
  () => ({
    __esModule: true,
    default: ({ handleUpload, handleRemove, value }) => (
      <div>
        <button
          type="button"
          onClick={() => handleUpload(new File(["a,b"], "events.csv"))}
        >
          upload-file
        </button>
        {value && (
          <button type="button" onClick={handleRemove}>
            remove-file
          </button>
        )}
      </div>
    )
  })
);

describe("ImportModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    mockErrorMessage.mockClear();
  });

  const setup = (onImport) =>
    render(<ImportModal show onClose={onClose} onImport={onImport} />);

  test("Ingest button is disabled until a file is selected", () => {
    setup(jest.fn());

    expect(screen.getByText("event_list.ingest")).toBeDisabled();

    fireEvent.click(screen.getByText("upload-file"));

    expect(screen.getByText("event_list.ingest")).not.toBeDisabled();
  });

  test("does not call onImport when clicked without a file selected", () => {
    const onImport = jest.fn();
    setup(onImport);

    fireEvent.click(screen.getByText("event_list.ingest"));

    expect(onImport).not.toHaveBeenCalled();
  });

  test("passes the selected file and send-speaker-email flag to onImport", () => {
    const onImport = jest.fn(() => new Promise(() => {}));
    setup(onImport);

    fireEvent.click(screen.getByText("upload-file"));
    fireEvent.click(screen.getByLabelText("event_list.send_speaker_email"));
    fireEvent.click(screen.getByText("event_list.ingest"));

    expect(onImport).toHaveBeenCalledWith(expect.any(File), true);
  });

  test("closes the dialog only after onImport resolves", async () => {
    let resolveImport;
    const onImport = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        })
    );
    setup(onImport);

    fireEvent.click(screen.getByText("upload-file"));
    fireEvent.click(screen.getByText("event_list.ingest"));

    expect(onClose).not.toHaveBeenCalled();

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test("shows an error and keeps the dialog open when onImport rejects", async () => {
    const onImport = jest.fn(() => Promise.reject(new Error("boom")));
    setup(onImport);

    fireEvent.click(screen.getByText("upload-file"));
    fireEvent.click(screen.getByText("event_list.ingest"));

    await waitFor(() =>
      expect(mockErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("event_list.import_events_error")
      )
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  test("a second click while an import is in flight does not fire a second onImport call", async () => {
    let resolveImport;
    const onImport = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        })
    );
    setup(onImport);

    fireEvent.click(screen.getByText("upload-file"));
    fireEvent.click(screen.getByText("event_list.ingest"));
    fireEvent.click(screen.getByText("event_list.ingest"));

    expect(onImport).toHaveBeenCalledTimes(1);

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test("disables the ingest and close buttons while an import is in flight", async () => {
    let resolveImport;
    const onImport = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        })
    );
    setup(onImport);

    fireEvent.click(screen.getByText("upload-file"));
    fireEvent.click(screen.getByText("event_list.ingest"));

    expect(screen.getByText("event_list.ingest")).toBeDisabled();
    expect(screen.getByLabelText("close")).toBeDisabled();

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test("the close button does not call onClose while an import is in flight", () => {
    const onImport = jest.fn(() => new Promise(() => {}));
    setup(onImport);

    fireEvent.click(screen.getByText("upload-file"));
    fireEvent.click(screen.getByText("event_list.ingest"));
    fireEvent.click(screen.getByLabelText("close"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
