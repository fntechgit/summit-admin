/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import {
  getEmailFlowEvents,
  getEmailFlowEvent
} from "../email-flows-events-actions";
import * as methods from "../../utils/methods";
import { createMockSummit } from "../../utils/test-utils";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

describe("getEmailFlowEvents", () => {
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(() => () => () => Promise.resolve({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("forwards perPage in the request-action payload so redux keeps the page size", async () => {
    const store = mockStore({
      currentSummitState: { currentSummit: createMockSummit() }
    });

    await getEmailFlowEvents(
      "welcome",
      1,
      50,
      "flow_name",
      -1
    )(store.dispatch, store.getState);

    const [, , , , requestPayload] = getRequest.mock.calls[0];
    expect(requestPayload).toEqual({
      order: "flow_name",
      orderDir: -1,
      term: "welcome",
      perPage: 50
    });
  });
});

// getRequest only aborts an identical URL, so a second call with different
// params races the first. The per-thunk sequence must both skip the superseded
// call's request and drop any dispatch it still tries to make.
describe("stale-response guards", () => {
  const mockStore = configureStore([thunk]);
  const storeState = {
    currentSummitState: { currentSummit: createMockSummit() }
  };

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("getEmailFlowEvents issues only the newest of two concurrent calls", async () => {
    const store = mockStore(storeState);
    getRequest.mockImplementation(() => () => () => Promise.resolve({}));

    await Promise.all([
      getEmailFlowEvents(
        "a",
        1,
        10,
        "flow_name",
        1
      )(store.dispatch, store.getState),
      getEmailFlowEvents(
        "b",
        2,
        50,
        "flow_name",
        -1
      )(store.dispatch, store.getState)
    ]);

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(getRequest.mock.calls[0][4]).toEqual({
      order: "flow_name",
      orderDir: -1,
      term: "b",
      perPage: 50
    });
  });

  it("getEmailFlowEvents drops a superseded call's late dispatch", async () => {
    const dispatched = [];
    const store = mockStore(storeState);
    store.dispatch = jest.fn((action) => {
      if (action && action.type) dispatched.push(action.type);
      return action;
    });

    const guards = [];
    getRequest.mockImplementation(() => () => (guardedDispatch) => {
      guards.push(guardedDispatch);
      return Promise.resolve({});
    });

    // first call completes and hands us its guarded dispatch
    await getEmailFlowEvents(
      "a",
      1,
      10,
      "flow_name",
      1
    )(store.dispatch, store.getState);
    // a newer call then supersedes it
    await getEmailFlowEvents(
      "b",
      2,
      50,
      "flow_name",
      -1
    )(store.dispatch, store.getState);

    dispatched.length = 0;
    guards[0]({ type: "STALE_RECEIVE" });
    guards[1]({ type: "FRESH_RECEIVE" });

    expect(dispatched).not.toContain("STALE_RECEIVE");
    expect(dispatched).toContain("FRESH_RECEIVE");
  });

  it("getEmailFlowEvent issues only the newest of two concurrent calls", async () => {
    const store = mockStore(storeState);
    getRequest.mockImplementation(() => () => () => Promise.resolve({}));

    await Promise.all([
      getEmailFlowEvent(1)(store.dispatch, store.getState),
      getEmailFlowEvent(2)(store.dispatch, store.getState)
    ]);

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(getRequest.mock.calls[0][2]).toContain("/email-flows-events/2");
  });
});
