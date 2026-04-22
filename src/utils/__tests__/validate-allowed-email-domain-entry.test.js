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
      [undefined]
    ])("rejects %p", (entry) => {
      expect(validateAllowedEmailDomainEntry(entry)).toBe(false);
    });
  });
});
