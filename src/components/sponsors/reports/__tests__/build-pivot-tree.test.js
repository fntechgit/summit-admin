import { buildPivotTree } from "../build-pivot-tree";

const mk = (sid, sname, tier, pid, ptitle, comp, status) => ({
  sponsor: { id: sid, name: sname, tier },
  page: { id: pid, title: ptitle },
  module: { component_name: comp },
  status
});

const rows = [
  mk(1, "Acme", "GOLD", 99, "Booth Staff", "Logo", "completed"),
  mk(1, "Acme", "GOLD", 99, "Booth Staff", "Banner", "pending"),
  mk(2, "Cyber", "", 99, "Booth Staff", "Logo", "completed")
];

describe("buildPivotTree", () => {
  it("nests page → sponsor → component and counts rows", () => {
    const tree = buildPivotTree(rows, ["page", "sponsor", "component"]);
    expect(tree).toHaveLength(1); // one page
    expect(tree[0].label).toBe("Booth Staff");
    expect(tree[0].count).toBe(3);
    const sponsors = tree[0].children;
    expect(sponsors.map((s) => s.label)).toEqual(["Acme", "Cyber"]); // label asc
    const acmeComponents = sponsors[0].children;
    expect(acmeComponents.map((c) => c.label).sort()).toEqual([
      "Banner",
      "Logo"
    ]);
    expect(acmeComponents[0].leaves).toHaveLength(1); // leaf holds the row(s)
  });

  it("sinks the (No tier) bucket last", () => {
    const tree = buildPivotTree(rows, ["tier", "sponsor"]);
    expect(tree.map((t) => t.label)).toEqual(["GOLD", "(No tier)"]);
    expect(tree[1].isUnknown).toBe(true);
  });

  it("tallies a status rollup per node", () => {
    const tree = buildPivotTree(rows, ["page"]);
    expect(tree[0].statusRollup).toEqual({
      completed: 2,
      in_progress: 0,
      pending: 1
    });
  });
});
