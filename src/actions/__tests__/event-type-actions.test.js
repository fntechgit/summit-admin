/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  postRequest,
  deleteRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { deleteEventType, seedEventTypes } from "../event-type-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  deleteRequest: jest.fn()
}));

const requestMock =
  (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
    if (requestActionCreator && typeof requestActionCreator === "function") {
      dispatch(requestActionCreator({}));
    }
    return new Promise((resolve) => {
      if (typeof receiveActionCreator === "function") {
        dispatch(receiveActionCreator({ response: { data: [] } }));
      } else {
        dispatch(receiveActionCreator);
      }
      resolve({ response: { data: [] } });
    });
  };

const initialState = {
  currentSummitState: { currentSummit: { id: 42 } }
};

describe("event type loading actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    window.API_BASE_URL = "https://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    postRequest.mockImplementation(requestMock);
    deleteRequest.mockImplementation(requestMock);
  });

  afterEach(() => {
    delete window.API_BASE_URL;
    jest.restoreAllMocks();
  });

  it("deleteEventType dispatches START_LOADING before the delete and STOP_LOADING after", async () => {
    const store = mockStore(initialState);
    store.dispatch(deleteEventType(7));
    await flushPromises();

    const actionTypes = store.getActions().map((a) => a.type);
    expect(actionTypes).toContain("START_LOADING");
    expect(actionTypes).toContain("EVENT_TYPE_DELETED");
    expect(actionTypes).toContain("STOP_LOADING");
    expect(actionTypes.indexOf("START_LOADING")).toBeLessThan(
      actionTypes.indexOf("EVENT_TYPE_DELETED")
    );
    expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
      actionTypes.indexOf("EVENT_TYPE_DELETED")
    );
  });

  it("seedEventTypes dispatches START_LOADING before the seed and STOP_LOADING after", async () => {
    const store = mockStore(initialState);
    store.dispatch(seedEventTypes());
    await flushPromises();

    const actionTypes = store.getActions().map((a) => a.type);
    expect(actionTypes).toContain("START_LOADING");
    expect(actionTypes).toContain("EVENT_TYPES_SEEDED");
    expect(actionTypes).toContain("STOP_LOADING");
    expect(actionTypes.indexOf("START_LOADING")).toBeLessThan(
      actionTypes.indexOf("EVENT_TYPES_SEEDED")
    );
    expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
      actionTypes.indexOf("EVENT_TYPES_SEEDED")
    );
  });
});
