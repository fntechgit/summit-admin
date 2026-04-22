import { DEFAULT_ENTITY } from "../promocode-reducer";

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
