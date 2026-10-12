/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  putRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  trackImportSponsorUsers,
  updateShowSponsorUser,
  RECEIVE_SPONSOR_USERS_IMPORT_STATUS
} from "../sponsor-users-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  putRequest: jest.fn()
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

describe("updateShowSponsorUser", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  // as stored by RECEIVE_SPONSOR_USERS: rights in every summit the user belongs to
  const storedUser = {
    id: 7,
    access_rights: [
      {
        id: 50,
        summit_id: 69,
        sponsor: { id: 690, company_name: "Summit 69 Sponsor" },
        groups: [{ id: 200, name: "old-group" }]
      },
      {
        id: 51,
        summit_id: 73,
        sponsor: { id: 730, company_name: "Summit 73 Sponsor" },
        groups: [{ id: 201, name: "older-group" }]
      },
      {
        id: 52,
        summit_id: 75,
        sponsor: { id: 750, company_name: "Summit 75 Sponsor" },
        groups: [{ id: 202, name: "current-group" }]
      }
    ]
  };

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    getRequest.mockImplementation(() => () => () => Promise.resolve());
    putRequest.mockImplementation(() => () => () => Promise.resolve({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resends other summits' rights unchanged and only applies the edits to the current summit", async () => {
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 75 } },
      sponsorUsersListState: { users: { items: [storedUser] } }
    });

    // popup values: only summit 75's right, with its groups edited
    const formValues = {
      id: 7,
      is_active: true,
      access_rights: [
        {
          id: 52,
          sponsor: { id: 750, name: "Summit 75 Sponsor" },
          groups: [202, 203]
        }
      ]
    };

    await store.dispatch(updateShowSponsorUser(formValues));
    await flushPromises();

    const [, , url, payload] = putRequest.mock.calls[0];
    expect(url).toContain("/api/v1/sponsor-users/7");
    expect(payload).toEqual({
      is_active: true,
      access_rights: [
        { summit_id: 75, sponsor_id: 750, groups: [202, 203] },
        { summit_id: 69, sponsor_id: 690, groups: [200] },
        { summit_id: 73, sponsor_id: 730, groups: [201] }
      ]
    });
  });
});
