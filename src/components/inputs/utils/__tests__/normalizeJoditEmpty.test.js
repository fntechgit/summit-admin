import { expect, describe, it } from "@jest/globals";
import normalizeJoditEmpty from "../normalizeJoditEmpty";

describe("normalizeJoditEmpty", () => {
  it("normalizes an empty string that is surrounded by html tags", () => {
    const inputString = "<p><br></p>";
    expect(normalizeJoditEmpty(inputString)).toBe("");
  });

  it("normalizes a string with content is returned without modifications", () => {
    const inputString = "<p>This is a content strign</p>";
    expect(normalizeJoditEmpty(inputString)).toBe(inputString);
  });
});
