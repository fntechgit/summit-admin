/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  deleteRequest,
  putRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { removeAttachedPicture, saveSpeaker } from "../speaker-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  deleteRequest: jest.fn(),
  putRequest: jest.fn()
}));

const SPEAKER_ID = 42;

describe("removeAttachedPicture", () => {
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "https://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    deleteRequest.mockImplementation(
      (_requestAction, receiveAction) => () => (dispatch) => {
        dispatch(receiveAction({ response: {} }));
        return Promise.resolve({ response: {} });
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.API_BASE_URL;
  });

  it("deletes the profile photo through the photo endpoint", async () => {
    const store = mockStore({});

    await store.dispatch(removeAttachedPicture(SPEAKER_ID, "profile"));

    expect(deleteRequest).toHaveBeenCalledTimes(1);
    expect(deleteRequest.mock.calls[0][2]).toBe(
      `https://api.test/api/v1/speakers/${SPEAKER_ID}/photo?access_token=TOKEN`
    );
    expect(store.getActions().map((a) => a.type)).toContain("PIC_DELETED");
  });

  it("deletes the big photo through the big-photo endpoint", async () => {
    const store = mockStore({});

    await store.dispatch(removeAttachedPicture(SPEAKER_ID, "big"));

    expect(deleteRequest.mock.calls[0][2]).toBe(
      `https://api.test/api/v1/speakers/${SPEAKER_ID}/big-photo?access_token=TOKEN`
    );
    expect(store.getActions().map((a) => a.type)).toContain("BIG_PIC_DELETED");
  });

  it("does not emit a delete action when the request fails", async () => {
    deleteRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("boom"))
    );
    const store = mockStore({});

    await expect(
      store.dispatch(removeAttachedPicture(SPEAKER_ID, "profile"))
    ).resolves.toBeUndefined();

    const types = store.getActions().map((a) => a.type);
    expect(types).not.toContain("PIC_DELETED");
    expect(types).not.toContain("STOP_LOADING");
  });
});

describe("saveSpeaker", () => {
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "https://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    putRequest.mockImplementation(
      (requestAction, receiveAction, _url, _body, _err, payload) =>
        () =>
        (dispatch) => {
          dispatch(requestAction(payload));
          dispatch(receiveAction({ response: {} }));
          return Promise.resolve({ response: {} });
        }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.API_BASE_URL;
  });

  it("never deletes photos as a side effect of saving", async () => {
    const store = mockStore({});

    await store.dispatch(
      saveSpeaker({ id: SPEAKER_ID, title: "Dev", pic: "", big_pic: "" })
    );

    expect(deleteRequest).not.toHaveBeenCalled();
  });

  it("resolves only after the update request settles", async () => {
    let resolveRequest;
    putRequest.mockImplementation(
      (requestAction, receiveAction) => () => (dispatch) => {
        dispatch(requestAction());
        return new Promise((resolve) => {
          resolveRequest = () => {
            dispatch(receiveAction({ response: {} }));
            resolve({ response: {} });
          };
        });
      }
    );
    const store = mockStore({});

    let settled = false;
    const dispatched = store
      .dispatch(
        saveSpeaker({ id: SPEAKER_ID, title: "Dev", pic: "", big_pic: "" })
      )
      .then(() => {
        settled = true;
      });

    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveRequest();
    await dispatched;
    expect(settled).toBe(true);
  });
});
