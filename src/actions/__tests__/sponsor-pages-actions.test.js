import { normalizeSponsorManagedPageToCustomize } from "../sponsor-pages-actions";
import {
  PAGE_MODULES_DOWNLOAD,
  PAGES_MODULE_KINDS
} from "../../utils/constants";

jest.mock("moment-timezone", () => {
  const mockMoment = { unix: jest.fn(() => 1700000000) };
  const moment = jest.fn(() => mockMoment);
  moment.tz = jest.fn(() => mockMoment);
  moment.utc = jest.fn(() => mockMoment);
  return moment;
});

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  createAction: jest.fn(),
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  putRequest: jest.fn(),
  deleteRequest: jest.fn(),
  startLoading: jest.fn(),
  stopLoading: jest.fn(),
  escapeFilterValue: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));

jest.mock("../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(),
  normalizeSelectAllField: jest.fn(() => ({
    apply_to_all_add_ons: false,
    allowed_add_ons: []
  }))
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const buildEntity = (modules = []) => ({
  id: 10,
  code: "P1",
  allowed_add_ons: [],
  page_ptr_id: 99,
  sponsorship_types: [1],
  summit_id: 5,
  template_id: 3,
  modules_count: 2,
  modules
});

describe("normalizeSponsorManagedPageToCustomize", () => {
  describe("DOCUMENT module — FILE type", () => {
    it("includes the file when it is new (no id or file_id)", () => {
      const newFile = { name: "contract.pdf" };
      const entity = buildEntity([
        {
          kind: PAGES_MODULE_KINDS.DOCUMENT,
          type: PAGE_MODULES_DOWNLOAD.FILE,
          file: [newFile]
        }
      ]);

      const result = normalizeSponsorManagedPageToCustomize(entity);

      expect(result.modules[0].file).toEqual(newFile);
    });

    it("omits the file when it already exists (id present) — isNewFile guard", () => {
      const existingFile = { id: 42, name: "brief.pdf", file_id: 7 };
      const entity = buildEntity([
        {
          kind: PAGES_MODULE_KINDS.DOCUMENT,
          type: PAGE_MODULES_DOWNLOAD.FILE,
          file: [existingFile]
        }
      ]);

      const result = normalizeSponsorManagedPageToCustomize(entity);

      expect(result.modules[0].file).toBeUndefined();
    });
  });

  describe("DOCUMENT module — URL type", () => {
    it("omits file and file_id from the payload", () => {
      const entity = buildEntity([
        {
          kind: PAGES_MODULE_KINDS.DOCUMENT,
          type: PAGE_MODULES_DOWNLOAD.URL,
          file: [{ id: 5 }],
          file_id: 5,
          external_url: "https://example.com"
        }
      ]);

      const result = normalizeSponsorManagedPageToCustomize(entity);

      expect(result.modules[0].file).toBeUndefined();
      expect(result.modules[0].file_id).toBeUndefined();
      expect(result.modules[0].external_url).toBe("https://example.com");
    });
  });
});
