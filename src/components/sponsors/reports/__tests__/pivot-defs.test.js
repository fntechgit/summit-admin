import { AXES, PIVOTS } from "../pivot-defs";

const row = {
  sponsor: { id: 7, name: "Acme", tier: "GOLD" },
  page: { id: 99, title: "Booth Staff" },
  module: { component_name: "Logo" }
};

describe("AXES", () => {
  it("extracts sponsor key/label", () => {
    expect(AXES.sponsor.keyOf(row)).toBe(7);
    expect(AXES.sponsor.labelOf(row)).toBe("Acme");
  });
});

describe("PIVOTS", () => {
  it("defines the five JP pivots", () => {
    expect(PIVOTS.map((p) => p.key)).toEqual([
      "sponsor_page_component",
      "page_component_sponsor",
      "page_sponsor_component",
      "component_sponsor",
      "tier_sponsor_page_component"
    ]);
  });
});
