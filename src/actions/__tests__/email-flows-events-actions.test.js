/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getEmailFlowEvents } from "../email-flows-events-actions";
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
