import { RECEIVE_SUMMIT_SPONSORSHIP_TYPES } from "../../../actions/summit-actions";
import {
  RECEIVE_SPONSOR_MANAGED_PAGE,
  RECEIVE_SPONSOR_CUSTOMIZED_PAGE
} from "../../../actions/sponsor-pages-actions";
import {
  PAGE_MODULES_DOWNLOAD,
  PAGES_MODULE_KINDS
} from "../../../utils/constants";
import sponsorPagePagesListReducer, {
  DEFAULT_STATE
} from "../sponsor-page-pages-list-reducer";

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMomentTimeZone: jest.fn((value, tz) => `moment-${value}-${tz}`)
}));

jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));

function createInitialState(overrides = {}) {
  return { ...DEFAULT_STATE, ...overrides };
}

describe("sponsorPagePagesListReducer", () => {
  const dispatchReceiveManagedPage = (state, modules) =>
    sponsorPagePagesListReducer(state, {
      type: RECEIVE_SPONSOR_MANAGED_PAGE,
      payload: { response: { id: 5, code: "P1", modules } }
    });

  const dispatchReceiveCustomizedPage = (state, modules) =>
    sponsorPagePagesListReducer(state, {
      type: RECEIVE_SPONSOR_CUSTOMIZED_PAGE,
      payload: { response: { id: 5, code: "P1", modules } }
    });

  describe("RECEIVE_SPONSOR_MANAGED_PAGE", () => {
    it("wraps a DOCUMENT module file in an array and sets type to FILE", () => {
      const file = {
        id: 10,
        storage_key: "uploads/doc.pdf",
        file_url: "https://cdn/doc.pdf"
      };
      const state = createInitialState({ summitTZ: "America/Los_Angeles" });

      const result = dispatchReceiveManagedPage(state, [
        { id: 1, kind: PAGES_MODULE_KINDS.DOCUMENT, file }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.file).toEqual([
        { ...file, file_path: file.storage_key, public_url: file.file_url }
      ]);
      expect(mod.type).toBe(PAGE_MODULES_DOWNLOAD.FILE);
    });

    it("sets type to URL for a DOCUMENT module without a file", () => {
      const state = createInitialState({ summitTZ: "UTC" });

      const result = dispatchReceiveManagedPage(state, [
        { id: 2, kind: PAGES_MODULE_KINDS.DOCUMENT, file: null }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.type).toBe(PAGE_MODULES_DOWNLOAD.URL);
    });

    it("converts upload_deadline for a MEDIA module using summitTZ", () => {
      const state = createInitialState({ summitTZ: "America/Los_Angeles" });

      const result = dispatchReceiveManagedPage(state, [
        { id: 3, kind: PAGES_MODULE_KINDS.MEDIA, upload_deadline: 1700000000 }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.upload_deadline).toBe("moment-1700000000-America/Los_Angeles");
    });

    it("falls back to UTC when summitTZ is not set", () => {
      const state = createInitialState({ summitTZ: "" });

      const result = dispatchReceiveManagedPage(state, [
        { id: 4, kind: PAGES_MODULE_KINDS.MEDIA, upload_deadline: 1700000000 }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.upload_deadline).toBe("moment-1700000000-UTC");
    });
  });

  describe("RECEIVE_SPONSOR_CUSTOMIZED_PAGE", () => {
    it("wraps a DOCUMENT module file in an array and sets type to FILE", () => {
      const file = {
        id: 20,
        storage_key: "uploads/spec.pdf",
        file_url: "https://cdn/spec.pdf"
      };
      const state = createInitialState({ summitTZ: "UTC" });

      const result = dispatchReceiveCustomizedPage(state, [
        { id: 1, kind: PAGES_MODULE_KINDS.DOCUMENT, file }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.file).toEqual([
        { ...file, file_path: file.storage_key, public_url: file.file_url }
      ]);
      expect(mod.type).toBe(PAGE_MODULES_DOWNLOAD.FILE);
    });

    it("sets type to URL for a DOCUMENT module without a file", () => {
      const state = createInitialState({ summitTZ: "UTC" });

      const result = dispatchReceiveCustomizedPage(state, [
        { id: 2, kind: PAGES_MODULE_KINDS.DOCUMENT, file: null }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.type).toBe(PAGE_MODULES_DOWNLOAD.URL);
    });

    it("converts upload_deadline for a MEDIA module using summitTZ", () => {
      const state = createInitialState({ summitTZ: "America/Los_Angeles" });

      const result = dispatchReceiveCustomizedPage(state, [
        { id: 3, kind: PAGES_MODULE_KINDS.MEDIA, upload_deadline: 1700000000 }
      ]);

      const [mod] = result.currentEditPage.modules;
      expect(mod.upload_deadline).toBe("moment-1700000000-America/Los_Angeles");
    });
  });

  describe("RECEIVE_SUMMIT_SPONSORSHIP_TYPES", () => {
    const makePayload = (currentPage, data) => ({
      response: {
        current_page: currentPage,
        last_page: 3,
        total: 10,
        data
      }
    });

    it("replaces items on first page", () => {
      const state = createInitialState({
        sponsorships: {
          items: [{ id: 1, name: "Old" }],
          currentPage: 1,
          lastPage: 1,
          total: 1
        }
      });

      const result = sponsorPagePagesListReducer(state, {
        type: RECEIVE_SUMMIT_SPONSORSHIP_TYPES,
        payload: makePayload(1, [{ id: 2, type: { name: "Gold" } }])
      });

      expect(result.sponsorships.items).toStrictEqual([
        { id: 2, name: "Gold" }
      ]);
      expect(result.sponsorships.currentPage).toBe(1);
      expect(result.sponsorships.lastPage).toBe(3);
      expect(result.sponsorships.total).toBe(10);
    });

    it("appends items on subsequent pages", () => {
      const state = createInitialState({
        sponsorships: {
          items: [{ id: 1, name: "Gold" }],
          currentPage: 1,
          lastPage: 3,
          total: 10
        }
      });

      const result = sponsorPagePagesListReducer(state, {
        type: RECEIVE_SUMMIT_SPONSORSHIP_TYPES,
        payload: makePayload(2, [{ id: 2, type: { name: "Silver" } }])
      });

      expect(result.sponsorships.items).toStrictEqual([
        { id: 1, name: "Gold" },
        { id: 2, name: "Silver" }
      ]);
    });
  });
});
