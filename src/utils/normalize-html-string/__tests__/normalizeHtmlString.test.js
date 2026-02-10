import { expect, describe, it } from "@jest/globals";
import normalizeHtmlString from "../index";

describe("normalizeHtmlString", () => {
  it("normalizes an empty string that is surrounded by html tags", () => {
    const inputString = "<p><br></p>";
    expect(normalizeHtmlString(inputString)).toBe("");
  });

  it("normalizes a string with content is returned without modifications", () => {
    const inputString = "<p>This is a content strign</p>";
    expect(normalizeHtmlString(inputString)).toBe(inputString);
  });
});
