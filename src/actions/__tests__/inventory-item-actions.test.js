/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getInventoryItem } from "../inventory-item-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

describe("getInventoryItem", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("still dispatches STOP_LOADING when the request fails", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("API error"))
    );

    const store = mockStore({});

    await store.dispatch(getInventoryItem(1)).catch(() => {});
    await flushPromises();

    const actionTypes = store.getActions().map((a) => a.type);
    expect(actionTypes).toContain("STOP_LOADING");
  });
});
