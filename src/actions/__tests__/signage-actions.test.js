import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  putRequest,
  postRequest,
  deleteRequest,
  showSuccessMessage,
  START_LOADING,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "../../utils/methods";
import { publishToAblyChannel } from "../ably-actions";
import {
  saveBanner,
  deleteBanner,
  publishDate,
  publishTemplate
} from "../signage-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  putRequest: jest.fn(),
  postRequest: jest.fn(),
  deleteRequest: jest.fn(),
  showSuccessMessage: jest.fn(() => ({ type: "SUCCESS_MESSAGE_MOCK" }))
}));

jest.mock("../ably-actions", () => ({
  publishToAblyChannel: jest.fn()
}));

const MOCK_STATE = {
  currentSummitState: { currentSummit: { id: 42, time_zone_id: "UTC" } },
  signageState: { locationId: 7 }
};

const BANNER = { id: 5, title: "Banner", content: "content" };

const mockStore = configureStore([thunk]);

const resolvingRequest = () => () => () => Promise.resolve({ response: {} });
const rejectingRequest = () => () => () => Promise.reject(new Error("failed"));

const actionTypes = (store) => store.getActions().map((a) => a.type);

describe("signage-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("saveBanner", () => {
    it("updates an existing banner and stops loading", async () => {
      putRequest.mockImplementation(resolvingRequest);
      const store = mockStore(MOCK_STATE);

      await store.dispatch(saveBanner(BANNER));

      expect(putRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining("/summits/42/locations/7/banners/5"),
        expect.not.objectContaining({ id: expect.anything() }),
        expect.any(Function),
        BANNER
      );
      expect(postRequest).not.toHaveBeenCalled();
      expect(actionTypes(store)).toContain(STOP_LOADING);
    });

    it("creates a banner without id", async () => {
      postRequest.mockImplementation(resolvingRequest);
      const store = mockStore(MOCK_STATE);

      await store.dispatch(saveBanner({ title: "New" }));

      expect(postRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.stringMatching(/\/summits\/42\/locations\/7\/banners$/),
        { title: "New" },
        expect.any(Function),
        { title: "New" }
      );
      expect(putRequest).not.toHaveBeenCalled();
    });

    it("rejects so the caller can keep its draft, and still stops loading", async () => {
      putRequest.mockImplementation(rejectingRequest);
      const store = mockStore(MOCK_STATE);

      await expect(store.dispatch(saveBanner(BANNER))).rejects.toThrow(
        "failed"
      );
      expect(actionTypes(store)).toEqual([START_LOADING, STOP_LOADING]);
    });
  });

  describe("deleteBanner", () => {
    it("absorbs a failed request and still stops loading", async () => {
      deleteRequest.mockImplementation(rejectingRequest);
      const store = mockStore(MOCK_STATE);

      await expect(store.dispatch(deleteBanner(5))).resolves.toBeUndefined();
      expect(actionTypes(store)).toEqual([START_LOADING, STOP_LOADING]);
    });
  });

  describe("publishTemplate", () => {
    it("does not publish to the sign when saving the template fails", async () => {
      postRequest.mockImplementation(rejectingRequest);
      const store = mockStore(MOCK_STATE);

      await store.dispatch(publishTemplate("template.html"));

      expect(publishToAblyChannel).not.toHaveBeenCalled();
      expect(showSuccessMessage).not.toHaveBeenCalled();
      expect(actionTypes(store)).toContain(STOP_LOADING);
    });
  });

  describe("publishDate", () => {
    it("stops loading when the Ably publish is unavailable", async () => {
      publishToAblyChannel.mockReturnValue(() => Promise.resolve(false));
      const store = mockStore(MOCK_STATE);

      await store.dispatch(publishDate(1000));

      expect(publishToAblyChannel).toHaveBeenCalledWith(
        "SIGNAGE:42:7",
        "JUMP_TIME",
        { timestamp: 1000 }
      );
      expect(actionTypes(store)).toEqual([START_LOADING, STOP_LOADING]);
    });
  });
});
