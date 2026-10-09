/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  deleteRequest,
  getRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  forceDeleteExtraQuestion,
  getSponsorExtraQuestionUsage,
  SPONSOR_EXTRA_QUESTION_DELETED
} from "../sponsor-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  deleteRequest: jest.fn(),
  getRequest: jest.fn()
}));

const ENDPOINT =
  "http://api.test/api/v1/summits/7/sponsors/5/extra-questions/9";

describe("sponsor extra question force delete actions", () => {
  const mockStore = configureStore([thunk]);
  let store;

  beforeEach(() => {
    window.API_BASE_URL = "http://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    store = mockStore({ currentSummitState: { currentSummit: { id: 7 } } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe("forceDeleteExtraQuestion", () => {
    // deleteRequest(request, receive, endpoint, payload, errorHandler)(params)(dispatch)
    const mockDelete = (outcome) => {
      const withDispatch = jest.fn(() => outcome);
      const withParams = jest.fn(() => withDispatch);
      deleteRequest.mockImplementation(() => withParams);
      return withParams;
    };

    it("sends force=true and the reason, without delete_answers when the server holds no answers", async () => {
      const withParams = mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        forceDeleteExtraQuestion(5, 9, { reason: "created by mistake" })
      );

      expect(deleteRequest).toHaveBeenCalledWith(
        null,
        expect.anything(),
        ENDPOINT,
        { reason: "created by mistake" },
        expect.any(Function)
      );
      expect(withParams).toHaveBeenCalledWith({
        access_token: "TOKEN",
        force: true
      });
    });

    it("sends delete_answers=true only when the answers were confirmed", async () => {
      const withParams = mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        forceDeleteExtraQuestion(5, 9, {
          reason: "sponsor insists",
          deleteAnswers: true
        })
      );

      expect(withParams).toHaveBeenCalledWith({
        access_token: "TOKEN",
        force: true,
        delete_answers: true
      });
    });

    it("reports the success once the question is deleted", async () => {
      mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(forceDeleteExtraQuestion(5, 9, { reason: "x" }));
      await flushPromises();

      // the reducer removes the question on the action given to the request
      expect(deleteRequest.mock.calls[0][1]).toEqual({
        type: SPONSOR_EXTRA_QUESTION_DELETED,
        payload: { questionId: 9 }
      });
      expect(
        store.getActions().some((a) => a.type === "SET_SNACKBAR_MESSAGE")
      ).toBe(true);
    });

    it("rejects and does not report success when the delete fails", async () => {
      mockDelete(Promise.reject(new Error("412")));

      await expect(
        store.dispatch(forceDeleteExtraQuestion(5, 9, { reason: "x" }))
      ).rejects.toThrow("412");
      expect(
        store.getActions().some((a) => a.type === "SET_SNACKBAR_MESSAGE")
      ).toBe(false);
    });
  });

  describe("getSponsorExtraQuestionUsage", () => {
    it("reads the usage of the question and resolves with it", async () => {
      const usage = { answers_count: 3, reps_count: 1, reps: [] };
      getRequest.mockImplementation(
        () => () => () => Promise.resolve({ response: usage })
      );

      await expect(
        store.dispatch(getSponsorExtraQuestionUsage(5, 9))
      ).resolves.toEqual(usage);
      expect(getRequest).toHaveBeenCalledWith(
        null,
        expect.anything(),
        `${ENDPOINT}/usage`,
        expect.any(Function)
      );
    });

    it("rejects when the usage can't be read", async () => {
      getRequest.mockImplementation(
        () => () => () => Promise.reject(new Error("403"))
      );

      await expect(
        store.dispatch(getSponsorExtraQuestionUsage(5, 9))
      ).rejects.toThrow("403");
    });
  });
});
