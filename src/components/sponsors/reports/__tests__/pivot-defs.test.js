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
  it("buckets a blank tier as unknown with a (No tier) label", () => {
    const noTier = { sponsor: { id: 1, name: "X", tier: "" } };
    expect(AXES.tier.isUnknown(noTier)).toBe(true);
    expect(AXES.tier.labelOf(noTier)).toBe("(No tier)");
  });
  it("buckets a blank component as unknown with an (Unnamed) label", () => {
    const noComp = { module: { component_name: "" } };
    expect(AXES.component.isUnknown(noComp)).toBe(true);
    expect(AXES.component.labelOf(noComp)).toBe("(Unnamed)");
  });
  it("trims whitespace from component labels so key and label stay in sync", () => {
    const padded = { module: { component_name: " Logo " } };
    const exact = { module: { component_name: "logo" } };
    // Both collapse to the same bucket key.
    expect(AXES.component.keyOf(padded)).toBe(AXES.component.keyOf(exact));
    // Label is trimmed but preserves original casing.
    expect(AXES.component.labelOf(padded)).toBe("Logo");
  });
  it("uses page title as the page label", () => {
    expect(AXES.page.keyOf(row)).toBe(99);
    expect(AXES.page.labelOf(row)).toBe("Booth Staff");
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
  it("every pivot axis references a defined AXES entry", () => {
    PIVOTS.forEach((p) => p.axes.forEach((a) => expect(AXES[a]).toBeDefined()));
  });
});
