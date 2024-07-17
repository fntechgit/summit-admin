/**
 * @jest-environment jsdom
 */

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import * as SummitActions from "../../actions/summit-actions";
import * as methods from "../../utils/methods";
import { postRequest } from "openstack-uicore-foundation/lib/utils/actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => {
  return {
    __esModule: true,
    ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
    postRequest: jest.fn()
  };
});

describe("summit actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const store = mockStore({});

  beforeEach(() => {
    // Runs before each test in the suite
    store.clearActions();
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    postRequest.mockImplementation(
      (
          requestActionCreator,
          receiveActionCreator,
          endpoint,
          payload,
          errorHandler = null,
          requestActionPayload = {}
        ) =>
        (params = {}) =>
        (dispatch) => {
          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          )
            dispatch(requestActionCreator(requestActionPayload));

          return new Promise((resolve) => {
            if (typeof receiveActionCreator === "function") {
              dispatch(receiveActionCreator({ response: {} }));
              return resolve({ response: {} });
            }
            dispatch(receiveActionCreator);
            return resolve({ response: {} });
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
    expect(postRequest).toBeCalledTimes(1);
    expect(methods.getAccessTokenSafely).toBeCalledTimes(2);
  });
});
