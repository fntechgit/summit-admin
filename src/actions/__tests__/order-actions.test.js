/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { putRequest } from "openstack-uicore-foundation/lib/utils/actions";
import {
  QUESTION_VALUE_ORDER_UPDATED,
  updateOrderExtraQuestionValueOrder
} from "../order-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  putRequest: jest.fn()
}));

describe("updateOrderExtraQuestionValueOrder", () => {
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    putRequest.mockImplementation(() => () => () => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The PUT only returns the moved option, so the rest must be renumbered first.
  it("should store the whole reordered list before saving the moved option", async () => {
    const store = mockStore({
      currentOrderExtraQuestionState: { entity: { summit_id: 1, id: 9 } }
    });
    const reordered = [
      { id: 3, order: 1 },
      { id: 1, order: 2 },
      { id: 2, order: 3 }
    ];

    await store.dispatch(updateOrderExtraQuestionValueOrder(reordered, 3, 1));

    expect(store.getActions()[0]).toEqual({
      type: QUESTION_VALUE_ORDER_UPDATED,
      payload: reordered
    });
  });
});
