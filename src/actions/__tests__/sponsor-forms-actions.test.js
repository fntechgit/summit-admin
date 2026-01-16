/**
 * @jest-environment jsdom
 */
import { expect, jest, describe, it } from "@jest/globals";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getSponsorForms } from "../sponsor-forms-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
    __esModule: true,
    ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
    postRequest: jest.fn(),
    getRequest: jest.fn()
  }));

describe("Sponsor Forms Actions", () => {
  describe("GetSponsorForms", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      getRequest.mockImplementation(
        (
            requestActionCreator,
            receiveActionCreator,
            endpoint, // eslint-disable-line no-unused-vars
            payload, // eslint-disable-line no-unused-vars
            errorHandler = null, // eslint-disable-line no-unused-vars
            requestActionPayload = {}
          ) =>
          (
            params = {} // eslint-disable-line no-unused-vars
          ) =>
          (dispatch) => {
            if (
              requestActionCreator &&
              typeof requestActionCreator === "function"
            )
              dispatch(requestActionCreator(requestActionPayload));

            return new Promise((resolve) => {
              if (typeof receiveActionCreator === "function") {
                dispatch(receiveActionCreator({ response: {} }));
                resolve({ response: {} });
              }
              dispatch(receiveActionCreator);
              resolve({ response: {} });
            });
          }
      );
    });

    afterEach(() => {
      // restore the spy created with spyOn
      jest.restoreAllMocks();
    });
    describe("On perPage change", () => {
      it("should request first page if perPage is greater than the total items count", async () => {
        const store = mockStore({
          currentSummitState: {
            currentSummit: {}
          },
          sponsorFormsListState: {
            totalCount: 13
          }
        });

        store.dispatch(getSponsorForms("", 2, 50, "id", 1, false, []));
        await flushPromises();

        expect(getRequest).toHaveBeenCalled();
        expect(getRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          {
            hideArchived: false,
            order: "id",
            orderDir: 1,
            page: 1,
            perPage: 50,
            term: ""
          }
        );
      });

      it("should request user selected page if perPage is lower than the total items count", async () => {
        const store = mockStore({
          currentSummitState: {
            currentSummit: {}
          },
          sponsorFormsListState: {
            totalCount: 50
          }
        });

        store.dispatch(getSponsorForms("", 2, 20, "id", 1, false, []));
        await flushPromises();

        expect(getRequest).toHaveBeenCalled();
        expect(getRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          {
            hideArchived: false,
            order: "id",
            orderDir: 1,
            page: 2,
            perPage: 20,
            term: ""
          }
        );
      });
    });
  });
});
