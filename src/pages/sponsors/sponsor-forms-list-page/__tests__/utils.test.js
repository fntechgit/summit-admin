import { describe, expect, it } from "@jest/globals";
import { sameTierSet } from "../utils";

describe("sponsor forms list utils", () => {
  it("returns true for uncheck + recheck order change", () => {
    const prevIds = [1, 2, 3];
    const nextIds = [1, 3, 2];

    expect(sameTierSet(prevIds, nextIds)).toBe(true);
  });

  it("returns false when tier set actually changes", () => {
    const prevIds = [1, 2, 3];
    const nextIds = [1, 3, 4];

    expect(sameTierSet(prevIds, nextIds)).toBe(false);
  });
});
