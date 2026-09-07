import { formatAnswerForSubmit } from "../extra-questions";

describe("formatAnswerForSubmit", () => {
  describe("CheckBox questions", () => {
    it("should format an unchecked (false) answer as the string 'false' instead of dropping it", () => {
      expect(formatAnswerForSubmit(false, "CheckBox")).toBe("false");
    });

    it("should format a checked (true) answer as the string 'true'", () => {
      expect(formatAnswerForSubmit(true, "CheckBox")).toBe("true");
    });
  });

  describe("CheckBoxList questions", () => {
    it("should join selected values, filtering out empty entries", () => {
      expect(formatAnswerForSubmit(["1", "", "3"], "CheckBoxList")).toBe("1,3");
    });

    it("should return an empty string for no selection", () => {
      expect(formatAnswerForSubmit([], "CheckBoxList")).toBe("");
    });
  });

  describe("other question types", () => {
    it("should stringify a numeric 0 answer instead of treating it as empty", () => {
      expect(formatAnswerForSubmit(0, "ComboBox")).toBe("0");
    });

    it("should return an empty string for a null or undefined answer", () => {
      expect(formatAnswerForSubmit(null, "RadioButtonList")).toBe("");
      expect(formatAnswerForSubmit(undefined, "Text")).toBe("");
    });
  });
});
