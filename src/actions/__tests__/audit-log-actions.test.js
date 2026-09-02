/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getAuditLog } from "../audit-log-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

describe("getAuditLog REVERSED order direction", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let capturedParams;

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

    capturedParams = null;
    getRequest.mockImplementation(() => (params) => {
      capturedParams = params;
      return () =>
        Promise.resolve({
          response: { data: [], total: 0, current_page: 1, last_page: 1 }
        });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildStore = () =>
    mockStore({ currentSummitState: { currentSummit: { id: 1 } } });

  // Regression pin: audit-logs-api's parse_order reads "+" as descending and
  // "-" as ascending — the opposite of every other list in this app — so the
  // default (newest-first) view must send "+", not "-".
  it("sends a '+' prefix for the default (newest-first) orderDir", async () => {
    const store = buildStore();

    store.dispatch(getAuditLog([], "", 1, 100, "created", -1, []));
    await flushPromises();

    expect(capturedParams.order).toBe("+created");
  });

  it("sends a '-' prefix when orderDir is flipped to ascending", async () => {
    const store = buildStore();

    store.dispatch(getAuditLog([], "", 1, 100, "created", 1, []));
    await flushPromises();

    expect(capturedParams.order).toBe("-created");
  });
});

describe("getAuditLog filters contract", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let capturedParams;

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

    capturedParams = null;
    getRequest.mockImplementation(() => (params) => {
      capturedParams = params;
      return () =>
        Promise.resolve({
          response: { data: [], total: 0, current_page: 1, last_page: 1 }
        });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildStore = () =>
    mockStore({ currentSummitState: { currentSummit: { id: 1 } } });

  it("merges summit_id, entityFilter, and the array-shaped grid filter into filter[]", async () => {
    const store = buildStore();

    store.dispatch(
      getAuditLog(["event_id==5"], "", 1, 100, "created", -1, ["user_id==42"])
    );
    await flushPromises();

    expect(capturedParams["filter[]"]).toEqual([
      "summit_id==1",
      "event_id==5",
      "user_id==42"
    ]);
  });

  it("appends entity_id==<term> for a numeric search term", async () => {
    const store = buildStore();

    store.dispatch(getAuditLog([], "123", 1, 100, "created", -1, []));
    await flushPromises();

    expect(capturedParams["filter[]"]).toEqual([
      "summit_id==1",
      "entity_id==123"
    ]);
  });

  it("appends action=@<term> for a non-numeric search term", async () => {
    const store = buildStore();

    store.dispatch(getAuditLog([], "restart", 1, 100, "created", -1, []));
    await flushPromises();

    expect(capturedParams["filter[]"]).toEqual([
      "summit_id==1",
      "action=@restart"
    ]);
  });
});
