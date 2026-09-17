/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import {
  getSubmittersBySummit,
  getSelectedSubmittersActivityCount
} from "../submitter-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

describe("getSubmittersBySummit - published filter", () => {
  const mockStore = configureStore([thunk]);
  const SUMMIT_ID = 1;
  let capturedRequests;

  const stateWithSummit = {
    currentSummitState: {
      currentSummit: { id: SUMMIT_ID, name: "Test Summit" }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "https://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    capturedRequests = [];
    getRequest.mockImplementation(
      (_requestAction, receiveAction, url) => (params) => (dispatch) => {
        capturedRequests.push({ url, params });
        dispatch(receiveAction({ response: {} }));
        return Promise.resolve({ response: {} });
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.API_BASE_URL;
  });

  const listRequestFor = () =>
    capturedRequests.find((r) => r.url.endsWith("/submitters"));
  const countRequestFor = () =>
    capturedRequests.find((r) =>
      r.url.endsWith("/submitters/all/events/count")
    );

  it.each([
    ["published", "true"],
    ["not_published", "false"]
  ])(
    "maps the '%s' filter to has_published_presentations==%s on both the list and count request",
    async (selectionValue, expectedFlag) => {
      const store = mockStore(stateWithSummit);

      await store.dispatch(
        getSubmittersBySummit(null, 1, 10, "full_name", 1, {
          selectionStatusFilter: [selectionValue]
        })
      );

      const expected = `has_published_presentations==${expectedFlag}`;
      expect(listRequestFor().params["filter[]"]).toContain(expected);
      expect(countRequestFor().params["filter[]"]).toContain(expected);
    }
  );

  it("does not regress the existing only_accepted combination", async () => {
    const store = mockStore(stateWithSummit);

    await store.dispatch(
      getSubmittersBySummit(null, 1, 10, "full_name", 1, {
        selectionStatusFilter: ["only_accepted"]
      })
    );

    const filter = listRequestFor().params["filter[]"];
    expect(filter).toEqual(
      expect.arrayContaining([
        "has_rejected_presentations==false",
        "has_accepted_presentations==true",
        "has_alternate_presentations==false"
      ])
    );
    expect(filter.join(",")).not.toContain("has_published_presentations");
  });

  it.each([
    [true, "true"],
    [false, "false"]
  ])(
    "maps pendingSubmissionsFilter %s to has_pending_presentations==%s",
    async (pendingSubmissionsFilter, expectedFlag) => {
      const store = mockStore(stateWithSummit);

      await store.dispatch(
        getSubmittersBySummit(null, 1, 10, "full_name", 1, {
          pendingSubmissionsFilter
        })
      );

      expect(listRequestFor().params["filter[]"]).toContain(
        `has_pending_presentations==${expectedFlag}`
      );
    }
  );

  it("omits the pending-submissions filter when it is null", async () => {
    const store = mockStore(stateWithSummit);

    await store.dispatch(
      getSubmittersBySummit(null, 1, 10, "full_name", 1, {
        pendingSubmissionsFilter: null
      })
    );

    const filter = listRequestFor().params["filter[]"] ?? [];
    expect(filter.join(",")).not.toContain("has_pending_presentations");
  });

  it.each([
    [true, "true"],
    [false, "false"]
  ])(
    "maps pendingSubmissionsFilter %s to has_pending_presentations==%s on the selected-activity count request",
    async (pendingSubmissionsFilter, expectedFlag) => {
      const store = mockStore({
        ...stateWithSummit,
        currentSummitSubmittersListState: {
          totalActivities: 0,
          term: null,
          selectedCount: 1,
          selectedItems: [42],
          excludedItems: [],
          selectedAll: false,
          selectionPlanFilter: [],
          trackFilter: [],
          trackGroupFilter: [],
          activityTypeFilter: [],
          selectionStatusFilter: [],
          mediaUploadTypeFilter: { operator: null, value: [] },
          pendingSubmissionsFilter
        }
      });

      await store.dispatch(getSelectedSubmittersActivityCount());

      expect(countRequestFor().params["filter[]"]).toContain(
        `has_pending_presentations==${expectedFlag}`
      );
    }
  );
});
