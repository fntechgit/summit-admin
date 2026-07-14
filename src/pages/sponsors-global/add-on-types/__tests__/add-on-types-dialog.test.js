import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AddOnTypesDialog from "../add-on-types-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: jest.fn((key) => key) }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () =>
    function MockTextField({ name, ...rest }) {
      return <input data-testid={`textfield-${name}`} name={name} {...rest} />;
    }
);

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

jest.mock("../../../../utils/yup", () => ({
  requiredStringValidation: () => {
    const yup = jest.requireActual("yup");
    return yup.string().required("required");
  }
}));

const BASE_ENTITY = { id: 0, name: "" };

describe("AddOnTypesDialog", () => {
  let onSave;
  let onClose;

  beforeEach(() => {
    jest.clearAllMocks();
    onSave = jest.fn(() => Promise.resolve());
    onClose = jest.fn();
  });

  it("shows \"Add\" in the title for a new entity", () => {
    render(
      <AddOnTypesDialog
        entity={BASE_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(screen.getByText(/general\.add/i)).toBeInTheDocument();
  });

  it("shows \"Edit\" in the title when editing an existing entity", () => {
    render(
      <AddOnTypesDialog
        entity={{ id: 3, name: "VIP" }}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(screen.getByText(/general\.edit/i)).toBeInTheDocument();
  });

  it("calls onSave with form values then onClose on valid submit", async () => {
    const user = userEvent.setup();
    render(
      <AddOnTypesDialog
        entity={{ id: 2, name: "Early Bird" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await act(async () => {
      await user.click(screen.getByText("general.save"));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, name: "Early Bird" })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("disables save and close while saving, re-enables after resolve", async () => {
    let resolve;
    onSave = jest.fn(
      () =>
        new Promise((res) => {
          resolve = res;
        })
    );
    const user = userEvent.setup();

    render(
      <AddOnTypesDialog
        entity={{ id: 1, name: "VIP" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const saveBtn = screen.getByText("general.save").closest("button");

    await act(async () => {
      await user.click(saveBtn);
    });
    expect(saveBtn).toBeDisabled();
    expect(screen.getByLabelText("close")).toBeDisabled();

    await act(async () => {
      resolve();
    });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it("keeps dialog open and re-enables save when onSave rejects", async () => {
    onSave = jest.fn(() => Promise.reject(new Error("server error")));
    const user = userEvent.setup();

    render(
      <AddOnTypesDialog
        entity={{ id: 1, name: "VIP" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const saveBtn = screen.getByText("general.save").closest("button");
    await act(async () => {
      await user.click(saveBtn);
    });

    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the close button is clicked and not saving", async () => {
    const user = userEvent.setup();
    render(
      <AddOnTypesDialog
        entity={BASE_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await act(async () => {
      await user.click(screen.getByLabelText("close"));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
