import React from "react";
import { act, screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackChairDialog from "../track-chair-dialog";

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryMembers: jest.fn()
}));

jest.mock(
  "../../../../components/mui/formik-inputs/mui-formik-async-select",
  () =>
    function MockMuiFormikAsyncSelect({ name, disabled }) {
      const { useFormikContext } = require("formik");
      const { setFieldValue } = useFormikContext();
      return (
        <button
          type="button"
          data-testid={`async-select-${name}`}
          disabled={disabled}
          onClick={() =>
            setFieldValue(name, {
              value: 42,
              label: "John Doe (john@example.com)"
            })
          }
        >
          select-member
        </button>
      );
    }
);

const mockTracks = [
  { id: 1, name: "Track A" },
  { id: 2, name: "Track B" }
];

describe("TrackChairDialog", () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  const defaultProps = {
    entity: {},
    tracks: mockTracks,
    onSave,
    onClose
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onSave.mockResolvedValue();
  });

  const renderDialog = (props = {}) =>
    render(<TrackChairDialog {...defaultProps} {...props} />);

  const selectMember = async () => {
    await act(async () => {
      await userEvent.click(screen.getByTestId("async-select-member"));
    });
  };

  const selectTrack = async (trackName = "Track A") => {
    await act(async () => {
      await userEvent.click(screen.getByRole("combobox"));
    });
    await act(async () => {
      await userEvent.click(screen.getByRole("option", { name: trackName }));
    });
    // Close the dropdown before interacting with other elements
    await act(async () => {
      await userEvent.keyboard("{Escape}");
    });
  };

  const clickSave = async () => {
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /save/i }));
    });
  };

  const setupPendingSave = () => {
    let resolveSave;
    let rejectSave;
    const pendingPromise = new Promise((resolve, reject) => {
      resolveSave = resolve;
      rejectSave = reject;
    });
    onSave.mockReturnValue(pendingPromise);
    return { resolveSave, rejectSave, pendingPromise };
  };

  describe("validation", () => {
    it("blocks submit when member is empty", async () => {
      renderDialog();
      await clickSave();
      expect(onSave).not.toHaveBeenCalled();
    });

    it("blocks submit and shows error when trackIds is empty", async () => {
      renderDialog();
      await selectMember();
      await clickSave();
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText("validation.required")).toBeInTheDocument();
    });
  });

  describe("valid submit", () => {
    it("calls onSave with { id, member, trackIds } and then onClose on valid submit", async () => {
      renderDialog();
      await selectMember();
      await selectTrack("Track A");
      await clickSave();
      expect(onSave).toHaveBeenCalledWith({
        id: 0,
        member: { value: 42, label: "John Doe (john@example.com)" },
        trackIds: [1]
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("pre-fills entity values and submits member as { value, label }", async () => {
      const entity = {
        id: 5,
        member: {
          id: 10,
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@example.com"
        },
        trackIds: [2]
      };
      renderDialog({ entity });
      await clickSave();
      expect(onSave).toHaveBeenCalledWith({
        id: 5,
        member: { value: 10, label: "Jane Doe (jane@example.com)" },
        trackIds: [2]
      });
    });

    it("disables the member field when editing an existing chair", () => {
      const entity = {
        id: 5,
        member: {
          id: 10,
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@example.com"
        },
        trackIds: [1]
      };
      renderDialog({ entity });
      expect(screen.getByTestId("async-select-member")).toBeDisabled();
    });
  });

  describe("isSaving behavior", () => {
    it("disables save and close buttons while saving, re-enables after resolve", async () => {
      const { resolveSave } = setupPendingSave();
      renderDialog();
      await selectMember();
      await selectTrack();
      await clickSave();

      expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /close/i })).toBeDisabled();

      await act(async () => {
        resolveSave();
        await Promise.resolve();
      });

      expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /close/i })).not.toBeDisabled();
    });

    it("re-enables buttons after save rejects", async () => {
      const { rejectSave, pendingPromise } = setupPendingSave();
      renderDialog();
      await selectMember();
      await selectTrack();
      await clickSave();

      await act(async () => {
        rejectSave(new Error("save failed"));
        await pendingPromise.catch(() => {});
      });

      expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /close/i })).not.toBeDisabled();
    });

    it("does not call onClose when Escape is pressed during a save", async () => {
      const { resolveSave } = setupPendingSave();
      renderDialog();
      await selectMember();
      await selectTrack();
      await clickSave();

      // disableEscapeKeyDown={true} while isSaving — onClose must not fire
      await act(async () => {
        await userEvent.keyboard("{Escape}");
      });

      expect(onClose).not.toHaveBeenCalled();

      await act(async () => {
        resolveSave();
        await Promise.resolve();
      });
    });

    it("calls onClose when the close button is clicked and not saving", async () => {
      renderDialog();
      await act(async () => {
        await userEvent.click(screen.getByRole("button", { name: /close/i }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
