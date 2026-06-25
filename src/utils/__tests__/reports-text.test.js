import { toPlainText } from "../reports-text";

describe("toPlainText", () => {
  it("returns empty string for null/undefined", () => {
    expect(toPlainText(null)).toBe("");
    expect(toPlainText(undefined)).toBe("");
  });

  it("strips tags and collapses whitespace", () => {
    expect(toPlainText("<p>Hello</p>  <b>world</b>")).toBe("Hello world");
  });

  it("decodes common lowercase entities", () => {
    expect(toPlainText("a &amp; b &lt;tag&gt; &nbsp;x")).toBe("a & b <tag> x");
    expect(toPlainText("it&#39;s")).toBe("it's");
  });

  it("decodes uppercase / mixed-case entities (case-insensitive)", () => {
    expect(toPlainText("a &AMP; b")).toBe("a & b");
    expect(toPlainText("x&NBSP;y")).toBe("x y");
    expect(toPlainText("&LT;tag&GT;")).toBe("<tag>");
  });

  it("leaves unknown entities untouched", () => {
    expect(toPlainText("5 &deg; &Copy;")).toBe("5 &deg; &Copy;");
  });
});
