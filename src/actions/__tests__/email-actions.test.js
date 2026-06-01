import { describe, it, expect } from "@jest/globals";
import { buildRenderPayload, normalizeRenderErrors } from "../email-actions";

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

  describe("normalizeRenderErrors", () => {
    it("passes a 412 string array through unchanged", () => {
      expect(
        normalizeRenderErrors([
          "Invalid MJML syntax: <mj-foo> unknown",
          "line 2"
        ])
      ).toEqual(["Invalid MJML syntax: <mj-foo> unknown", "line 2"]);
    });

    it("wraps a bare 500 'server error' string in an array", () => {
      expect(normalizeRenderErrors("server error")).toEqual(["server error"]);
    });

    it("flattens an object error body to a string array", () => {
      expect(normalizeRenderErrors({ mjml: ["bad tag"] })).toEqual(["bad tag"]);
    });

    it("flattens a multi-key object body across all values", () => {
      expect(normalizeRenderErrors({ mjml: ["a"], html: ["b"] })).toEqual([
        "a",
        "b"
      ]);
    });

    it("normalizes an object whose values are plain strings", () => {
      expect(normalizeRenderErrors({ detail: "boom" })).toEqual(["boom"]);
    });

    it("returns a reachability message when there is no response body", () => {
      expect(normalizeRenderErrors(undefined)).toEqual([
        "Could not reach the email preview service. Please try again."
      ]);
    });
  });
});
