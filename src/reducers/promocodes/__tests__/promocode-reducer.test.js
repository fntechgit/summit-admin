import promocodeReducer, { DEFAULT_ENTITY } from "../promocode-reducer";
import { RECEIVE_PROMOCODE } from "../../../actions/promocode-actions";

describe("DEFAULT_ENTITY", () => {
  it("includes allowed_email_domains as an empty array", () => {
    expect(DEFAULT_ENTITY.allowed_email_domains).toEqual([]);
  });

  it("includes quantity_per_account as 0 (unlimited sentinel)", () => {
    expect(DEFAULT_ENTITY.quantity_per_account).toBe(0);
  });

  it("includes auto_apply as false", () => {
    expect(DEFAULT_ENTITY.auto_apply).toBe(false);
  });

  it("still contains the existing allows_to_reassign field defaulting to true", () => {
    expect(DEFAULT_ENTITY.allows_to_reassign).toBe(true);
  });
});

describe("RECEIVE_PROMOCODE allowed_email_domains coercion", () => {
  it("forces null allowed_email_domains to [] (not empty string)", () => {
    const state = promocodeReducer(undefined, {
      type: RECEIVE_PROMOCODE,
      payload: {
        response: {
          id: 1,
          class_name: "DOMAIN_AUTHORIZED_PROMO_CODE",
          allowed_email_domains: null,
          ticket_types_rules: []
        }
      }
    });
    expect(state.entity.allowed_email_domains).toEqual([]);
  });

  it("preserves an array of allowed_email_domains from the server", () => {
    const state = promocodeReducer(undefined, {
      type: RECEIVE_PROMOCODE,
      payload: {
        response: {
          id: 1,
          class_name: "DOMAIN_AUTHORIZED_PROMO_CODE",
          allowed_email_domains: ["@acme.com", ".edu"],
          ticket_types_rules: []
        }
      }
    });
    expect(state.entity.allowed_email_domains).toEqual(["@acme.com", ".edu"]);
  });

  it("forces undefined allowed_email_domains to []", () => {
    const state = promocodeReducer(undefined, {
      type: RECEIVE_PROMOCODE,
      payload: {
        response: {
          id: 1,
          class_name: "DOMAIN_AUTHORIZED_PROMO_CODE",
          ticket_types_rules: []
        }
      }
    });
    expect(state.entity.allowed_email_domains).toEqual([]);
  });
});
