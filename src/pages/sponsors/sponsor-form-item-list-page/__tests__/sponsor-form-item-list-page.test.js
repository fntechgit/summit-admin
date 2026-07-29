import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorFormItemListPage from "../index";
import { renderWithRedux } from "../../../../utils/test-utils";

jest.mock("../../../../actions/sponsor-forms-actions", () => ({
  ...jest.requireActual("../../../../actions/sponsor-forms-actions"),
  getSponsorFormItems: jest.fn(() => () => Promise.resolve()),
  updateSponsorFormItem: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../../actions/inventory-item-actions", () => ({
  ...jest.requireActual("../../../../actions/inventory-item-actions"),
  getInventoryItems: jest.fn(() => () => Promise.resolve())
}));

const {
  getSponsorFormItems,
  updateSponsorFormItem
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

const renderPage = () =>
  renderWithRedux(
    <SponsorFormItemListPage
      match={{ params: { form_id: "FORM1" }, url: "/form-items" }}
    />,
    {
      initialState: {
        sponsorFormItemsListState: {
          items: [buildItem(1)],
          currentItem: {},
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
});
