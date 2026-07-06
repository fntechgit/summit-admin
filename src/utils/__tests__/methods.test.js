import {
  getMediaInputValue,
  htmlToPlainText,
  isImageUrl,
  isPositiveIntId,
  normalizeSelectAllField
} from "../methods";

const FIXED_NOW = 1_772_551_911_231;
beforeAll(() => jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW));
afterAll(() => jest.restoreAllMocks());

describe("getMediaInputValue", () => {
  describe("fileUrl guard — all url fields undefined/null", () => {
    it("should does NOT throw TypeError when all url fields are undefined", () => {
      expect(() => getMediaInputValue({ images: [{ id: 1 }] })).not.toThrow();
    });

    it("should returns filename: '' when all url fields are null", () => {
      const [result] = getMediaInputValue({
        images: [{ filename: null, file_path: null, file_url: null }]
      });
      expect(result.filename).toBe("");
    });

    it("should preserves other props on the image object when filename is empty", () => {
      const [result] = getMediaInputValue({
        images: [{ id: 42, alt: "broken" }]
      });
      expect(result).toMatchObject({ id: 42, alt: "broken", filename: "" });
    });
  });

  describe("path stripping", () => {
    it("should strips the directory prefix and keeps only the basename", () => {
      const [result] = getMediaInputValue({
        images: [{ filename: "uploads/2024/photo.jpg" }]
      });
      expect(result.filename).toBe("photo.jpg");
    });

    it("should keeps the filename unchanged when there is no slash", () => {
      const [result] = getMediaInputValue({
        images: [{ filename: "photo.jpg" }]
      });
      expect(result.filename).toBe("photo.jpg");
    });
  });

  describe("files without extensions", () => {
    it("should returns 'README' as filename", () => {
      const [result] = getMediaInputValue({ images: [{ filename: "README" }] });
      expect(result.filename).toBe("README");
      expect(result.filename.startsWith(".")).toBe(false);
    });

    it("should strips the path for an extension-less file in a subdirectory", () => {
      const [result] = getMediaInputValue({
        images: [{ filename: "some/path/README" }]
      });
      expect(result.filename).toBe("README");
    });
  });

  describe("normalizeSelectAllField", () => {
    it("should return default object when items is empty array", () => {
      expect(normalizeSelectAllField([], "apply_to_all", "items")).toEqual({
        apply_to_all: false,
        items: []
      });
    });

    it("should return all selected when array contains 'all'", () => {
      expect(
        normalizeSelectAllField(
          ["all", { id: 1 }, { id: 2 }],
          "apply_to_all",
          "items"
        )
      ).toEqual({
        apply_to_all: true,
        items: []
      });
    });

    it("should return all selected when allSelected flag is true", () => {
      expect(
        normalizeSelectAllField([{ id: 1 }], "apply_to_all", "items", true)
      ).toEqual({
        apply_to_all: true,
        items: []
      });
    });

    it.each([[], null, undefined])(
      "should return apply_to_all true when allSelected is true and items is %s",
      (items) => {
        expect(
          normalizeSelectAllField(items, "apply_to_all", "items", true)
        ).toEqual({ apply_to_all: true, items: [] });
      }
    );

    it.each([[], null, undefined])(
      "should return apply_to_all false when allSelected is false and items is %s",
      (items) => {
        expect(
          normalizeSelectAllField(items, "apply_to_all", "items", false)
        ).toEqual({ apply_to_all: false, items: [] });
      }
    );

    it("should return array of ids when items are objects with id", () => {
      expect(
        normalizeSelectAllField([{ id: 1 }, { id: 2 }], "apply_to_all", "items")
      ).toEqual({
        apply_to_all: false,
        items: [1, 2]
      });
    });

    it("should return an array of values directly when items are primitives", () => {
      expect(normalizeSelectAllField([1, 2], "apply_to_all", "items")).toEqual({
        apply_to_all: false,
        items: [1, 2]
      });
    });
  });
});

describe("isImageUrl", () => {
  it.each(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"])(
    "returns true for .%s extension",
    (ext) => {
      expect(isImageUrl(`https://example.com/file.${ext}`)).toBe(true);
    }
  );

  it("is case-insensitive", () => {
    expect(isImageUrl("https://example.com/file.JPG")).toBe(true);
    expect(isImageUrl("https://example.com/file.PNG")).toBe(true);
  });

  it("works with query strings", () => {
    expect(isImageUrl("https://example.com/file.png?v=123")).toBe(true);
  });

  it.each(["pdf", "mp4", "doc", "csv", "pptx"])(
    "returns false for .%s extension",
    (ext) => {
      expect(isImageUrl(`https://example.com/file.${ext}`)).toBe(false);
    }
  );

  it("returns false for empty string", () => {
    expect(isImageUrl("")).toBe(false);
  });
});

describe("isPositiveIntId", () => {
  it("accepts positive integers (number or string)", () => {
    expect(isPositiveIntId(5)).toBe(true);
    expect(isPositiveIntId("17")).toBe(true);
  });
  it("rejects zero, negatives, non-integers, junk", () => {
    expect(isPositiveIntId(0)).toBe(false);
    expect(isPositiveIntId("0")).toBe(false);
    expect(isPositiveIntId(-3)).toBe(false);
    expect(isPositiveIntId("1.5")).toBe(false);
    expect(isPositiveIntId("abc")).toBe(false);
    expect(isPositiveIntId(null)).toBe(false);
    expect(isPositiveIntId(undefined)).toBe(false);
  });
});

describe("htmlToPlainText", () => {
  it("returns '' for null/undefined", () => {
    expect(htmlToPlainText(null)).toBe("");
    expect(htmlToPlainText(undefined)).toBe("");
  });
  it("strips tags with a space at boundaries (no word fusing)", () => {
    expect(htmlToPlainText("<p>a</p><b>b</b>")).toBe("a b");
    expect(htmlToPlainText("<p>Hello</p>  <b>world</b>")).toBe("Hello world");
  });
  it("decodes valid named + numeric entities", () => {
    expect(htmlToPlainText("a &amp; b")).toBe("a & b");
    expect(htmlToPlainText("5 &deg;")).toBe("5 °");
    expect(htmlToPlainText("&copy;")).toBe("©");
    expect(htmlToPlainText("&#169;")).toBe("©");
  });
  it("leaves malformed-case entities literal (DOMParser is case-sensitive)", () => {
    expect(htmlToPlainText("&Copy;")).toBe("&Copy;");
    expect(htmlToPlainText("x&NBSP;y")).toBe("x&NBSP;y");
  });
});
