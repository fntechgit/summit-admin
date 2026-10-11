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
  deleteExtraQuestion,
  deleteSponsorExtraQuestionValue,
  getSponsorExtraQuestionUsage,
  getSponsorExtraQuestionValueUsage,
  SPONSOR_EXTRA_QUESTION_DELETED,
  SPONSOR_EXTRA_QUESTION_VALUE_DELETED
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

describe("sponsor extra question delete actions", () => {
  const mockStore = configureStore([thunk]);
  let store;

  beforeEach(() => {
    window.API_BASE_URL = "http://api.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    // the option actions read the sponsor from the state
    store = mockStore({
      currentSummitState: { currentSummit: { id: 7 } },
      currentSponsorState: { entity: { id: 5 } }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  // deleteRequest(request, receive, endpoint, payload, errorHandler)(params)(dispatch)
  const mockDelete = (outcome) => {
    const withDispatch = jest.fn(() => outcome);
    const withParams = jest.fn(() => withDispatch);
    deleteRequest.mockImplementation(() => withParams);
    return withParams;
  };

  describe("deleteExtraQuestion", () => {
    it("sends the reason and delete_answers=false when the server holds no answers", async () => {
      const withParams = mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        deleteExtraQuestion(5, 9, { reason: "created by mistake" })
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
        delete_answers: false
      });
    });

    it("sends delete_answers=true when the answers were confirmed", async () => {
      const withParams = mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        deleteExtraQuestion(5, 9, {
          reason: "sponsor insists",
          deleteAnswers: true
        })
      );

      expect(withParams).toHaveBeenCalledWith({
        access_token: "TOKEN",
        delete_answers: true
      });
    });

    it("reports the success once the question is deleted", async () => {
      mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(deleteExtraQuestion(5, 9, { reason: "x" }));
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
        store.dispatch(deleteExtraQuestion(5, 9, { reason: "x" }))
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

  describe("deleteSponsorExtraQuestionValue", () => {
    const VALUE_ENDPOINT = `${ENDPOINT}/values/31`;

    it("sends the reason and delete_answers=false when no answers use the option", async () => {
      const withParams = mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        deleteSponsorExtraQuestionValue(9, 31, { reason: "typo in label" })
      );

      expect(deleteRequest).toHaveBeenCalledWith(
        null,
        expect.anything(),
        VALUE_ENDPOINT,
        { reason: "typo in label" },
        expect.any(Function)
      );
      expect(withParams).toHaveBeenCalledWith({
        access_token: "TOKEN",
        delete_answers: false
      });
    });

    it("sends delete_answers=true when the changed answers were confirmed", async () => {
      const withParams = mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        deleteSponsorExtraQuestionValue(9, 31, {
          reason: "sponsor insists",
          deleteAnswers: true
        })
      );

      expect(withParams).toHaveBeenCalledWith({
        access_token: "TOKEN",
        delete_answers: true
      });
    });

    it("removes the option and reports the success once it is deleted", async () => {
      mockDelete(Promise.resolve({ response: {} }));

      await store.dispatch(
        deleteSponsorExtraQuestionValue(9, 31, { reason: "x" })
      );
      await flushPromises();

      expect(deleteRequest.mock.calls[0][1]).toEqual({
        type: SPONSOR_EXTRA_QUESTION_VALUE_DELETED,
        payload: { valueId: 31 }
      });
      expect(
        store.getActions().some((a) => a.type === "SET_SNACKBAR_MESSAGE")
      ).toBe(true);
    });

    it("rejects and does not report success when the delete fails", async () => {
      mockDelete(Promise.reject(new Error("412")));

      await expect(
        store.dispatch(deleteSponsorExtraQuestionValue(9, 31, { reason: "x" }))
      ).rejects.toThrow("412");
      expect(
        store.getActions().some((a) => a.type === "SET_SNACKBAR_MESSAGE")
      ).toBe(false);
    });
  });

  describe("getSponsorExtraQuestionValueUsage", () => {
    it("reads the usage of the option and resolves with it", async () => {
      const usage = {
        answers_count: 3,
        answers_to_delete: 1,
        answers_to_modify: 2,
        reps_count: 0,
        reps: []
      };
      getRequest.mockImplementation(
        () => () => () => Promise.resolve({ response: usage })
      );

      await expect(
        store.dispatch(getSponsorExtraQuestionValueUsage(9, 31))
      ).resolves.toEqual(usage);
      expect(getRequest).toHaveBeenCalledWith(
        null,
        expect.anything(),
        `${ENDPOINT}/values/31/usage`,
        expect.any(Function)
      );
    });

    it("rejects when the usage can't be read", async () => {
      getRequest.mockImplementation(
        () => () => () => Promise.reject(new Error("403"))
      );

      await expect(
        store.dispatch(getSponsorExtraQuestionValueUsage(9, 31))
      ).rejects.toThrow("403");
    });
  });
});
