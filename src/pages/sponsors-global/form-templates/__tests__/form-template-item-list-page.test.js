import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import flushPromises from "flush-promises";
import FormTemplateItemListPage from "../form-template-item-list-page";
import { renderWithRedux } from "../../../../utils/test-utils";
import {
  getFormTemplateItems,
  getFormTemplateItem,
  deleteItemImage
} from "../../../../actions/form-template-item-actions";
import { getFormTemplate } from "../../../../actions/form-template-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

jest.mock("../../../../actions/form-template-item-actions", () => ({
  ...jest.requireActual("../../../../actions/form-template-item-actions"),
  getFormTemplateItems: jest.fn(() => () => Promise.resolve()),
  getFormTemplateItem: jest.fn(() => () => Promise.resolve()),
  deleteItemImage: jest.fn(() => () => Promise.resolve(true))
}));

jest.mock("../../../../actions/form-template-actions", () => ({
  ...jest.requireActual("../../../../actions/form-template-actions"),
  getFormTemplate: jest.fn(() => () => Promise.resolve())
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
  "../sponsor-inventory-popup",
  () =>
    function MockSponsorInventoryDialog({ onImageDeleted }) {
      return (
        <button type="button" onClick={() => onImageDeleted(999)}>
          mock-remove-item-image
        </button>
      );
    }
);

describe("FormTemplateItemListPage", () => {
  const formTemplateId = 123;
  const initialPage = 2;
  const perPage = 10;
  const order = "name";
  const orderDir = 1;
  const showArchived = false;
  const buildInitialState = ({
    formTemplateItems = [],
    currentFormTemplateItem = {}
  } = {}) => ({
    currentFormTemplateItemListState: {
      formTemplateItems,
      term: "",
      order,
      orderDir,
      currentPage: initialPage,
      lastPage: 1,
      perPage,
      totalFormTemplateItems: 5,
      showArchived
    },
    currentFormTemplateState: {
      entity: { id: formTemplateId, code: "FT", name: "Form Template" },
      errors: {}
    },
    currentFormTemplateItemState: {
      entity: currentFormTemplateItem,
      errors: {}
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component", () => {
    test("should request page 1 on mount when previous page is 2", async () => {
      renderWithRedux(
        <FormTemplateItemListPage formTemplateId={formTemplateId} />,
        {
          initialState: buildInitialState()
        }
      );

      await waitFor(() => {
        expect(getFormTemplate).toHaveBeenCalledWith(formTemplateId);
        expect(getFormTemplateItems).toHaveBeenCalledTimes(1);
        expect(getFormTemplateItems).toHaveBeenNthCalledWith(
          1,
          formTemplateId,
          "",
          DEFAULT_CURRENT_PAGE,
          perPage,
          order,
          orderDir,
          showArchived
        );
      });
    });
  });

  describe("image removal guard", () => {
    const openItemDialog = async () => {
      const user = userEvent.setup();
      await user.click(screen.getByText("edit-row-1"));
      await waitFor(() => expect(getFormTemplateItem).toHaveBeenCalled());
      await user.click(screen.getByText("mock-remove-item-image"));
    };

    test.each([
      ["an unsaved entity (no id)", {}, null],
      ["a persisted item, delete succeeds", { id: 55 }, true],
      ["a persisted item, delete fails", { id: 55 }, false]
    ])(
      "removing an image for %s",
      async (_label, currentFormTemplateItem, deleteSucceeds) => {
        if (deleteSucceeds !== null) {
          deleteItemImage.mockImplementation(
            () => () => Promise.resolve(deleteSucceeds)
          );
        }

        renderWithRedux(
          <FormTemplateItemListPage formTemplateId={formTemplateId} />,
          {
            initialState: buildInitialState({
              formTemplateItems: [{ id: 1, code: "A", name: "Item A" }],
              currentFormTemplateItem
            })
          }
        );

        await openItemDialog();

        if (deleteSucceeds === null) {
          expect(deleteItemImage).not.toHaveBeenCalled();
          return;
        }

        expect(deleteItemImage).toHaveBeenCalledWith(
          formTemplateId,
          currentFormTemplateItem.id,
          999
        );

        if (deleteSucceeds) {
          await flushPromises();
          expect(getFormTemplateItem).toHaveBeenCalledTimes(1);
        } else {
          await waitFor(() =>
            expect(getFormTemplateItem).toHaveBeenCalledTimes(2)
          );
          expect(getFormTemplateItem).toHaveBeenLastCalledWith(
            formTemplateId,
            currentFormTemplateItem.id
          );
        }
      }
    );
  });
});
