import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorFormItemListPage from "../index";
import { renderWithRedux } from "../../../../utils/test-utils";

jest.mock("../../../../actions/sponsor-forms-actions", () => ({
  ...jest.requireActual("../../../../actions/sponsor-forms-actions"),
  getSponsorFormItems: jest.fn(() => () => Promise.resolve()),
  updateSponsorFormItem: jest.fn(() => () => Promise.resolve()),
  saveSponsorFormItem: jest.fn(() => () => Promise.resolve()),
  addInventoryItems: jest.fn(() => () => Promise.resolve())
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

// the real popup renders a formik form; here we only care about what the page
// hands to the save action, so the popup is reduced to a button that submits
// the values a user would have left in the form
let mockPopupSubmitValues = null;

jest.mock(
  "../components/sponsor-form-item-popup",
  () =>
    function MockItemPopup({ onSave }) {
      return (
        <button onClick={() => onSave(mockPopupSubmitValues)}>mock-save</button>
      );
    }
);

const {
  getSponsorFormItems,
  updateSponsorFormItem,
  saveSponsorFormItem,
  addInventoryItems
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

describe("SponsorFormItemListPage image removal", () => {
  const savedImages = [
    { id: 166, file_url: "https://cdn.example.com/images/a.jpeg" },
    { id: 167, file_url: "https://cdn.example.com/images/b.jpeg" }
  ];

  const openPopupAndSave = async (values) => {
    mockPopupSubmitValues = values;
    const user = userEvent.setup();
    await user.click(screen.getByText("sponsor_form_item_list.add_item"));
    await user.click(screen.getByText("mock-save"));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPopupSubmitValues = null;
  });

  it("tells the save action which saved images the user removed from the form", async () => {
    renderPage({ ...buildItem(1), images: savedImages });

    const values = { ...buildItem(1), images: [savedImages[1]] };
    await openPopupAndSave(values);

    expect(updateSponsorFormItem).toHaveBeenCalledWith("FORM1", values, [166]);
  });

  it("reports no removal when the form still holds every saved image", async () => {
    renderPage({ ...buildItem(1), images: savedImages });

    const values = { ...buildItem(1), images: savedImages };
    await openPopupAndSave(values);

    expect(updateSponsorFormItem).toHaveBeenCalledWith("FORM1", values, []);
  });

  it("creates a brand new item without any removal argument", async () => {
    renderPage({ ...buildItem(1), images: savedImages });

    const values = { code: "NEW", name: "New item", images: [] };
    await openPopupAndSave(values);

    expect(saveSponsorFormItem).toHaveBeenCalledWith("FORM1", values);
    expect(updateSponsorFormItem).not.toHaveBeenCalled();
  });
});
