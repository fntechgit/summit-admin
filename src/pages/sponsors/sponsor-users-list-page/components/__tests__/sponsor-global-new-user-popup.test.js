import React from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../utils/test-utils";
import SponsorGlobalNewUserPopup from "../sponsor-global-new-user-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/sponsor-input",
  () => {
    const { useFormikContext } = require("formik");
    return {
      __esModule: true,
      default: ({ name }) => {
        const { setFieldValue } = useFormikContext();
        return (
          <button
            data-testid="sponsor-input"
            type="button"
            onClick={() =>
              setFieldValue(name, { id: "42", name: "Test Sponsor" })
            }
          >
            Select Sponsor
          </button>
        );
      }
    };
  }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () => {
    const { useFormikContext } = require("formik");
    return {
      __esModule: true,
      default: ({ name, label }) => {
        const { values, setFieldValue } = useFormikContext();
        return (
          <input
            data-testid={`field-${name}`}
            aria-label={label}
            value={values[name] || ""}
            onChange={(e) => setFieldValue(name, e.target.value)}
          />
        );
      }
    };
  }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/custom-alert",
  () => ({
    __esModule: true,
    default: () => null
  })
);

const defaultProps = {
  onClose: jest.fn(),
  summitId: 1,
  onSave: jest.fn(() => Promise.resolve())
};

const renderPopup = (props = {}) =>
  renderWithRedux(<SponsorGlobalNewUserPopup {...defaultProps} {...props} />, {
    initialState: {}
  });

describe("SponsorGlobalNewUserPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, email field and invite button", () => {
    renderPopup();

    expect(
      screen.getByText("sponsor_users.new_user.add_user")
    ).toBeInTheDocument();
    expect(screen.getByTestId("field-email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "sponsor_users.new_user.invite"
      })
    ).toBeInTheDocument();
  });

  it("submits invite with correct data then closes", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn(() => Promise.resolve());
    renderPopup({ onClose, onSave });

    await act(async () => {
      await userEvent.click(screen.getByTestId("sponsor-input"));
    });

    await act(async () => {
      await userEvent.type(
        screen.getByTestId("field-email"),
        "user@example.com"
      );
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "sponsor_users.new_user.invite" })
      );
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("user@example.com", "42");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("keeps dialog open when invite fails", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn(() => Promise.reject(new Error("already exists")));
    renderPopup({ onClose, onSave });

    await act(async () => {
      await userEvent.click(screen.getByTestId("sponsor-input"));
    });
    await act(async () => {
      await userEvent.type(
        screen.getByTestId("field-email"),
        "user@example.com"
      );
    });
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "sponsor_users.new_user.invite" })
      );
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("does not submit when email is invalid", async () => {
    const onSave = jest.fn();
    renderPopup({ onSave });

    await act(async () => {
      await userEvent.click(screen.getByTestId("sponsor-input"));
    });

    await act(async () => {
      await userEvent.type(screen.getByTestId("field-email"), "not-an-email");
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "sponsor_users.new_user.invite" })
      );
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it("does not submit when sponsor is not selected", async () => {
    const onSave = jest.fn();
    renderPopup({ onSave });

    await act(async () => {
      await userEvent.type(
        screen.getByTestId("field-email"),
        "user@example.com"
      );
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "sponsor_users.new_user.invite" })
      );
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
