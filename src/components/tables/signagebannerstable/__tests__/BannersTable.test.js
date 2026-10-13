import React from "react";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../../utils/test-utils";
import showConfirmDialog from "../../../mui/showConfirmDialog";
import {
  saveBanner,
  deleteBanner,
  publishDate
} from "../../../../actions/signage-actions";
import { BannersTable } from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("../../../../actions/signage-actions", () => ({
  saveBanner: jest.fn(),
  deleteBanner: jest.fn(),
  publishDate: jest.fn()
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/datetimepicker",
  () => ({
    __esModule: true,
    default: ({ id }) => <input data-testid={id} />
  })
);

jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

const BANNERS = [
  {
    id: 1,
    title: "First",
    content: "first content",
    type: "Primary",
    floor_loc: "Room A",
    start_date: 1000,
    end_date: 2000,
    start_date_str: "1/1 10:00 am",
    end_date_str: "1/1 11:00 am"
  },
  {
    id: 2,
    title: "Second",
    content: "second content",
    type: "Primary",
    floor_loc: "Room A",
    start_date: 3000,
    end_date: 4000,
    start_date_str: "1/1 12:00 pm",
    end_date_str: "1/1 1:00 pm"
  }
];

const INITIAL_STATE = {
  currentSummitState: { currentSummit: { time_zone_id: "UTC" } }
};

// connect() dispatches what the action creator returns, so return thunks
const thunkResolving = () => () => Promise.resolve();
const thunkRejecting = () => () => Promise.reject(new Error("failed"));

const renderTable = () =>
  renderWithRedux(<BannersTable data={BANNERS} room={{ name: "Room A" }} />, {
    initialState: INITIAL_STATE
  });

const getRow = (id) => document.querySelector(`tr[id="${id}"]`);
const getAction = (id, action) =>
  getRow(id).querySelector(`[data-tooltip-content="${action}"]`);
const getNewRow = () => document.querySelector("tr#new_row");

describe("BannersTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveBanner.mockImplementation(thunkResolving);
    deleteBanner.mockImplementation(thunkResolving);
    publishDate.mockImplementation(thunkResolving);
  });

  it("locks the other rows' actions and the Add button while a row is edited", async () => {
    renderTable();

    await userEvent.click(getAction(1, "edit"));

    expect(getAction(1, "save")).toBeInTheDocument();
    expect(getAction(2, "edit")).toBeNull();
    expect(getAction(2, "delete")).toBeNull();
    expect(getAction(2, "jump to this banner")).toBeNull();
    expect(
      within(getNewRow()).getByRole("button", { name: "general.add" })
    ).toBeDisabled();
  });

  it("restores the original values and unlocks the table on cancel", async () => {
    renderTable();

    await userEvent.click(getAction(1, "edit"));
    const titleInput = getRow(1).querySelector("input#title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Changed");
    await userEvent.click(getAction(1, "cancel"));

    expect(within(getRow(1)).getByText("First")).toBeInTheDocument();
    expect(getAction(2, "edit")).toBeInTheDocument();
  });

  it("keeps the row in edit mode with the typed value when the save fails", async () => {
    saveBanner.mockImplementation(thunkRejecting);
    renderTable();

    await userEvent.click(getAction(1, "edit"));
    const titleInput = getRow(1).querySelector("input#title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Changed");
    await userEvent.click(getAction(1, "save"));

    await waitFor(() =>
      expect(saveBanner).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, title: "Changed" })
      )
    );
    expect(getRow(1).querySelector("input#title")).toHaveValue("Changed");
    expect(getAction(1, "save")).toBeInTheDocument();
  });

  it("keeps the new banner draft when adding fails", async () => {
    saveBanner.mockImplementation(thunkRejecting);
    renderTable();

    const titleInput = getNewRow().querySelector("input#title");
    await userEvent.type(titleInput, "New banner");
    await userEvent.click(
      within(getNewRow()).getByRole("button", { name: "general.add" })
    );

    await waitFor(() => expect(saveBanner).toHaveBeenCalled());
    expect(titleInput).toHaveValue("New banner");
  });

  it("clears the new banner draft after a successful add", async () => {
    renderTable();

    const titleInput = getNewRow().querySelector("input#title");
    await userEvent.type(titleInput, "New banner");
    await userEvent.click(
      within(getNewRow()).getByRole("button", { name: "general.add" })
    );

    await waitFor(() => expect(titleInput).toHaveValue(""));
    expect(saveBanner).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New banner" })
    );
  });

  it("deletes the banner only after the user confirms", async () => {
    showConfirmDialog.mockResolvedValueOnce(false);
    renderTable();

    await userEvent.click(getAction(1, "delete"));
    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalledTimes(1));
    expect(deleteBanner).not.toHaveBeenCalled();

    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(getAction(1, "delete"));
    await waitFor(() => expect(deleteBanner).toHaveBeenCalledWith(1));
  });

  it("jumps to the banner's start date only after the user confirms", async () => {
    showConfirmDialog.mockResolvedValueOnce(false);
    renderTable();

    await userEvent.click(getAction(2, "jump to this banner"));
    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalledTimes(1));
    expect(publishDate).not.toHaveBeenCalled();

    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(getAction(2, "jump to this banner"));
    await waitFor(() => expect(publishDate).toHaveBeenCalledWith(3000));
  });
});
