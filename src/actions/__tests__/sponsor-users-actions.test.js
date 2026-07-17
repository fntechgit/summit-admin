/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import {
  trackImportSponsorUsers,
  RECEIVE_SPONSOR_USERS_IMPORT_STATUS
} from "../sponsor-users-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

describe("trackImportSponsorUsers", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("marks a task as failed when the status poll request rejects", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("Not Found"))
    );

    const store = mockStore({
      sponsorUsersListState: { importTasks: [123] },
      currentSponsorState: { entity: { id: 1 } }
    });

    await store.dispatch(trackImportSponsorUsers());
    await flushPromises();

    expect(store.getActions()).toContainEqual(
      expect.objectContaining({
        type: RECEIVE_SPONSOR_USERS_IMPORT_STATUS,
        payload: expect.objectContaining({
          response: expect.objectContaining({ task_id: 123, status: "FAILURE" })
        })
      })
    );
  });
});
