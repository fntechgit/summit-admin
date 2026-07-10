import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  putRequest,
  getRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  archiveFormTemplate,
  RECEIVE_FORM_TEMPLATES
} from "../form-template-actions";
import formTemplateListReducer from "../../reducers/sponsors_inventory/form-template-list-reducer";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  putRequest: jest.fn(),
  getRequest: jest.fn()
}));

describe("archiveFormTemplate", () => {
  beforeEach(() => {
    window.INVENTORY_API_BASE_URL = "http://test-api";
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

    putRequest.mockImplementation(
      (nullArg, receiveActionCreator) => () => (dispatch) => {
        dispatch(
          receiveActionCreator({ response: { id: 21, is_archived: true } })
        );
        return Promise.resolve({ response: { id: 21, is_archived: true } });
      }
    );

    getRequest.mockImplementation(
      () => () => () => Promise.resolve({ response: {} })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refetches the corrected page after archiving the last item on the last page", async () => {
    // Real store so the reducer runs and getState() reflects the corrected page
    const store = createStore(
      combineReducers({
        currentFormTemplateListState: formTemplateListReducer
      }),
      applyMiddleware(thunk)
    );

    // Land on page 3 with 21 items (1 item on page 3, 10 per page)
    store.dispatch({
      type: RECEIVE_FORM_TEMPLATES,
      payload: {
        response: {
          data: [{ id: 21, is_archived: false, items: [] }],
          total: 21,
          last_page: 3,
          current_page: 3
        }
      }
    });

    await store.dispatch(archiveFormTemplate({ id: 21 }));
    await flushPromises();

    // Reducer corrects page 3 → 2 after FORM_TEMPLATE_ARCHIVED
    expect(store.getState().currentFormTemplateListState.currentPage).toBe(2);

    // getFormTemplates must refetch page 2, not the stale page 3
    expect(getRequest).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      "http://test-api/api/v1/form-templates",
      expect.any(Function),
      expect.objectContaining({ page: 2 })
    );
  });
});
