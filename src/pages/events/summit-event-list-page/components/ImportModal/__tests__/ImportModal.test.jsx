import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImportModal from "../index";

const errorMessage = jest.fn();

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ errorMessage })
  })
);

jest.mock("react-bootstrap", () => {
  const Modal = ({ show, children }) => (show ? <div>{children}</div> : null);
  Modal.Header = ({ children }) => <div>{children}</div>;
  Modal.Title = ({ children }) => <div>{children}</div>;
  Modal.Body = ({ children }) => <div>{children}</div>;
  Modal.Footer = ({ children }) => <div>{children}</div>;
  return { Modal };
});

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
    errorMessage.mockClear();
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
      expect(errorMessage).toHaveBeenCalledWith(
        expect.stringContaining("event_list.import_events_error")
      )
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
