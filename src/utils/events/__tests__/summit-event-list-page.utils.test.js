/* eslint-env jest */

import { buildNameIdDDL, sortByOrder } from "../summit-event-list-page.utils";

describe("summit-event-list-page utils", () => {
  test("sortByOrder pushes missing order to the end", () => {
    const items = [
      { order: 10 },
      {},
      { order: "2" },
      { order: "" },
      { order: null }
    ];
    const sorted = items.slice().sort(sortByOrder);

    expect(sorted).toEqual([
      { order: "2" },
      { order: 10 },
      {},
      { order: "" },
      { order: null }
    ]);
  });

  test("buildNameIdDDL returns empty array for non-array values", () => {
    expect(buildNameIdDDL(null)).toEqual([]);
    expect(buildNameIdDDL(undefined)).toEqual([]);
    expect(buildNameIdDDL({})).toEqual([]);
  });

  test("buildNameIdDDL filters invalid records and maps valid ones", () => {
    const result = buildNameIdDDL([
      undefined,
      null,
      { id: null, name: "Invalid" },
      { id: 1 },
      { id: 9, name: "   " },
      { name: "Missing id" },
      { id: 2, name: "Valid" },
      { id: 0, name: "Zero id is valid" }
    ]);

    expect(result).toEqual([
      { label: "Valid", value: 2 },
      { label: "Zero id is valid", value: 0 }
    ]);
  });

  test("buildNameIdDDL sorts by order without mutating input", () => {
    const source = [
      { id: 1, name: "Last", order: 3 },
      { id: 2, name: "First", order: 1 },
      { id: 3, name: "No order" }
    ];
    const originalSnapshot = source.map((item) => ({ ...item }));

    const result = buildNameIdDDL(source);

    expect(result).toEqual([
      { label: "First", value: 2 },
      { label: "Last", value: 1 },
      { label: "No order", value: 3 }
    ]);
    expect(source).toEqual(originalSnapshot);
  });
});
