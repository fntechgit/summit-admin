import React from "react";
import { waitFor } from "@testing-library/react";
import FormTemplateItemListPage from "../form-template-item-list-page";
import { renderWithRedux } from "../../../../utils/test-utils";
import { getFormTemplateItems } from "../../../../actions/form-template-item-actions";
import { getFormTemplate } from "../../../../actions/form-template-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

jest.mock("../../../../actions/form-template-item-actions", () => ({
  ...jest.requireActual("../../../../actions/form-template-item-actions"),
  getFormTemplateItems: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../../actions/form-template-actions", () => ({
  ...jest.requireActual("../../../../actions/form-template-actions"),
  getFormTemplate: jest.fn(() => () => Promise.resolve())
}));

describe("FormTemplateItemListPage", () => {
  const formTemplateId = 123;
  const initialPage = 2;
  const perPage = 10;
  const order = "name";
  const orderDir = 1;
  const showArchived = false;
  const buildInitialState = () => ({
    currentFormTemplateItemListState: {
      formTemplateItems: [],
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
      entity: {},
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
});
