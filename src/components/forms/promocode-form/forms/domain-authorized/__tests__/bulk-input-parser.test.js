import {
  parseTextBlob,
  normalizeEntry,
  classifyEntries,
  LARGE_DOMAIN_LIST_THRESHOLD
} from "../bulk-input-parser";

describe("LARGE_DOMAIN_LIST_THRESHOLD", () => {
  it("is 50", () => {
    expect(LARGE_DOMAIN_LIST_THRESHOLD).toBe(50);
  });
});

describe("parseTextBlob", () => {
  it("splits on newline, comma, tab, semicolon, and mixed separators", () => {
    const raw = "@a.com\n@b.com,@c.com\t@d.com;@e.com";
    const rows = parseTextBlob(raw);
    expect(rows.map((r) => r.entry)).toEqual([
      "@a.com",
      "@b.com",
      "@c.com",
      "@d.com",
      "@e.com"
    ]);
  });

  it("trims whitespace and drops empty rows", () => {
    const rows = parseTextBlob("  @a.com  \n\n@b.com\n   \n");
    expect(rows.map((r) => r.entry)).toEqual(["@a.com", "@b.com"]);
  });

  it("preserves 1-based source row numbers", () => {
    const rows = parseTextBlob("@a.com\n@b.com\n@c.com");
    expect(rows[0].sourceRow).toBeGreaterThan(0);
    expect(rows.map((r) => r.entry)).toEqual(["@a.com", "@b.com", "@c.com"]);
  });

  it("returns [] for non-string input", () => {
    expect(parseTextBlob(null)).toEqual([]);
    expect(parseTextBlob(undefined)).toEqual([]);
    expect(parseTextBlob(123)).toEqual([]);
  });
});

describe("normalizeEntry", () => {
  it("preserves user-typed casing in normalized; dedupKey is lowercased", () => {
    expect(normalizeEntry("User@ACME.com")).toEqual({
      normalized: "User@ACME.com",
      dedupKey: "user@acme.com",
      autoPrefixed: false
    });
  });

  it("auto-prefixes @ on bare domains; preserves casing of the rest", () => {
    expect(normalizeEntry("ACME.com")).toEqual({
      normalized: "@ACME.com",
      dedupKey: "@acme.com",
      autoPrefixed: true
    });
  });

  it("auto-prefixes q.io (single-char SLD)", () => {
    expect(normalizeEntry("q.io")).toEqual({
      normalized: "@q.io",
      dedupKey: "@q.io",
      autoPrefixed: true
    });
  });

  it("auto-prefixes a.co (single-char label, 2-char TLD)", () => {
    expect(normalizeEntry("a.co")).toEqual({
      normalized: "@a.co",
      dedupKey: "@a.co",
      autoPrefixed: true
    });
  });

  it("does NOT auto-prefix entries that already start with @ or .", () => {
    expect(normalizeEntry("@acme.com").autoPrefixed).toBe(false);
    expect(normalizeEntry(".edu").autoPrefixed).toBe(false);
  });

  it("does NOT auto-prefix entries containing @ (likely user@domain)", () => {
    expect(normalizeEntry("user@acme.com").autoPrefixed).toBe(false);
  });

  it("trims whitespace; returns empty fields for whitespace-only input", () => {
    expect(normalizeEntry("   ")).toEqual({
      normalized: "",
      dedupKey: "",
      autoPrefixed: false
    });
  });
});

describe("classifyEntries", () => {
  it("classifies a single valid entry", () => {
    const raw = parseTextBlob("@acme.com");
    expect(classifyEntries({ raw, existing: [] })).toMatchObject({
      valid: [expect.objectContaining({ normalized: "@acme.com" })],
      invalid: [],
      dupExisting: [],
      dupInput: [],
      autoPrefixed: []
    });
  });

  it("case-insensitive dedup against existing", () => {
    const raw = parseTextBlob("@ACME.COM");
    const result = classifyEntries({ raw, existing: ["@acme.com"] });
    expect(result.valid).toHaveLength(0);
    expect(result.dupExisting).toHaveLength(1);
  });

  it("case-insensitive dedup within input (first wins)", () => {
    const raw = parseTextBlob("@Acme.com\n@ACME.COM");
    const result = classifyEntries({ raw, existing: [] });
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].normalized).toBe("@Acme.com");
    expect(result.dupInput).toHaveLength(1);
  });

  it("classifies invalid entries (server-relaxed, client-strict)", () => {
    const raw = parseTextBlob("@acme_corp.com\nuser@abc");
    const result = classifyEntries({ raw, existing: [] });
    expect(result.invalid).toHaveLength(2);
    expect(result.valid).toHaveLength(0);
  });

  it("tracks auto-prefixed valid entries in both valid AND autoPrefixed lists", () => {
    const raw = parseTextBlob("acme.com");
    const result = classifyEntries({ raw, existing: [] });
    expect(result.valid).toHaveLength(1);
    expect(result.autoPrefixed).toHaveLength(1);
    expect(result.valid[0].normalized).toBe("@acme.com");
  });

  it("realistic mixed input — 1 valid, 1 dupExisting, 1 dupInput, 1 invalid, 1 bare auto-prefix", () => {
    const raw = parseTextBlob(
      "@new.com\n@acme.com\n@ACME.com\nnot-a-domain\nbeta.io"
    );
    const result = classifyEntries({ raw, existing: ["@acme.com"] });
    expect(result.valid.map((v) => v.normalized).sort()).toEqual(
      ["@beta.io", "@new.com"].sort()
    );
    expect(result.dupExisting).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.autoPrefixed).toHaveLength(1);
  });
});
