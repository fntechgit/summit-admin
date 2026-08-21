import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import flushPromises from "flush-promises";
import InventoryListPage from "../inventory-list-page";
import { renderWithRedux } from "../../../../utils/test-utils";
import {
  getInventoryItem,
  deleteInventoryItemImage
} from "../../../../actions/inventory-item-actions";

jest.mock("../../../../actions/inventory-item-actions", () => ({
  ...jest.requireActual("../../../../actions/inventory-item-actions"),
  getInventoryItems: jest.fn(() => () => Promise.resolve()),
  getInventoryItem: jest.fn(() => () => Promise.resolve()),
  deleteInventoryItemImage: jest.fn(() => () => Promise.resolve(true))
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onEdit }) => (
    <div data-testid="mui-table">
      {data.map((row) => (
        <button key={row.id} type="button" onClick={() => onEdit(row)}>
          {`edit-row-${row.id}`}
        </button>
      ))}
    </div>
  )
}));

jest.mock(
  "../../form-templates/sponsor-inventory-popup",
  () =>
    function MockSponsorInventoryDialog({ onImageDeleted }) {
      return (
        <button type="button" onClick={() => onImageDeleted(999)}>
          mock-remove-item-image
        </button>
      );
    }
);

const buildInitialState = ({
  inventoryItems = [],
  currentInventoryItem = {}
} = {}) => ({
  currentInventoryItemListState: {
    inventoryItems,
    term: "",
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalInventoryItems: inventoryItems.length,
    showArchived: false
  },
  currentInventoryItemState: {
    entity: currentInventoryItem,
    errors: {}
  }
});

describe("InventoryListPage image removal guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openItemDialog = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText("edit-row-1"));
    await waitFor(() => expect(getInventoryItem).toHaveBeenCalled());
    await user.click(screen.getByText("mock-remove-item-image"));
  };

  test.each([
    ["an unsaved entity (no id)", {}, null],
    ["a persisted item, delete succeeds", { id: 77 }, true],
    ["a persisted item, delete fails", { id: 77 }, false]
  ])(
    "removing an image for %s",
    async (_label, currentInventoryItem, deleteSucceeds) => {
      if (deleteSucceeds !== null) {
        deleteInventoryItemImage.mockImplementation(
          () => () => Promise.resolve(deleteSucceeds)
        );
      }

      renderWithRedux(<InventoryListPage />, {
        initialState: buildInitialState({
          inventoryItems: [{ id: 1, code: "A", name: "Item A" }],
          currentInventoryItem
        })
      });

      await openItemDialog();

      if (deleteSucceeds === null) {
        expect(deleteInventoryItemImage).not.toHaveBeenCalled();
        return;
      }

      expect(deleteInventoryItemImage).toHaveBeenCalledWith(
        currentInventoryItem.id,
        999
      );

      if (deleteSucceeds) {
        await flushPromises();
        expect(getInventoryItem).toHaveBeenCalledTimes(1);
      } else {
        await waitFor(() => expect(getInventoryItem).toHaveBeenCalledTimes(2));
        expect(getInventoryItem).toHaveBeenLastCalledWith(
          currentInventoryItem.id
        );
      }
    }
  );
});
