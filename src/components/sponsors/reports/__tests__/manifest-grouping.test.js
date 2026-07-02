import { bucketLinesBySponsor } from "../manifest-grouping";

const line = (sponsorId, name, itemCode) => ({
  sponsor: { id: sponsorId, name },
  item_code: itemCode
});

describe("bucketLinesBySponsor", () => {
  it("returns [] for no rows", () => {
    expect(bucketLinesBySponsor([])).toEqual([]);
  });

  it("groups by sponsor.id preserving first-seen order", () => {
    const groups = bucketLinesBySponsor([
      line(17, "Acme", "A1"),
      line(9, "Globex", "G1"),
      line(17, "Acme", "A2")
    ]);
    expect(groups.map((g) => g.sponsorId)).toEqual([17, 9]);
    expect(groups[0].lines.map((l) => l.item_code)).toEqual(["A1", "A2"]);
    expect(groups[1].sponsorName).toBe("Globex");
  });

  it("keeps a sponsor in ONE group even when its rows are non-adjacent (same name, interleaved)", () => {
    // Two distinct ids sharing a name, interleaved by date as the backend would order them.
    const groups = bucketLinesBySponsor([
      line(17, "Dup Name", "X1"),
      line(42, "Dup Name", "Y1"),
      line(17, "Dup Name", "X2")
    ]);
    expect(groups).toHaveLength(2);
    const acme = groups.find((g) => g.sponsorId === 17);
    expect(acme.lines.map((l) => l.item_code)).toEqual(["X1", "X2"]);
  });

  it("buckets rows with a missing sponsor id under a single null group", () => {
    const groups = bucketLinesBySponsor([
      { item_code: "Z1" },
      { sponsor: {}, item_code: "Z2" }
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].sponsorId).toBeNull();
    expect(groups[0].lines).toHaveLength(2);
  });
});
