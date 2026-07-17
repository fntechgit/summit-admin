import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImportMUXModal from "../index";

const mockErrorMessage = jest.fn();

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ errorMessage: mockErrorMessage })
  })
);

describe("ImportMUXModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    mockErrorMessage.mockClear();
  });

  const setup = (onImport) =>
    render(<ImportMUXModal show onClose={onClose} onImport={onImport} />);

  test("shows a validation error and does not call onImport when tokens are missing", () => {
    const onImport = jest.fn();
    setup(onImport);

    fireEvent.click(screen.getByText("event_list.import"));

    expect(mockErrorMessage).toHaveBeenCalledWith(
      "event_list.missing_token_error"
    );
    expect(onImport).not.toHaveBeenCalled();
  });

  test("calls onImport with tokenId/tokenSecret/emailTo and closes only on success", async () => {
    let resolveImport;
    const onImport = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        })
    );
    setup(onImport);

    fireEvent.change(screen.getByLabelText("event_list.mux_token_id"), {
      target: { value: "tid" }
    });
    fireEvent.change(screen.getByLabelText("event_list.mux_token_secret"), {
      target: { value: "tsecret" }
    });
    fireEvent.change(screen.getByLabelText("event_list.mux_email_to"), {
      target: { value: "a@b.com" }
    });
    fireEvent.click(screen.getByText("event_list.import"));

    expect(onImport).toHaveBeenCalledWith("tid", "tsecret", "a@b.com");
    expect(onClose).not.toHaveBeenCalled();

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test("shows an error and keeps the dialog open when onImport rejects", async () => {
    const onImport = jest.fn(() => Promise.reject(new Error("boom")));
    setup(onImport);

    fireEvent.change(screen.getByLabelText("event_list.mux_token_id"), {
      target: { value: "tid" }
    });
    fireEvent.change(screen.getByLabelText("event_list.mux_token_secret"), {
      target: { value: "tsecret" }
    });
    fireEvent.click(screen.getByText("event_list.import"));

    await waitFor(() =>
      expect(mockErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("event_list.mux_import_error")
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

    fireEvent.change(screen.getByLabelText("event_list.mux_token_id"), {
      target: { value: "tid" }
    });
    fireEvent.change(screen.getByLabelText("event_list.mux_token_secret"), {
      target: { value: "tsecret" }
    });
    fireEvent.click(screen.getByText("event_list.import"));
    fireEvent.click(screen.getByText("event_list.import"));

    expect(onImport).toHaveBeenCalledTimes(1);

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test("disables the import and close buttons while an import is in flight", async () => {
    let resolveImport;
    const onImport = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        })
    );
    setup(onImport);

    fireEvent.change(screen.getByLabelText("event_list.mux_token_id"), {
      target: { value: "tid" }
    });
    fireEvent.change(screen.getByLabelText("event_list.mux_token_secret"), {
      target: { value: "tsecret" }
    });
    fireEvent.click(screen.getByText("event_list.import"));

    expect(screen.getByText("event_list.import")).toBeDisabled();
    expect(screen.getByLabelText("close")).toBeDisabled();

    resolveImport();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test("the close button does not call onClose while an import is in flight", () => {
    const onImport = jest.fn(() => new Promise(() => {}));
    setup(onImport);

    fireEvent.change(screen.getByLabelText("event_list.mux_token_id"), {
      target: { value: "tid" }
    });
    fireEvent.change(screen.getByLabelText("event_list.mux_token_secret"), {
      target: { value: "tsecret" }
    });
    fireEvent.click(screen.getByText("event_list.import"));
    fireEvent.click(screen.getByLabelText("close"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
