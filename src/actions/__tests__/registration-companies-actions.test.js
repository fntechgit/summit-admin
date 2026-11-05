import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  START_LOADING,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "../../utils/methods";
import {
  getRegistrationCompanies,
  RECEIVE_REGISTRATION_COMPANIES
} from "../registration-companies-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

const mockStore = configureStore([thunk]);

describe("getRegistrationCompanies", () => {
  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  it("sends the sort as the order query param, defaulting to name ascending", async () => {
    const sentParams = [];
    getRequest.mockImplementation(() => (params) => () => {
      sentParams.push(params);
      return Promise.resolve();
    });
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 1 } }
    });

    await store.dispatch(getRegistrationCompanies());
    await store.dispatch(getRegistrationCompanies("acme", 1, 10, "name", -1));

    expect(sentParams.map((p) => p.order)).toEqual(["name", "-name"]);
  });

  it("starts loading before the token resolves and drops a superseded call's late response", async () => {
    let releaseStale;
    let callNum = 0;
    getRequest.mockImplementation(
      (requestAC, receiveAC) => () => (dispatch) => {
        callNum += 1;
        if (callNum === 1) {
          return new Promise((resolve) => {
            releaseStale = () => {
              dispatch(receiveAC({ response: { data: [{ id: "stale" }] } }));
              resolve();
            };
          });
        }
        dispatch(receiveAC({ response: { data: [{ id: "fresh" }] } }));
        return Promise.resolve();
      }
    );

    const store = mockStore({
      currentSummitState: { currentSummit: { id: 1 } }
    });
    const stalePromise = store.dispatch(
      getRegistrationCompanies(null, 1, 10, "name", 1)
    );
    expect(store.getActions()[0].type).toBe(START_LOADING);
    await flushPromises();

    await store.dispatch(getRegistrationCompanies(null, 1, 50, "name", 1));
    releaseStale();
    await stalePromise;
    await flushPromises();

    const actions = store.getActions();
    const receives = actions.filter(
      (a) => a.type === RECEIVE_REGISTRATION_COMPANIES
    );
    expect(receives).toHaveLength(1);
    expect(receives[0].payload.response.data).toEqual([{ id: "fresh" }]);
    expect(actions[actions.length - 1].type).toBe(STOP_LOADING);
  });
});
