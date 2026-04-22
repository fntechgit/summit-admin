import { normalizePageTemplateModules } from "../page-template";
import {
  PAGE_MODULES_DOWNLOAD,
  PAGE_MODULES_MEDIA_TYPES,
  PAGES_MODULE_KINDS
} from "../constants";

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMomentTimeZone: jest.fn((value, tz) => `moment-${value}-${tz}`)
}));

jest.mock("moment-timezone", () => {
  const mockUnix = jest.fn(() => 1700000000);
  const mockMoment = {
    unix: mockUnix
  };
  const moment = jest.fn(() => mockMoment);
  moment.tz = jest.fn(() => mockMoment);
  moment.utc = jest.fn(() => mockMoment);
  return moment;
});

describe("normalizePageTemplateModules", () => {
  it("should return an empty array when called with no arguments or an empty array", () => {
    expect(normalizePageTemplateModules()).toStrictEqual([]);
    expect(normalizePageTemplateModules([])).toStrictEqual([]);
  });

  it("should remove _tempId from any module", () => {
    const module = {
      kind: PAGES_MODULE_KINDS.INFO,
      title: "Info",
      _tempId: "abc"
    };
    const [result] = normalizePageTemplateModules([module]);
    expect(result._tempId).toBeUndefined();
  });

  describe("MEDIA kind — FILE type", () => {
    it("should convert upload_deadline to unix using moment.utc when no timeZone provided", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.FILE,
        upload_deadline: "2024-01-15T00:00:00Z",
        file_type_id: 3,
        max_file_size: 1024
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.upload_deadline).toBe(1700000000);
    });

    it("should convert upload_deadline to unix using moment.tz when timeZone is provided", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.FILE,
        upload_deadline: "2024-01-15T00:00:00Z",
        file_type_id: 3,
        max_file_size: 1024
      };
      const [result] = normalizePageTemplateModules(
        [module],
        "America/New_York"
      );
      expect(result.upload_deadline).toBe(1700000000);
    });

    it("should resolve file_type_id from a select option object", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.FILE,
        file_type_id: { value: 7, label: "PDF" }
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.file_type_id).toBe(7);
    });

    it("should keep file_type_id as-is when it is already a primitive", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.FILE,
        file_type_id: 5
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.file_type_id).toBe(5);
    });

    it("should preserve max_file_size for FILE type", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.FILE,
        max_file_size: 2048
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.max_file_size).toBe(2048);
    });
  });

  describe("MEDIA kind — INPUT type", () => {
    it("should delete file_type_id and max_file_size but still normalize upload_deadline", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.INPUT,
        upload_deadline: "2024-01-15T00:00:00Z",
        file_type_id: 3,
        max_file_size: 1024
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.file_type_id).toBeUndefined();
      expect(result.max_file_size).toBeUndefined();
      expect(result.upload_deadline).toBe(1700000000);
    });

    it("should not include upload_deadline when not set", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.INPUT
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.upload_deadline).toBeUndefined();
    });
  });

  describe("DOCUMENT kind — FILE type", () => {
    it("should extract the first element from the file array and delete external_url", () => {
      const fileObj = {
        id: 10,
        storage_key: "key/file.pdf",
        file_url: "https://cdn/file.pdf"
      };
      const module = {
        kind: PAGES_MODULE_KINDS.DOCUMENT,
        type: PAGE_MODULES_DOWNLOAD.FILE,
        file: [fileObj],
        external_url: "https://example.com"
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.file).toStrictEqual(fileObj);
      expect(result.external_url).toBeUndefined();
    });

    it("should set file to null when the file array is empty", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.DOCUMENT,
        type: PAGE_MODULES_DOWNLOAD.FILE,
        file: []
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.file).toBeNull();
    });
  });

  describe("DOCUMENT kind — URL type", () => {
    it("should delete file and file_id but preserve external_url", () => {
      const module = {
        kind: PAGES_MODULE_KINDS.DOCUMENT,
        type: PAGE_MODULES_DOWNLOAD.URL,
        file: [{ id: 1 }],
        file_id: 1,
        external_url: "https://example.com"
      };
      const [result] = normalizePageTemplateModules([module]);
      expect(result.file).toBeUndefined();
      expect(result.file_id).toBeUndefined();
      expect(result.external_url).toBe("https://example.com");
    });
  });
});
