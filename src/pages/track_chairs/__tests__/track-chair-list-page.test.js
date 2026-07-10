import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "utils/test-utils";
import {
  getTrackChairs,
  saveTrackChair,
  addTrackChair,
  deleteTrackChair
} from "../../../actions/track-chair-actions";
import TrackChairListPage from "../track-chair-list-page";

jest.mock("../../../actions/track-chair-actions", () => ({
  getTrackChairs: jest.fn(() => () => Promise.resolve()),
  deleteTrackChair: jest.fn(() => () => Promise.resolve()),
  saveTrackChair: jest.fn(() => () => Promise.resolve()),
  addTrackChair: jest.fn(() => () => Promise.resolve()),
  exportTrackChairs: jest.fn(() => () => Promise.resolve())
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () =>
    function MockMuiTable({ data, onEdit, onDelete }) {
      return (
        <div>
          {data.map((item) => (
            <div key={item.id}>
              <button
                data-testid={`edit-${item.id}`}
                onClick={() => onEdit(item)}
              >
                edit-{item.id}
              </button>
              <button
                data-testid={`delete-${item.id}`}
                onClick={() => onDelete(item.id)}
              >
                delete-{item.id}
              </button>
            </div>
          ))}
        </div>
      );
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => () => null
);

// Capture the dialog's props so tests can call onSave/onClose with specific values
let capturedDialogProps = null;
jest.mock("../components/track-chair-dialog", () => ({
  __esModule: true,
  default: (props) => {
    capturedDialogProps = props;
    return <div data-testid="track-chair-dialog" />;
  }
}));

const mockTracks = [
  { id: 1, name: "Track A", chair_visible: true },
  { id: 2, name: "Track B", chair_visible: true }
];

const mockTrackChair = {
  id: 10,
  name: "Jane Doe (jane@example.com)",
  member: {
    id: 42,
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com"
  },
  categories: [{ id: 1, name: "Track A" }],
  trackIds: [1],
  trackNames: "Track A"
};

const initialState = {
  currentSummitState: {
    currentSummit: { id: 1, name: "Test Summit", tracks: mockTracks }
  },
  trackChairListState: {
    trackChairs: [],
    trackId: null,
    term: "",
    order: "id",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalTrackChairs: 0
  }
};

describe("TrackChairListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDialogProps = null;
  });

  const renderPage = (stateOverrides = {}) =>
    renderWithRedux(<TrackChairListPage history={{ push: jest.fn() }} />, {
      initialState: {
        ...initialState,
        trackChairListState: {
          ...initialState.trackChairListState,
          ...stateOverrides
        }
      }
    });

  describe("dialog visibility", () => {
    it("shows after clicking Add and closes when onClose is called", async () => {
      renderPage();
      expect(
        screen.queryByTestId("track-chair-dialog")
      ).not.toBeInTheDocument();

      await act(async () => {
        await userEvent.click(screen.getByRole("button", { name: /add/i }));
      });
      expect(screen.getByTestId("track-chair-dialog")).toBeInTheDocument();

      await act(async () => {
        capturedDialogProps.onClose();
      });
      expect(
        screen.queryByTestId("track-chair-dialog")
      ).not.toBeInTheDocument();
    });
  });

  describe("handleEdit", () => {
    it("passes the correct entity shape to the dialog", async () => {
      renderPage({ trackChairs: [mockTrackChair] });

      await act(async () => {
        await userEvent.click(screen.getByTestId(`edit-${mockTrackChair.id}`));
      });

      expect(capturedDialogProps.entity).toEqual({
        id: mockTrackChair.id,
        member: mockTrackChair.member,
        trackIds: [1] // mapped from categories
      });
    });
  });

  describe("handleDelete", () => {
    it("calls deleteTrackChair with the row id", async () => {
      renderPage({ trackChairs: [mockTrackChair] });

      await act(async () => {
        await userEvent.click(
          screen.getByTestId(`delete-${mockTrackChair.id}`)
        );
      });

      expect(deleteTrackChair).toHaveBeenCalledWith(mockTrackChair.id);
    });

    it("reloads the list on the first page after a successful delete", async () => {
      renderPage({
        trackChairs: [mockTrackChair],
        currentPage: 3,
        term: "abc",
        order: "trackName",
        orderDir: -1
      });

      await act(async () => {
        await userEvent.click(
          screen.getByTestId(`delete-${mockTrackChair.id}`)
        );
      });

      expect(getTrackChairs).toHaveBeenLastCalledWith(
        null,
        "abc",
        1,
        10,
        "trackName",
        -1
      );
    });
  });

  describe("handleSave", () => {
    it("calls addTrackChair when saving a new chair (no id)", async () => {
      renderPage();

      await act(async () => {
        await userEvent.click(screen.getByRole("button", { name: /add/i }));
      });

      await act(async () => {
        await capturedDialogProps.onSave({
          id: 0,
          member: { value: 99, label: "New Member" },
          trackIds: [1]
        });
      });

      expect(addTrackChair).toHaveBeenCalledWith({ id: 99 }, [1]);
      expect(saveTrackChair).not.toHaveBeenCalled();
      // adding resets back to the first page
      expect(getTrackChairs).toHaveBeenLastCalledWith(null, "", 1, 10, "id", 1);
    });

    it("calls saveTrackChair when editing an existing chair, keeping the current page", async () => {
      renderPage({ trackChairs: [mockTrackChair], currentPage: 3 });

      await act(async () => {
        await userEvent.click(screen.getByTestId(`edit-${mockTrackChair.id}`));
      });

      await act(async () => {
        await capturedDialogProps.onSave({
          id: mockTrackChair.id,
          member: { value: 42 },
          trackIds: [1, 2]
        });
      });

      expect(saveTrackChair).toHaveBeenCalledWith(mockTrackChair.id, [1, 2]);
      expect(addTrackChair).not.toHaveBeenCalled();
      // editing stays on the current page instead of resetting to the first one
      expect(getTrackChairs).toHaveBeenLastCalledWith(null, "", 3, 10, "id", 1);
    });

    it("resolves (and lets the dialog close) even if the post-save reload fails", async () => {
      renderPage();

      await act(async () => {
        await userEvent.click(screen.getByRole("button", { name: /add/i }));
      });

      // only the reload triggered by save should reject, not the initial mount load
      getTrackChairs.mockImplementationOnce(
        () => () => Promise.reject(new Error("network blip"))
      );

      let saveResult;
      await act(async () => {
        saveResult = capturedDialogProps.onSave({
          id: 0,
          member: { value: 99, label: "New Member" },
          trackIds: [1]
        });
      });

      await expect(saveResult).resolves.toBeUndefined();
    });
  });
});
