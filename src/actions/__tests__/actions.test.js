/**
 * @jest-environment jsdom
 */

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { postRequest } from "openstack-uicore-foundation/lib/utils/actions";
import * as SummitActions from "../summit-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn()
}));

describe("summit actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const store = mockStore({});

  beforeEach(() => {
    // Runs before each test in the suite
    store.clearActions();
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    postRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator, requestActionPayload = {}) =>
        () =>
        (dispatch) => {
          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          )
            dispatch(requestActionCreator(requestActionPayload));

          return new Promise((resolve) => {
            if (typeof receiveActionCreator === "function") {
              dispatch(receiveActionCreator({ response: {} }));
              resolve({ response: {} });
            } else {
              dispatch(receiveActionCreator);
              resolve({ response: {} });
            }
          });
        }
    );
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  test("check AttachLogo expected actions", async () => {
    const expectedActions = [
      { payload: undefined, type: "START_LOADING" },
      { payload: { response: {} }, type: "DUMMY_ACTION" },
      { payload: { logo: undefined }, type: "SUMMIT_LOGO_ATTACHED" },
      { payload: undefined, type: "STOP_LOADING" }
    ];

    const f = new File([""], "filename", { type: "text/html" });
    store.dispatch(SummitActions.attachLogo({ id: 1 }, f, false));
    await flushPromises();

    expect(store.getActions()).toEqual(expectedActions);
    expect(postRequest).toHaveBeenCalledTimes(1);
    expect(methods.getAccessTokenSafely).toHaveBeenCalledTimes(2);
  });
});
