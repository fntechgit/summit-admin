import { nullableDecimalValidation } from "../yup";

jest.mock("i18n-react", () => ({
  translate: (key) => key
}));

describe("nullableDecimalValidation", () => {
  const schema = nullableDecimalValidation();

  it("should pass for null", async () => {
    await expect(schema.isValid(null)).resolves.toBe(true);
  });

  it("should pass for 0", async () => {
    await expect(schema.isValid(0)).resolves.toBe(true);
  });

  it("should pass for a positive integer", async () => {
    await expect(schema.isValid(10)).resolves.toBe(true);
  });

  it("should pass for numbers up to 2 decimal places", async () => {
    await expect(schema.isValid(10.5)).resolves.toBe(true);
    await expect(schema.isValid(10.55)).resolves.toBe(true);
  });

  it("should treat empty string as 0 (cleared input field)", async () => {
    await expect(schema.cast("")).toBe(0);
  });

  it("should fail for a negative value", async () => {
    await expect(schema.isValid(-1)).resolves.toBe(false);
  });

  it("should fail for 3 or more decimal places", async () => {
    await expect(schema.isValid(1.234)).resolves.toBe(false);
  });
});
