import {
  REQUEST_PAYMENT_PROFILES,
  RECEIVE_PAYMENT_PROFILES
} from "../../../actions/ticket-actions";
import paymentProfileListReducer from "../payment-profile-list-reducer";

const DEFAULT_STATE = {
  paymentProfiles: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalPaymentProfiles: 0
};

describe("paymentProfileListReducer", () => {
  test("REQUEST_PAYMENT_PROFILES stores search params", () => {
    const state = paymentProfileListReducer(DEFAULT_STATE, {
      type: REQUEST_PAYMENT_PROFILES,
      payload: {
        term: "stripe",
        page: 2,
        perPage: 25,
        order: "provider",
        orderDir: 0
      }
    });

    expect(state).toMatchObject({
      term: "stripe",
      currentPage: 2,
      perPage: 25,
      order: "provider",
      orderDir: 0
    });
  });

  test("RECEIVE_PAYMENT_PROFILES updates list and pagination", () => {
    const profiles = [
      { id: 1, provider: "stripe" },
      { id: 2, provider: "paypal" }
    ];
    const state = paymentProfileListReducer(DEFAULT_STATE, {
      type: RECEIVE_PAYMENT_PROFILES,
      payload: {
        response: {
          data: profiles,
          total: 2,
          current_page: 1,
          last_page: 3
        }
      }
    });

    expect(state.paymentProfiles).toEqual(profiles);
    expect(state.totalPaymentProfiles).toBe(2);
    expect(state.currentPage).toBe(1);
    expect(state.lastPage).toBe(3);
  });
});
