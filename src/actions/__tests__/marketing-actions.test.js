/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getMarketingSettingsBySelectionPlan } from "../marketing-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

const storeState = {
  currentSummitState: { currentSummit: { id: 1 } }
};

describe("getMarketingSettingsBySelectionPlan - stale response guard", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("drops an older plan's settings response after a newer plan's response already landed", async () => {
    const resolvers = {};
    getRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) =>
        (params) =>
        (dispatch) => {
          const { selection_plan_id: id } = params;
          return new Promise((resolve) => {
            resolvers[id] = () => {
              if (requestActionCreator) dispatch(requestActionCreator({}));
              dispatch(receiveActionCreator({ response: { id } }));
              resolve();
            };
          });
        }
    );

    const store = mockStore(storeState);

    // User opens plan 5, then quickly navigates to plan 8 before plan 5's
    // settings fetch settles - both requests are genuinely in flight when
    // plan 8's response lands first.
    store.dispatch(getMarketingSettingsBySelectionPlan("5"));
    await flushPromises();
    store.dispatch(getMarketingSettingsBySelectionPlan("8"));
    await flushPromises();
    resolvers[8]();
    await flushPromises();
    resolvers[5]();
    await flushPromises();

    const receivedIds = store
      .getActions()
      .filter((a) => a.type === "RECEIVE_SELECTION_PLAN_SETTINGS")
      .map((a) => a.payload.response.id);

    expect(receivedIds).toEqual(["8"]);
  });
});
