import { validateAllowedEmailDomainEntry } from "../methods";

describe("validateAllowedEmailDomainEntry", () => {
  describe("valid entries", () => {
    it.each([
      ["@acme.com"],
      ["@sub.acme.com"],
      ["@a.b.c.d"],
      [".edu"],
      [".co.uk"],
      [".EDU"], // uppercase TLD accepted per server's /i flag
      [".CO.UK"], // uppercase multi-part TLD accepted
      [".a"],
      ["user@example.com"],
      ["first.last+tag@example.co"]
    ])("accepts %s", (entry) => {
      expect(validateAllowedEmailDomainEntry(entry)).toBe(true);
    });
  });

  describe("invalid entries", () => {
    it.each([
      [""],
      ["   "],
      ["acme.com"], // no leading @
      ["@acme"], // no dot after @
      ["@"], // empty domain
      ["user@"], // no domain after @
      ["@@acme.com"], // double @
      ["user @example.com"], // whitespace
      [null],
      [undefined],
      ["user@abc"], // no TLD dot
      ["user@example..com"], // consecutive dots
      ["user@example.com."], // trailing dot
      ["user@acme"] // no dot, single-segment domain
    ])("rejects %p", (entry) => {
      expect(validateAllowedEmailDomainEntry(entry)).toBe(false);
    });
  });

  describe("domain-only invalid entries (ALLOWED_DOMAIN_RE)", () => {
    it.each([
      ["@example..com"], // consecutive dots
      ["@example.com."], // trailing dot
      ["@.com"] // empty first label
    ])("rejects %p", (entry) => {
      expect(validateAllowedEmailDomainEntry(entry)).toBe(false);
    });
  });
});
