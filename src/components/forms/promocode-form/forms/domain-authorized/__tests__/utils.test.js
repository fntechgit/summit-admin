import { isDomainAuthorizedClass } from "../utils";

describe("domain-authorized/utils", () => {
  describe("isDomainAuthorizedClass", () => {
    it("returns true for DOMAIN_AUTHORIZED_PROMO_CODE", () => {
      expect(isDomainAuthorizedClass("DOMAIN_AUTHORIZED_PROMO_CODE")).toBe(
        true
      );
    });
    it("returns true for DOMAIN_AUTHORIZED_DISCOUNT_CODE", () => {
      expect(isDomainAuthorizedClass("DOMAIN_AUTHORIZED_DISCOUNT_CODE")).toBe(
        true
      );
    });
    it("returns false for MEMBER_PROMO_CODE", () => {
      expect(isDomainAuthorizedClass("MEMBER_PROMO_CODE")).toBe(false);
    });
    it("returns false for undefined", () => {
      expect(isDomainAuthorizedClass(undefined)).toBe(false);
    });
    it("returns false for empty string", () => {
      expect(isDomainAuthorizedClass("")).toBe(false);
    });
  });
});
