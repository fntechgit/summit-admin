// mui-qr-badge-popup.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MuiQrBadgePopup from "../mui-qr-badge-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("moment-timezone", () => {
  const mockMoment = jest.fn(() => ({ unix: () => 1234567890 }));
  return mockMoment;
});

jest.mock("../../qr-reader", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onScan, onError }) => (
      <div data-testid="qr-reader">
        <button type="button" onClick={() => onScan("TEST_QR_CODE")}>
          Simulate Scan
        </button>
        <button type="button" onClick={() => onError("scan-error")}>
          Simulate Error
        </button>
      </div>
    )
  };
});

jest.mock("../formik-inputs/mui-formik-async-select", () => {
  const React = require("react");
  const { useField } = require("formik");
  return {
    __esModule: true,
    default: ({ name, placeholder }) => {
      const [field, , helpers] = useField(name);
      return (
        <input
          data-testid={`async-select-${name}`}
          placeholder={placeholder}
          value={field.value?.label || ""}
          onChange={(e) =>
            helpers.setValue({ value: e.target.value, label: e.target.value })
          }
        />
      );
    }
  };
});

jest.mock(
  "openstack-uicore-foundation/lib/components/extra-questions-mui",
  () => ({
    __esModule: true,
    default: () => <div data-testid="extra-questions" />
  })
);

const mockErrorMessage = jest.fn();
jest.mock("../SnackbarNotification/Context", () => ({
  useSnackbarMessage: () => ({ errorMessage: mockErrorMessage })
}));

jest.mock("../../../actions/attendee-actions", () => ({
  queryAttendees: jest.fn()
}));

jest.mock("@mui/material/IconButton", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, onClick, ...rest }) => (
      <button type="button" onClick={onClick} {...rest}>
        {children}
      </button>
    )
  };
});

const defaultProps = {
  onClose: jest.fn(),
  onSave: jest.fn(),
  extraQuestions: [],
  isAdmin: false,
  summitId: 123
};

const renderComponent = (props = {}) =>
  render(<MuiQrBadgePopup {...defaultProps} {...props} />);

describe("MuiQrBadgePopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should render radio buttons, no content panels, and a disabled submit button", () => {
      renderComponent();

      expect(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.attendee"
        })
      ).toBeInTheDocument();
      expect(screen.queryByTestId("qr-reader")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("async-select-attendee_email")
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled();
    });

    it("should call onClose when close button is clicked", async () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      await userEvent.click(screen.getByRole("button", { name: "" }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("QR scan mode", () => {
    it("should show QR reader and keep submit disabled when QR mode is selected", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );

      expect(screen.getByTestId("qr-reader")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled();
    });

    it("should show success alert, hide QR reader, and enable submit after scanning", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );
      await userEvent.click(screen.getByText("Simulate Scan"));

      expect(
        screen.getByText("sponsor_badge_scans.scan_popup.badge_scanned")
      ).toBeInTheDocument();
      expect(screen.queryByTestId("qr-reader")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).not.toBeDisabled();
    });

    it("should restore QR reader when rescan button is clicked", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );
      await userEvent.click(screen.getByText("Simulate Scan"));
      await userEvent.click(
        screen.getByRole("button", {
          name: "sponsor_badge_scans.scan_popup.rescan"
        })
      );

      expect(screen.getByTestId("qr-reader")).toBeInTheDocument();
      expect(
        screen.queryByText("sponsor_badge_scans.scan_popup.badge_scanned")
      ).not.toBeInTheDocument();
    });

    it("should call error handler when QR scan fails", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );
      await userEvent.click(screen.getByText("Simulate Error"));

      expect(mockErrorMessage).toHaveBeenCalledWith(
        "sponsor_badge_scans.scan_popup.error"
      );
    });

    it("should submit payload with qr_code only and no attendee_email", async () => {
      const onSave = jest.fn();
      renderComponent({ onSave });

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );
      await userEvent.click(screen.getByText("Simulate Scan"));
      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ qr_code: "TEST_QR_CODE" })
        );
        const [payload] = onSave.mock.calls[0];
        expect(payload).not.toHaveProperty("attendee_email");
      });
    });
  });

  describe("Attendee mode", () => {
    it("should show attendee autocomplete and keep submit disabled when attendee mode is selected", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.attendee"
        })
      );

      expect(
        screen.getByTestId("async-select-attendee_email")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled();
    });

    it("should enable submit and send attendee_email only after selecting an attendee", async () => {
      const onSave = jest.fn();
      renderComponent({ onSave });

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.attendee"
        })
      );
      await userEvent.type(
        screen.getByTestId("async-select-attendee_email"),
        "john@example.com"
      );

      expect(
        screen.getByRole("button", { name: "general.save" })
      ).not.toBeDisabled();

      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ attendee_email: "john@example.com" })
        );
        const [payload] = onSave.mock.calls[0];
        expect(payload).not.toHaveProperty("qr_code");
      });
    });
  });

  describe("Mode switching", () => {
    it("should hide QR reader when switching from QR to attendee mode", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );
      expect(screen.getByTestId("qr-reader")).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.attendee"
        })
      );

      expect(screen.queryByTestId("qr-reader")).not.toBeInTheDocument();
      expect(
        screen.getByTestId("async-select-attendee_email")
      ).toBeInTheDocument();
    });

    it("should reset scanned QR code when switching mode", async () => {
      renderComponent();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );
      await userEvent.click(screen.getByText("Simulate Scan"));
      expect(
        screen.getByText("sponsor_badge_scans.scan_popup.badge_scanned")
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.attendee"
        })
      );
      await userEvent.click(
        screen.getByRole("radio", {
          name: "sponsor_badge_scans.scan_popup.scan_qr"
        })
      );

      expect(screen.getByTestId("qr-reader")).toBeInTheDocument();
      expect(
        screen.queryByText("sponsor_badge_scans.scan_popup.badge_scanned")
      ).not.toBeInTheDocument();
    });
  });

  describe("Admin-only fields", () => {
    const extraQuestions = [
      { id: 1, name: "Company", type: "Text", order: 1 },
      { id: 2, name: "Title", type: "Text", order: 2 }
    ];

    it("should show notes field and extra questions for admin when questions are provided", () => {
      renderComponent({ isAdmin: true, extraQuestions });

      expect(screen.getByText("edit_badge_scan.notes")).toBeInTheDocument();
      expect(screen.getByTestId("extra-questions")).toBeInTheDocument();
    });

    it("should not show notes field or extra questions for non-admin users", () => {
      renderComponent({ isAdmin: false, extraQuestions });

      expect(
        screen.queryByText("edit_badge_scan.notes")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("extra-questions")).not.toBeInTheDocument();
    });

    it("should not show extra questions when list is empty even for admin", () => {
      renderComponent({ isAdmin: true, extraQuestions: [] });

      expect(screen.queryByTestId("extra-questions")).not.toBeInTheDocument();
    });
  });
});
