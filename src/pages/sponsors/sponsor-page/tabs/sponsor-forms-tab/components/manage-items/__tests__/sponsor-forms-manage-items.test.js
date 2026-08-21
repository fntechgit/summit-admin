import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import flushPromises from "flush-promises";
import SponsorFormsManageItems from "../sponsor-forms-manage-items";
import { renderWithRedux } from "../../../../../../../../utils/test-utils";
import {
  getSponsorFormManagedItem,
  removeSponsorCustomizedFormItemImages
} from "../../../../../../../../actions/sponsor-forms-actions";

jest.mock("../../../../../../../../actions/sponsor-forms-actions", () => ({
  ...jest.requireActual(
    "../../../../../../../../actions/sponsor-forms-actions"
  ),
  getSponsorCustomizedFormItems: jest.fn(() => () => Promise.resolve()),
  getSponsorFormManagedItem: jest.fn(() => () => Promise.resolve()),
  removeSponsorCustomizedFormItemImages: jest.fn(
    () => () => Promise.resolve(true)
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/editable-table",
  () => ({
    __esModule: true,
    default: ({ data, onEdit }) => (
      <div data-testid="mui-table-editable">
        {data.map((row) => (
          <button key={row.id} type="button" onClick={() => onEdit(row)}>
            {`edit-row-${row.id}`}
          </button>
        ))}
      </div>
    )
  })
);

jest.mock(
  "../../../../../../../sponsors-global/form-templates/sponsor-inventory-popup",
  () =>
    function MockSponsorInventoryDialog({ onImageDeleted }) {
      return (
        <button type="button" onClick={() => onImageDeleted(999)}>
          mock-remove-item-image
        </button>
      );
    }
);

const buildInitialState = ({ items = [], currentItem = {} } = {}) => ({
  sponsorCustomizedFormItemsListState: {
    items,
    showArchived: false,
    term: "",
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCount: items.length,
    currentItem
  },
  loggedUserState: {
    member: {
      groups: [{ id: 1, code: "super-admins" }]
    }
  }
});

describe("SponsorFormsManageItems image removal guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openItemDialog = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText("edit-row-1"));
    await waitFor(() => expect(getSponsorFormManagedItem).toHaveBeenCalled());
    await user.click(screen.getByText("mock-remove-item-image"));
  };

  test.each([
    ["an unsaved entity (no id)", {}, null],
    ["a persisted item, delete succeeds", { id: 33 }, true],
    ["a persisted item, delete fails", { id: 33 }, false]
  ])(
    "removing an image for %s",
    async (_label, currentItem, deleteSucceeds) => {
      if (deleteSucceeds !== null) {
        removeSponsorCustomizedFormItemImages.mockImplementation(
          () => () => Promise.resolve(deleteSucceeds)
        );
      }

      renderWithRedux(
        <SponsorFormsManageItems match={{ params: { form_id: "FORM1" } }} />,
        {
          initialState: buildInitialState({
            items: [{ id: 1, code: "A", name: "Item A" }],
            currentItem
          })
        }
      );

      await openItemDialog();

      if (deleteSucceeds === null) {
        expect(removeSponsorCustomizedFormItemImages).not.toHaveBeenCalled();
        return;
      }

      expect(removeSponsorCustomizedFormItemImages).toHaveBeenCalledWith(
        "FORM1",
        currentItem.id,
        999
      );

      if (deleteSucceeds) {
        await flushPromises();
        expect(getSponsorFormManagedItem).toHaveBeenCalledTimes(1);
      } else {
        await waitFor(() =>
          expect(getSponsorFormManagedItem).toHaveBeenCalledTimes(2)
        );
        expect(getSponsorFormManagedItem).toHaveBeenLastCalledWith(
          "FORM1",
          currentItem.id
        );
      }
    }
  );
});
