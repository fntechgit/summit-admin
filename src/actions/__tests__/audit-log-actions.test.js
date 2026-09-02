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
