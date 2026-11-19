/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getNotes } from "../notes-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

describe("getNotes", () => {
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("drops a superseded search's response", async () => {
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 1 } }
    });
    const guards = [];
    getRequest.mockImplementation(() => () => (guardedDispatch) => {
      guards.push(guardedDispatch);
      return Promise.resolve();
    });

    await store.dispatch(getNotes(7, null, "a", 1, 10, "created", -1));
    await store.dispatch(getNotes(7, null, "ab", 1, 10, "created", -1));
    store.clearActions();
    guards[0]({ type: "STALE_RECEIVE" });
    guards[1]({ type: "FRESH_RECEIVE" });
    expect(store.getActions().map((a) => a.type)).toEqual(["FRESH_RECEIVE"]);
  });
});
