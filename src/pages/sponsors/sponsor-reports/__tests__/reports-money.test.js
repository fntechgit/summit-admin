import { formatUsd } from "../reports-money";

describe("formatUsd", () => {
  it("formats numbers as USD", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(5)).toBe("$5.00");
  });

  it("formats numeric strings", () => {
    expect(formatUsd("4754.15")).toBe("$4,754.15");
  });

  it("renders an em dash for missing / non-numeric values", () => {
    expect(formatUsd(null)).toBe("—");
    expect(formatUsd(undefined)).toBe("—");
    expect(formatUsd("abc")).toBe("—");
  });

  it("treats blank / whitespace-only strings as missing, not zero", () => {
    expect(formatUsd("")).toBe("—");
    expect(formatUsd("   ")).toBe("—");
  });

  it("renders an em dash for non-finite numbers", () => {
    expect(formatUsd(Infinity)).toBe("—");
    expect(formatUsd(-Infinity)).toBe("—");
  });
});
