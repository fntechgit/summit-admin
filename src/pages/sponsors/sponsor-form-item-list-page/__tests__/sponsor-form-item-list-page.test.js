import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import flushPromises from "flush-promises";
import SponsorFormItemListPage from "../index";
import { renderWithRedux } from "../../../../utils/test-utils";

jest.mock("../../../../actions/sponsor-forms-actions", () => ({
  ...jest.requireActual("../../../../actions/sponsor-forms-actions"),
  getSponsorFormItems: jest.fn(() => () => Promise.resolve()),
  getSponsorFormItem: jest.fn(() => () => Promise.resolve()),
  updateSponsorFormItem: jest.fn(() => () => Promise.resolve()),
  addInventoryItems: jest.fn(() => () => Promise.resolve()),
  removeItemFile: jest.fn(() => () => Promise.resolve(true))
}));

jest.mock("../../../../actions/inventory-item-actions", () => ({
  ...jest.requireActual("../../../../actions/inventory-item-actions"),
  getInventoryItems: jest.fn(() => () => Promise.resolve())
}));

jest.mock(
  "../components/sponsor-form-add-item-from-inventory-popup",
  () =>
    function MockInventoryPopup({ onSave }) {
      return (
        <button onClick={() => onSave([10, 20])}>mock-inventory-save</button>
      );
    }
);

jest.mock(
  "../components/sponsor-form-item-popup",
  () =>
    function MockSponsorFormItemPopup({ onRemoveImage }) {
      return (
        <button onClick={() => onRemoveImage(999)}>
          mock-remove-item-image
        </button>
      );
    }
);

const {
  getSponsorFormItems,
  getSponsorFormItem,
  updateSponsorFormItem,
  addInventoryItems,
  removeItemFile
} = require("../../../../actions/sponsor-forms-actions");

const buildItem = (id) => ({
  id,
  code: `CODE-${id}`,
  name: `Item ${id}`,
  early_bird_rate: "111",
  standard_rate: "222",
  onsite_rate: "333",
  default_quantity: 1,
  is_archived: false,
  images: []
});

const renderPage = (currentItem = {}) =>
  renderWithRedux(
    <SponsorFormItemListPage
      match={{ params: { form_id: "FORM1" }, url: "/form-items" }}
    />,
    {
      initialState: {
        sponsorFormItemsListState: {
          items: [buildItem(1)],
          currentItem,
          currentPage: 3,
          perPage: 5,
          order: "code",
          orderDir: -1,
          showArchived: false,
          totalCount: 1,
          lastPage: 1
        },
        currentInventoryItemListState: {}
      }
    }
  );

describe("SponsorFormItemListPage inline cell edit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refreshes the list with the current paging/sort/filter context after a successful cell edit", async () => {
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByText("111"));

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "200" } });
    fireEvent.blur(input);

    expect(updateSponsorFormItem).toHaveBeenCalledWith(
      "FORM1",
      expect.objectContaining({ id: 1 })
    );

    await waitFor(() =>
      expect(getSponsorFormItems).toHaveBeenCalledWith(
        "FORM1",
        3,
        5,
        "code",
        -1,
        false
      )
    );
  });

  it("refreshes the list at the first page after adding items from inventory", async () => {
    renderPage();

    const user = userEvent.setup();
    await user.click(
      screen.getByText("sponsor_form_item_list.add_item_from_inventory")
    );
    await user.click(screen.getByText("mock-inventory-save"));

    expect(addInventoryItems).toHaveBeenCalledWith("FORM1", [10, 20]);

    await waitFor(() =>
      expect(getSponsorFormItems).toHaveBeenCalledWith(
        "FORM1",
        1,
        5,
        "code",
        -1,
        false
      )
    );
  });
});

describe("SponsorFormItemListPage image removal guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openItemPopup = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText("sponsor_form_item_list.add_item"));
    await user.click(screen.getByText("mock-remove-item-image"));
  };

  it.each([
    ["an unsaved entity (no id)", {}, null],
    ["a persisted item, delete succeeds", { id: 42 }, true],
    ["a persisted item, delete fails", { id: 42 }, false]
  ])(
    "removing an image for %s",
    async (_label, currentItem, deleteSucceeds) => {
      if (deleteSucceeds !== null) {
        removeItemFile.mockImplementation(
          () => () => Promise.resolve(deleteSucceeds)
        );
      }

      renderPage(currentItem);

      await openItemPopup();

      if (deleteSucceeds === null) {
        expect(removeItemFile).not.toHaveBeenCalled();
        return;
      }

      expect(removeItemFile).toHaveBeenCalledWith("FORM1", currentItem.id, 999);

      if (deleteSucceeds) {
        await flushPromises();
        expect(getSponsorFormItem).not.toHaveBeenCalled();
      } else {
        await waitFor(() =>
          expect(getSponsorFormItem).toHaveBeenCalledWith(
            "FORM1",
            currentItem.id
          )
        );
      }
    }
  );
});
