import { describe, it, expect } from "@jest/globals";
import {
  PAGE_MODULES_DOWNLOAD,
  PAGES_MODULE_KINDS
} from "../../utils/constants";
import { normalizeEntity } from "../page-template-actions";

const buildModule = (kind, type, file) => ({
  kind,
  type,
  file
});

describe("Page Template Actions", () => {
  describe("normalizeEntity", () => {
    it("should include new file in payload", () => {
      const entity = {
        modules: [
          buildModule(
            PAGES_MODULE_KINDS.DOCUMENT,
            PAGE_MODULES_DOWNLOAD.FILE,
            [{ name: "newfile.pdf" }] // new file, no id
          )
        ]
      };
      const result = normalizeEntity(entity);
      expect(result.modules[0].file).toBeDefined();
      expect(result.modules[0].file.name).toBe("newfile.pdf");
    });

    it("should omit existing file from payload", () => {
      const entity = {
        modules: [
          buildModule(PAGES_MODULE_KINDS.DOCUMENT, PAGE_MODULES_DOWNLOAD.FILE, [
            { id: 123, name: "existing.pdf" }
          ])
        ]
      };
      const result = normalizeEntity(entity);
      expect(result.modules[0].file).toBeUndefined();
    });

    it("should omit file if not FILE type", () => {
      const entity = {
        modules: [
          buildModule(PAGES_MODULE_KINDS.DOCUMENT, "NOT_FILE", [
            { name: "other.pdf" }
          ])
        ]
      };
      const result = normalizeEntity(entity);
      expect(result.modules[0].file).toBeUndefined();
    });

    it("should handle file as null", () => {
      const entity = {
        modules: [
          buildModule(
            PAGES_MODULE_KINDS.DOCUMENT,
            PAGE_MODULES_DOWNLOAD.FILE,
            null
          )
        ]
      };
      const result = normalizeEntity(entity);
      expect(result.modules[0].file).toBeUndefined();
    });
  });
});
