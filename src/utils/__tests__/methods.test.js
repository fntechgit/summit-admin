import {
  getMediaInputValue,
  isImageUrl,
  normalizeSelectAllField,
  getSafePageAfterRemove
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
});

describe("getSafePageAfterRemove", () => {
  it("should stay on page 1 when there is only one page", () => {
    expect(getSafePageAfterRemove(10, 10, 1)).toBe(1);
  });

  it("should go back to page 1 when removing the last item on page 2", () => {
    expect(getSafePageAfterRemove(11, 10, 2)).toBe(1);
  });

  it("should stay on page 2 when it still has items after removal", () => {
    expect(getSafePageAfterRemove(12, 10, 2)).toBe(2);
  });

  it("should go back one page when the removal empties the last page", () => {
    expect(getSafePageAfterRemove(21, 10, 3)).toBe(2);
  });

  it("should stay on a non-last page even if the global page count would decrease", () => {
    expect(getSafePageAfterRemove(21, 10, 2)).toBe(2);
  });

  it("should never return a page lower than 1", () => {
    expect(getSafePageAfterRemove(1, 10, 1)).toBe(1);
  });

  it("should stay on current page when removal does not reduce page count", () => {
    expect(getSafePageAfterRemove(20, 10, 2)).toBe(2);
  });
});
