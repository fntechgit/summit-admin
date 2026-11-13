import paymentProfileReducer, {
  DEFAULT_ENTITY
} from "../payment-profile-reducer";
import {
  RECEIVE_PAYMENT_PROFILE,
  PAYMENT_PROFILE_UPDATED
} from "../../../actions/ticket-actions";

describe("paymentProfileReducer", () => {
  test.each([RECEIVE_PAYMENT_PROFILE, PAYMENT_PROFILE_UPDATED])(
    "%s never stores secret keys",
    (type) => {
      const state = paymentProfileReducer(undefined, {
        type,
        payload: {
          response: {
            id: 5,
            live_secret_key: "sk_live_xxx",
            test_secret_key: "sk_test_xxx",
            has_live_secret_key: true,
            merchant_account_id: null
          }
        }
      });

      expect(state.entity).toEqual({
        ...DEFAULT_ENTITY,
        id: 5,
        has_live_secret_key: true,
        merchant_account_id: ""
      });
    }
  );
});
