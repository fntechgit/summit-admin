import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { putRequest } from "openstack-uicore-foundation/lib/utils/actions";
import T from "i18n-react/dist/i18n-react";
import * as methods from "../../utils/methods";
import { notifySubmissionReopened } from "../event-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: jest.fn((key) => key) }
}));

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  putRequest: jest.fn()
}));

const mockStore = configureStore([thunk]);

describe("notifySubmissionReopened", () => {
  const summitId = 5;
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "https://api.test";
    store = mockStore({
      currentSummitState: { currentSummit: { id: summitId } }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  const arrangeRequest = (
    result = Promise.resolve({ response: { recipients: 3 } })
  ) => {
    putRequest.mockReturnValue(() => () => result);
  };

  it("PUTs the selection to the notify endpoint in the API's snake_case shape", async () => {
    arrangeRequest();

    await store.dispatch(
      notifySubmissionReopened(42, {
        speakerIds: [7, 12],
        includeSubmitter: true
      })
    );

    expect(putRequest).toHaveBeenCalledTimes(1);
    const [requestAction, , url, body] = putRequest.mock.calls[0];
    expect(requestAction).toBeNull();
    expect(url).toBe(
      `https://api.test/api/v1/summits/${summitId}/presentations/42/submission-period/reopen/notify`
    );
    expect(body).toEqual({ speaker_ids: [7, 12], include_submitter: true });
  });

  it("reports the recipient count from the response, not a client tally", async () => {
    arrangeRequest(Promise.resolve({ response: { recipients: 3 } }));

    await store.dispatch(
      notifySubmissionReopened(42, { speakerIds: [7], includeSubmitter: false })
    );

    expect(T.translate).toHaveBeenCalledWith(
      "edit_event.notify_speakers_success",
      { count: 3 }
    );

    const snackbar = store
      .getActions()
      .find((a) => a.type === "SET_SNACKBAR_MESSAGE");
    expect(snackbar).toBeDefined();
    expect(snackbar.payload.type).toBe("success");
  });

  it("stops loading even when the request rejects", async () => {
    arrangeRequest(Promise.reject(new Error("412")));

    await expect(
      store.dispatch(
        notifySubmissionReopened(42, {
          speakerIds: [7],
          includeSubmitter: false
        })
      )
    ).rejects.toThrow();

    expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
  });
});
