/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getMediaUpload } from "../media-upload-actions";
import * as methods from "../../utils/methods";

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
