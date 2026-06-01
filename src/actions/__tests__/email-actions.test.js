import { describe, it, expect } from "@jest/globals";
import { buildRenderPayload } from "../email-actions";

describe("Email Actions", () => {
  describe("buildRenderPayload", () => {
    it("sends the mjml param when isMjml is true", () => {
      expect(
        buildRenderPayload({ summit_name: "X" }, "<mjml></mjml>", true)
      ).toEqual({
        payload: { summit_name: "X" },
        mjml: "<mjml></mjml>"
      });
    });

    it("sends the html param when isMjml is false", () => {
      expect(
        buildRenderPayload({ summit_name: "X" }, "<p>{{x}}</p>", false)
      ).toEqual({
        payload: { summit_name: "X" },
        html: "<p>{{x}}</p>"
      });
    });

    it("defaults to the html param when isMjml is undefined (backward compat)", () => {
      expect(buildRenderPayload({ a: 1 }, "<p>hi</p>", undefined)).toEqual({
        payload: { a: 1 },
        html: "<p>hi</p>"
      });
    });
  });
});
