/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  putRequest,
  deleteRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getTicket,
  getTicketTypes,
  deleteTicketType,
  changeTicketTypesCurrency,
  RECEIVE_TICKET
} from "../ticket-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  deleteRequest: jest.fn()
}));

const storeState = {
  currentSummitState: {
    currentSummit: { id: 42, time_zone: { name: "UTC" } }
  }
};

describe("ticket-actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeAll(() => {
    window.API_BASE_URL = "https://api.example.com";
  });

  afterAll(() => {
    delete window.API_BASE_URL;
  });

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getTicket", () => {
    it("drops the response of a superseded ticket fetch", async () => {
      const pending = [];
      getRequest.mockImplementation(
        (requestAction, receiveAction) => () => (dispatch) =>
          new Promise((resolve) => {
            pending.push((id) => {
              dispatch(receiveAction({ response: { id } }));
              resolve({ response: { id } });
            });
          })
      );
      const store = mockStore(storeState);

      const first = store.dispatch(getTicket(1));
      await flushPromises();
      const second = store.dispatch(getTicket(2));
      await flushPromises();
      pending[1](2);
      pending[0](1);
      await Promise.all([first, second]);

      const received = store
        .getActions()
        .filter((a) => a.type === RECEIVE_TICKET);
      expect(received).toHaveLength(1);
      expect(received[0].payload.response.id).toBe(2);
      expect(
        store.getActions().filter((a) => a.type === "STOP_LOADING")
      ).toHaveLength(1);
    });
  });

  describe("getTicketTypes", () => {
    let capturedParams;

    beforeEach(() => {
      capturedParams = null;
      getRequest.mockImplementation(
        (requestAction, receiveAction) => (params) => (dispatch) => {
          capturedParams = params;
          if (requestAction) dispatch(requestAction());
          dispatch(
            receiveAction({ response: { data: [], total: 0, last_page: 1 } })
          );
          return Promise.resolve();
        }
      );
    });

    it("combines audience, badge type and full sale-period filters with the search term", async () => {
      const store = mockStore(storeState);
      await store.dispatch(
        getTicketTypes("acme", "name", 1, 1, 10, {
          audience_filter: ["All", "WithPromoCode"],
          badge_type_filter: [1, 2],
          sale_period_filter: [100, 200]
        })
      );

      expect(capturedParams["filter[]"]).toEqual([
        "audience==All,audience==WithPromoCode",
        "badge_type_id==1||2",
        "sales_start_date>=100",
        "sales_end_date<=200",
        "name@@acme,description@@acme"
      ]);
    });

    it("only sends the set bound when just one side of the sale-period range is present", async () => {
      const store = mockStore(storeState);
      await store.dispatch(
        getTicketTypes(null, "name", 1, 1, 10, {
          sale_period_filter: [100, null]
        })
      );

      expect(capturedParams["filter[]"]).toEqual(["sales_start_date>=100"]);
    });

    it("appends an id match when the search term is numeric", async () => {
      const store = mockStore(storeState);
      await store.dispatch(getTicketTypes("123", "name", 1, 1, 10, {}));

      expect(capturedParams["filter[]"]).toEqual([
        "name@@123,description@@123,id==123"
      ]);
    });

    it("omits filter[] entirely when no filters or term are active", async () => {
      const store = mockStore(storeState);
      await store.dispatch(getTicketTypes(null, "name", 1, 1, 10, {}));

      expect(capturedParams).not.toHaveProperty("filter[]");
    });

    it("builds the order param from order/orderDir", async () => {
      const store = mockStore(storeState);
      await store.dispatch(getTicketTypes(null, "cost", -1, 1, 10, {}));

      expect(capturedParams.order).toBe("-cost");
    });

    it("dispatches STOP_LOADING after the response resolves", async () => {
      const store = mockStore(storeState);
      await store.dispatch(getTicketTypes(null, "name", 1, 1, 10, {}));

      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });
  });

  describe("deleteTicketType", () => {
    it("sends a DELETE request to the ticket type endpoint and dispatches TICKET_TYPE_DELETED", async () => {
      deleteRequest.mockImplementation(
        (requestAction, receiveAction) => () => (dispatch) => {
          if (typeof receiveAction === "function") dispatch(receiveAction());
          else dispatch(receiveAction);
          return Promise.resolve();
        }
      );

      const store = mockStore(storeState);
      await store.dispatch(deleteTicketType(7));

      expect(deleteRequest).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          type: "TICKET_TYPE_DELETED",
          payload: { ticketTypeId: 7 }
        }),
        "https://api.example.com/api/v1/summits/42/ticket-types/7",
        null,
        expect.any(Function)
      );
      expect(
        store.getActions().some((a) => a.type === "TICKET_TYPE_DELETED")
      ).toBe(true);
    });
  });

  describe("changeTicketTypesCurrency", () => {
    it("PUTs the new currency and dispatches TICKET_TYPES_CURRENCY_UPDATED, then stops loading via the success message", async () => {
      putRequest.mockImplementation(
        (requestAction, receiveAction) => () => (dispatch) => {
          if (typeof receiveAction === "function") dispatch(receiveAction());
          else dispatch(receiveAction);
          return Promise.resolve();
        }
      );

      const store = mockStore(storeState);
      await store.dispatch(changeTicketTypesCurrency("EUR"));
      await flushPromises();

      expect(putRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          type: "TICKET_TYPES_CURRENCY_UPDATED",
          payload: { currency: "EUR" }
        }),
        "https://api.example.com/api/v1/summits/42/ticket-types/all/currency/EUR",
        {},
        expect.any(Function)
      );

      // showSuccessMessage (uicore) dispatches STOP_LOADING itself, not a snackbar action
      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TICKET_TYPES_CURRENCY_UPDATED");
      expect(actionTypes).toContain("STOP_LOADING");
    });
  });
});
