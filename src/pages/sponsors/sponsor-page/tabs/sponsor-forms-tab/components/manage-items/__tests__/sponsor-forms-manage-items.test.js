import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    ["a persisted item", { id: 33 }, ["FORM1", 33, 999]]
  ])(
    "calling removeSponsorCustomizedFormItemImages for %s",
    async (_label, currentItem, expectedCall) => {
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

      if (expectedCall) {
        expect(removeSponsorCustomizedFormItemImages).toHaveBeenCalledWith(
          ...expectedCall
        );
      } else {
        expect(removeSponsorCustomizedFormItemImages).not.toHaveBeenCalled();
      }
    }
  );
});
