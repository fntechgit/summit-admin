import React from "react";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Swal from "sweetalert2";
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

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
}));

// typing a number sets that many epoch seconds, like the real picker's moment value
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/datetimepicker",
  () => ({
    __esModule: true,
    default: ({ id, onChange, inputProps }) => (
      <input
        id={id}
        disabled={inputProps?.disabled}
        onChange={(ev) =>
          onChange({
            target: {
              id,
              type: "datetime",
              value: { valueOf: () => Number(ev.target.value) * 1000 }
            }
          })
        }
      />
    )
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
const thunkPending = () => () => new Promise(() => {});
// holds the save open until the test calls resolve()
const deferredSave = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  saveBanner.mockImplementation(() => () => promise);
  return resolve;
};

const renderTable = () =>
  renderWithRedux(<BannersTable data={BANNERS} room={{ name: "Room A" }} />, {
    initialState: INITIAL_STATE
  });

const getRow = (id) => document.querySelector(`tr[id="${id}"]`);
const getAction = (id, action) =>
  getRow(id).querySelector(`[data-tooltip-content="${action}"]`);
const getNewRow = () => document.querySelector("tr#new_row");
const getAddButton = () =>
  within(getNewRow()).getByRole("button", { name: "general.add" });

const fillNewRow = async ({
  title = "New banner",
  content = "new content",
  start = "1000",
  end = "2000"
} = {}) => {
  const row = getNewRow();
  if (title) await userEvent.type(row.querySelector("input#title"), title);
  if (content)
    await userEvent.type(row.querySelector("input#content"), content);
  if (start) await userEvent.type(row.querySelector("input#start_date"), start);
  if (end) await userEvent.type(row.querySelector("input#end_date"), end);
};

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

    await fillNewRow();
    await userEvent.click(getAddButton());

    await waitFor(() => expect(saveBanner).toHaveBeenCalled());
    expect(getNewRow().querySelector("input#title")).toHaveValue("New banner");
  });

  it("a second click on Add while saving does not call saveBanner again", async () => {
    saveBanner.mockImplementation(thunkPending);
    renderTable();

    await fillNewRow();
    await userEvent.click(getAddButton());
    await userEvent.click(getAddButton());

    expect(saveBanner).toHaveBeenCalledTimes(1);
    expect(getAddButton()).toBeDisabled();
  });

  it("hides a row's save while saving so it cannot be clicked again", async () => {
    saveBanner.mockImplementation(thunkPending);
    renderTable();

    await userEvent.click(getAction(1, "edit"));
    await userEvent.click(getAction(1, "save"));

    expect(getAction(1, "save")).toBeNull();
    expect(saveBanner).toHaveBeenCalledTimes(1);
  });

  it("locks every row's actions while adding a banner", async () => {
    const resolveSave = deferredSave();
    renderTable();

    await fillNewRow();
    await userEvent.click(getAddButton());

    expect(getAction(1, "edit")).toBeNull();
    expect(getAction(2, "edit")).toBeNull();

    resolveSave();

    await waitFor(() => expect(getAction(1, "edit")).toBeInTheDocument());
  });

  it("disables the new banner inputs while adding, then clears them", async () => {
    const resolveSave = deferredSave();
    renderTable();

    await fillNewRow();
    await userEvent.click(getAddButton());

    const inputs = getNewRow().querySelectorAll("input");
    inputs.forEach((input) => expect(input).toBeDisabled());

    resolveSave();

    await waitFor(() =>
      expect(getNewRow().querySelector("input#title")).toBeEnabled()
    );
    expect(getNewRow().querySelector("input#title")).toHaveValue("");
  });

  it("disables the edited row's inputs while saving it", async () => {
    const resolveSave = deferredSave();
    renderTable();

    await userEvent.click(getAction(1, "edit"));
    await userEvent.click(getAction(1, "save"));

    const inputs = getRow(1).querySelectorAll("input");
    expect(inputs).toHaveLength(4);
    inputs.forEach((input) => expect(input).toBeDisabled());

    resolveSave();

    await waitFor(() => expect(getRow(1).querySelector("input")).toBeNull());
    expect(getAction(1, "edit")).toBeInTheDocument();
  });

  it("clears the new banner draft after a successful add", async () => {
    renderTable();

    await fillNewRow();
    await userEvent.click(getAddButton());

    await waitFor(() =>
      expect(getNewRow().querySelector("input#title")).toHaveValue("")
    );
    expect(saveBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New banner",
        content: "new content",
        start_date: 1000,
        end_date: 2000
      })
    );
  });

  it.each([
    ["the title is missing", { title: "" }, "signage.title_required"],
    ["the content is missing", { content: "" }, "signage.content_required"],
    ["a date is missing", { end: "" }, "signage.dates_required"],
    [
      "the end date is before the start date",
      { start: "3000" },
      "signage.invalid_date_range"
    ]
  ])("does not call saveBanner on Add when %s", async (_, draft, message) => {
    renderTable();

    await fillNewRow(draft);
    await userEvent.click(getAddButton());

    expect(saveBanner).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith("general.error", message, "warning");
    expect(getNewRow().querySelector("input#content")).toHaveValue(
      draft.content ?? "new content"
    );
  });

  it("does not call saveBanner on a row's save when the end date is before the start date", async () => {
    renderTable();

    await userEvent.click(getAction(1, "edit"));
    await userEvent.type(getRow(1).querySelector("input#start_date"), "3000");
    await userEvent.click(getAction(1, "save"));

    expect(saveBanner).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      "general.error",
      "signage.invalid_date_range",
      "warning"
    );
    expect(getAction(1, "save")).toBeInTheDocument();
  });

  it("allows an empty title on a row's save, as the API does on edit", async () => {
    renderTable();

    await userEvent.click(getAction(1, "edit"));
    await userEvent.clear(getRow(1).querySelector("input#title"));
    await userEvent.click(getAction(1, "save"));

    expect(saveBanner).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: "" })
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
