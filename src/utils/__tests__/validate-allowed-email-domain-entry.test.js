import { validateAllowedEmailDomainEntry } from "../methods";

describe("validateAllowedEmailDomainEntry", () => {
  describe("valid entries", () => {
    it.each([
      ["@acme.com"],
      ["@sub.acme.com"],
      ["@a.b.c.d"],
      ["@my-company.com"], // internal hyphen allowed
      ["@a-b.c-d.com"], // internal hyphens across multiple labels
      [".edu"],
      [".co.uk"],
      [".EDU"], // uppercase TLD accepted per server's /i flag
      [".CO.UK"], // uppercase multi-part TLD accepted
      [".a"],
      ["user@example.com"],
      ["user@my-company.example.co.uk"], // internal hyphens in email host
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
      ["@.com"], // empty first label
      ["@my_domain.com"], // underscore in label
      ["@example_.com"], // underscore in label
      ["@acme-.com"], // label ending in hyphen
      ["@-acme.com"], // label starting with hyphen
      ["@example.-com"], // sub-label starting with hyphen
      ["@example.com-"] // last label ending with hyphen
    ])("rejects %p", (entry) => {
      expect(validateAllowedEmailDomainEntry(entry)).toBe(false);
    });
  });

  describe("email invalid entries (ALLOWED_EMAIL_RE label rules)", () => {
    it.each([
      ["user@my_domain.com"], // underscore in domain label
      ["user@acme-.com"] // label ending in hyphen
    ])("rejects %p", (entry) => {
      expect(validateAllowedEmailDomainEntry(entry)).toBe(false);
    });
  });
});
