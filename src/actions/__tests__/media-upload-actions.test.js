/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  snackbarErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getAllMediaUploadTypes,
  getMediaUpload
} from "../media-upload-actions";
import * as methods from "../../utils/methods";
import { MAX_PER_PAGE } from "../../utils/constants";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

const requestMock =
  (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
    if (typeof receiveActionCreator === "function") {
      dispatch(receiveActionCreator({ response: { id: 7, name: "Slides" } }));
    }
    return Promise.resolve({ response: { id: 7, name: "Slides" } });
  };

describe("getMediaUpload", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(requestMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Regression test for a bug where the fetch omitted `relations`, so the API
  // response never included presentation_types. The reducer then defaulted it
  // to [], the form rendered no chips, and saving wiped every real
  // association even though nothing about them was touched. See
  // SummitMediaUploadTypeSerializer::serialize (only emits presentation_types
  // when the relation is requested) and
  // SummitMediaUploadTypeService::update() (isset() on an empty array is
  // still true, so clearPresentationTypes() runs and nothing is re-added).
  it("requests the presentation_types relation so an existing entity's associations survive a fetch", async () => {
    let capturedParams;
    getRequest.mockImplementation((req, res) => (params) => (dispatch) => {
      capturedParams = params;
      return requestMock(req, res)(params)(dispatch);
    });

    const store = mockStore({
      currentSummitState: { currentSummit: { id: 42 } }
    });

    await store.dispatch(getMediaUpload(7));
    await flushPromises();

    expect(capturedParams).toMatchObject({ relations: "presentation_types" });
  });

  it("dispatches RECEIVE_MEDIA_UPLOAD with the fetched entity", async () => {
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 42 } }
    });

    store.dispatch(getMediaUpload(7));
    await flushPromises();

    const actionTypes = store.getActions().map((a) => a.type);
    expect(actionTypes).toContain("RECEIVE_MEDIA_UPLOAD");
  });
});

describe("getAllMediaUploadTypes", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const ENDPOINT = "https://api.test/api/v1/summits/42/media-upload-types";

  let requestedParams;

  // One row per page, named after its page, so the accumulated list mirrors
  // exactly which pages the thunk asked for and in what order it merged them.
  const mockPagedRequest = (lastPage) => {
    getRequest.mockImplementation(() => (params) => () => {
      requestedParams.push(params);
      return Promise.resolve({
        response: {
          last_page: lastPage,
          data: [{ id: params.page, name: `type-${params.page}` }]
        }
      });
    });
  };

  beforeEach(() => {
    requestedParams = [];
    // getRequest is a module-level jest.fn() shared with the suites above;
    // restoreAllMocks does not reset its call history.
    getRequest.mockClear();
    window.API_BASE_URL = "https://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.API_BASE_URL;
  });

  it("loads every remaining page and concatenates them in page order", async () => {
    mockPagedRequest(4);
    const store = mockStore({});

    const result = await store.dispatch(getAllMediaUploadTypes(42));

    expect(requestedParams.map((p) => p.page).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4
    ]);
    // Promise.all resolves in input order, so page order survives the fan-out.
    expect(result.map((type) => type.name)).toEqual([
      "type-1",
      "type-2",
      "type-3",
      "type-4"
    ]);
  });

  it("requests only the fields the filter renders, sorted by name, through getRequest", async () => {
    mockPagedRequest(1);
    const store = mockStore({});

    await store.dispatch(getAllMediaUploadTypes(42));

    expect(requestedParams[0]).toEqual({
      access_token: "TOKEN",
      order: "name",
      per_page: MAX_PER_PAGE,
      fields: "id,name",
      page: 1
    });
    expect(getRequest.mock.calls[0][2]).toBe(ENDPOINT);
    expect(getRequest.mock.calls[0][3]).toBe(snackbarErrorHandler);
  });
});
