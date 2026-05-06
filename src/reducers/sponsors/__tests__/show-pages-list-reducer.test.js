import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import showPagesListReducer, {
  DEFAULT_STATE
} from "../show-pages-list-reducer";
import {
  SET_CURRENT_SUMMIT,
  RECEIVE_GLOBAL_SPONSORSHIPS
} from "../../../actions/summit-actions";
import {
  REQUEST_SHOW_PAGES,
  RECEIVE_SHOW_PAGES,
  RECEIVE_SHOW_PAGE,
  SHOW_PAGE_ARCHIVED,
  SHOW_PAGE_UNARCHIVED,
  SHOW_PAGE_DELETED,
  RESET_SHOW_PAGE_FORM
} from "../../../actions/show-pages-actions";
import {
  PAGE_MODULES_DOWNLOAD,
  PAGES_MODULE_KINDS
} from "../../../utils/constants";

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMomentTimeZone: jest.fn((value, tz) => `moment-${value}-${tz}`)
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

function createInitialState(overrides = {}) {
  return { ...DEFAULT_STATE, ...overrides };
}

describe("showPagesListReducer", () => {
  let initialState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("resets to default state", () => {
      const dirtyState = createInitialState({ term: "foo", currentPage: 5 });
      const result = showPagesListReducer(dirtyState, {
        type: SET_CURRENT_SUMMIT
      });
      expect(result).toStrictEqual(DEFAULT_STATE);
    });
  });

  describe("LOGOUT_USER", () => {
    it("resets to default state", () => {
      const dirtyState = createInitialState({ term: "bar", perPage: 50 });
      const result = showPagesListReducer(dirtyState, { type: LOGOUT_USER });
      expect(result).toStrictEqual(DEFAULT_STATE);
    });
  });

  describe("REQUEST_SHOW_PAGES", () => {
    it("stores pagination and filter params and clears showPages", () => {
      const stateWithPages = createInitialState({
        showPages: [{ id: 1 }],
        currentPage: 3,
        perPage: 20
      });

      const result = showPagesListReducer(stateWithPages, {
        type: REQUEST_SHOW_PAGES,
        payload: {
          term: "acme",
          order: "name",
          orderDir: -1,
          page: 2,
          perPage: 25,
          showArchived: false,
          summitTZ: "America/New_York"
        }
      });

      expect(result.showPages).toStrictEqual([]);
      expect(result.term).toBe("acme");
      expect(result.order).toBe("name");
      expect(result.orderDir).toBe(-1);
      expect(result.currentPage).toBe(2);
      expect(result.perPage).toBe(25);
      expect(result.showArchived).toBe(false);
      expect(result.summitTZ).toBe("America/New_York");
    });
  });

  describe("RECEIVE_SHOW_PAGES", () => {
    const makePayload = (data = []) => ({
      response: {
        current_page: 2,
        total: 42,
        last_page: 5,
        data
      }
    });

    it("updates pagination metadata", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGES,
        payload: makePayload()
      });

      expect(result.currentPage).toBe(2);
      expect(result.totalCount).toBe(42);
      expect(result.lastPage).toBe(5);
    });

    it("maps page data to list items", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGES,
        payload: makePayload([
          {
            id: 10,
            code: "CODE-A",
            name: "Page A",
            apply_to_all_types: false,
            sponsorship_types: [{ name: "Gold" }, { name: "Silver" }],
            modules_count: {
              info_modules_count: 1,
              media_request_modules_count: 2,
              document_download_modules_count: 3
            },
            is_archived: false
          }
        ])
      });

      expect(result.showPages).toStrictEqual([
        {
          id: 10,
          code: "CODE-A",
          name: "Page A",
          tier: "Gold, Silver",
          info_mod: 1,
          upload_mod: 2,
          download_mod: 3,
          is_archived: false
        }
      ]);
    });

    it("sets tier to all_tiers translation when apply_to_all_types is true", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGES,
        payload: makePayload([
          {
            id: 11,
            code: "CODE-B",
            name: "Page B",
            apply_to_all_types: true,
            sponsorship_types: [],
            modules_count: {
              info_modules_count: 0,
              media_request_modules_count: 0,
              document_download_modules_count: 0
            },
            is_archived: true
          }
        ])
      });

      expect(result.showPages[0].tier).toBe("show_pages.all_tiers");
      expect(result.showPages[0].is_archived).toBe(true);
    });
  });

  describe("SHOW_PAGE_ARCHIVED", () => {
    it("sets is_archived=true on the target page", () => {
      const state = createInitialState({
        showPages: [
          { id: 1, is_archived: false },
          { id: 2, is_archived: false }
        ]
      });

      const result = showPagesListReducer(state, {
        type: SHOW_PAGE_ARCHIVED,
        payload: { pageId: 1 }
      });

      expect(result.showPages.find((p) => p.id === 1).is_archived).toBe(true);
      expect(result.showPages.find((p) => p.id === 2).is_archived).toBe(false);
    });
  });

  describe("SHOW_PAGE_UNARCHIVED", () => {
    it("sets is_archived=false on the target page", () => {
      const state = createInitialState({
        showPages: [
          { id: 1, is_archived: true },
          { id: 2, is_archived: true }
        ]
      });

      const result = showPagesListReducer(state, {
        type: SHOW_PAGE_UNARCHIVED,
        payload: { pageId: 2 }
      });

      expect(result.showPages.find((p) => p.id === 1).is_archived).toBe(true);
      expect(result.showPages.find((p) => p.id === 2).is_archived).toBe(false);
    });
  });

  describe("SHOW_PAGE_DELETED", () => {
    it("removes the page and decrements totalCount", () => {
      const state = createInitialState({
        showPages: [{ id: 1 }, { id: 2 }, { id: 3 }],
        totalCount: 3
      });

      const result = showPagesListReducer(state, {
        type: SHOW_PAGE_DELETED,
        payload: { pageId: 2 }
      });

      expect(result.showPages.map((p) => p.id)).toStrictEqual([1, 3]);
      expect(result.totalCount).toBe(2);
    });
  });

  describe("RESET_SHOW_PAGE_FORM", () => {
    it("resets currentShowPage to the empty default", () => {
      const state = createInitialState({
        currentShowPage: { id: 99, code: "X", name: "Dirty" }
      });

      const result = showPagesListReducer(state, {
        type: RESET_SHOW_PAGE_FORM
      });

      expect(result.currentShowPage).toStrictEqual({
        code: "",
        name: "",
        sponsorship_types: [],
        modules: []
      });
    });
  });

  describe("RECEIVE_SHOW_PAGE", () => {
    const basePageData = {
      id: 5,
      code: "CODE-5",
      name: "Page Five",
      apply_to_all_types: false,
      sponsorship_types: [{ id: 1 }, { id: 2 }],
      modules: []
    };

    it("sets sponsorship_types from the response when not apply_to_all_types", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGE,
        payload: { response: basePageData }
      });

      expect(result.currentShowPage.sponsorship_types).toStrictEqual([1, 2]);
    });

    it("sets sponsorship_types to [\"all\"] when apply_to_all_types is true", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGE,
        payload: {
          response: { ...basePageData, apply_to_all_types: true }
        }
      });

      expect(result.currentShowPage.sponsorship_types).toStrictEqual(["all"]);
    });

    it("converts upload_deadline via epochToMomentTimeZone using summitTZ", () => {
      const state = createInitialState({ summitTZ: "America/Argentina" });

      const result = showPagesListReducer(state, {
        type: RECEIVE_SHOW_PAGE,
        payload: {
          response: {
            ...basePageData,
            modules: [
              {
                id: 1,
                kind: PAGES_MODULE_KINDS.INFO,
                upload_deadline: 1700000000
              }
            ]
          }
        }
      });

      expect(result.currentShowPage.modules[0].upload_deadline).toBe(
        "moment-1700000000-America/Argentina"
      );
    });

    it("falls back to UTC for upload_deadline when summitTZ is null", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGE,
        payload: {
          response: {
            ...basePageData,
            modules: [
              {
                id: 1,
                kind: PAGES_MODULE_KINDS.INFO,
                upload_deadline: 1700000000
              }
            ]
          }
        }
      });

      expect(result.currentShowPage.modules[0].upload_deadline).toBe(
        "moment-1700000000-UTC"
      );
    });

    it("does not set upload_deadline when module has none", () => {
      const result = showPagesListReducer(initialState, {
        type: RECEIVE_SHOW_PAGE,
        payload: {
          response: {
            ...basePageData,
            modules: [{ id: 1, kind: PAGES_MODULE_KINDS.INFO }]
          }
        }
      });

      expect(result.currentShowPage.modules[0].upload_deadline).toBeUndefined();
    });

    describe("DOCUMENT module handling", () => {
      it("wraps file into array and adds file_path/public_url when file is present", () => {
        const file = {
          id: 99,
          storage_key: "s3://bucket/file.pdf",
          file_url: "https://cdn.example.com/file.pdf",
          name: "file.pdf"
        };

        const result = showPagesListReducer(initialState, {
          type: RECEIVE_SHOW_PAGE,
          payload: {
            response: {
              ...basePageData,
              modules: [
                {
                  id: 10,
                  kind: PAGES_MODULE_KINDS.DOCUMENT,
                  file
                }
              ]
            }
          }
        });

        const mod = result.currentShowPage.modules[0];
        expect(mod.type).toBe(PAGE_MODULES_DOWNLOAD.FILE);
        expect(mod.file).toStrictEqual([
          {
            ...file,
            file_path: file.storage_key,
            public_url: file.file_url
          }
        ]);
      });

      it("sets type to URL when DOCUMENT module has no file", () => {
        const result = showPagesListReducer(initialState, {
          type: RECEIVE_SHOW_PAGE,
          payload: {
            response: {
              ...basePageData,
              modules: [
                {
                  id: 11,
                  kind: PAGES_MODULE_KINDS.DOCUMENT,
                  external_url: "https://example.com/doc"
                }
              ]
            }
          }
        });

        const mod = result.currentShowPage.modules[0];
        expect(mod.type).toBe(PAGE_MODULES_DOWNLOAD.URL);
        expect(mod.file).toBeUndefined();
      });

      it("does not set type on non-DOCUMENT modules", () => {
        const result = showPagesListReducer(initialState, {
          type: RECEIVE_SHOW_PAGE,
          payload: {
            response: {
              ...basePageData,
              modules: [
                { id: 12, kind: PAGES_MODULE_KINDS.INFO },
                { id: 13, kind: PAGES_MODULE_KINDS.MEDIA }
              ]
            }
          }
        });

        expect(result.currentShowPage.modules[0].type).toBeUndefined();
        expect(result.currentShowPage.modules[1].type).toBeUndefined();
      });
    });
  });

  describe("RECEIVE_GLOBAL_SPONSORSHIPS", () => {
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

      const result = showPagesListReducer(state, {
        type: RECEIVE_GLOBAL_SPONSORSHIPS,
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

      const result = showPagesListReducer(state, {
        type: RECEIVE_GLOBAL_SPONSORSHIPS,
        payload: makePayload(2, [{ id: 2, type: { name: "Silver" } }])
      });

      expect(result.sponsorships.items).toStrictEqual([
        { id: 1, name: "Gold" },
        { id: 2, name: "Silver" }
      ]);
    });
  });
});
