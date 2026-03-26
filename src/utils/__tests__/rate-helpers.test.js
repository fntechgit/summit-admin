import {
  isRateEnabled,
  rateFromCents,
  rateToCents,
  formatRateFromCents
} from "../rate-helpers";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

describe("isRateEnabled", () => {
  it("should return false for null", () => {
    expect(isRateEnabled(null)).toBe(false);
  });

  it("should return true for 0", () => {
    expect(isRateEnabled(0)).toBe(true);
  });

  it("should returns true for a positive value", () => {
    expect(isRateEnabled(10)).toBe(true);
  });
});

describe("rateFromCents", () => {
  it("should return null for null", () => {
    expect(rateFromCents(null)).toBeNull();
  });

  it("should display 0 cents as 0.00", () => {
    expect(rateFromCents(0)).toBe("0.00");
  });

  it("should display cents with decimals correctly", () => {
    expect(rateFromCents(1050)).toBe("10.50");
  });
});

describe("rateToCents", () => {
  it("should return null for null", () => {
    expect(rateToCents(null)).toBeNull();
  });

  it("should return 0 for empty string (cleared input field)", () => {
    expect(rateToCents("")).toBe(0);
  });

  it("should converts 0 to 0 cents", () => {
    expect(rateToCents(0)).toBe(0);
  });

  it("should converts a decimal dollar value to cents", () => {
    expect(rateToCents(12.3)).toBe(1230);
  });
});

describe("formatRateFromCents", () => {
  it("should returns the N/A translation key for null", () => {
    expect(formatRateFromCents(null)).toBe("price_tiers.not_available");
  });

  it("should format 0 cents as $0.00", () => {
    expect(formatRateFromCents(0)).toBe("$0.00");
  });

  it("should format cents with decimals correctly", () => {
    expect(formatRateFromCents(1234)).toBe("$12.34");
  });
});
