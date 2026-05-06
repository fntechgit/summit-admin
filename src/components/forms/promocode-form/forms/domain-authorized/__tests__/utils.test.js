import { fireChange, isDomainAuthorizedClass } from "../utils";

describe("domain-authorized/utils", () => {
  describe("fireChange", () => {
    it("calls handleChange with a synthesized text event by default", () => {
      const handleChange = jest.fn();
      fireChange(handleChange, "foo", "bar");
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith({
        target: { id: "foo", value: "bar", type: "text" }
      });
    });

    it("forwards `extra` props onto the synthesized target (checkbox case)", () => {
      const handleChange = jest.fn();
      fireChange(handleChange, "box", true, "checkbox", { checked: true });
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith({
        target: { id: "box", value: true, type: "checkbox", checked: true }
      });
    });
  });

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
