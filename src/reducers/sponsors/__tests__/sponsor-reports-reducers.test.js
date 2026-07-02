import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";
import {
  REQUEST_PURCHASE_DETAILS,
  RECEIVE_PURCHASE_DETAILS,
  PURCHASE_DETAILS_READ_ERROR,
  PURCHASE_DETAILS_VALIDATION_ERROR,
  REQUEST_SPONSOR_ASSET,
  RECEIVE_SPONSOR_ASSET_FILTERS,
  RECEIVE_SPONSOR_ASSET_ROWS,
  SPONSOR_ASSET_READ_ERROR,
  REQUEST_SPONSOR_DRILLDOWN,
  RECEIVE_SPONSOR_DRILLDOWN,
  SPONSOR_DRILLDOWN_READ_ERROR
} from "../../../actions/sponsor-reports-actions";

import purchaseDetailsReducer, {
  DEFAULT_STATE as PD_DEFAULT_STATE
} from "../sponsor-reports-purchase-details-reducer";

import sponsorAssetReducer, {
  DEFAULT_STATE as SA_DEFAULT_STATE
} from "../sponsor-reports-sponsor-asset-reducer";

import drilldownReducer, {
  DEFAULT_STATE as DD_DEFAULT_STATE
} from "../sponsor-reports-drilldown-reducer";

// ═══════════════════════════════════════════════════════════════════════════════
// purchase-details reducer
// ═══════════════════════════════════════════════════════════════════════════════

describe("sponsorReportsPurchaseDetailsReducer", () => {
  describe("REQUEST_PURCHASE_DETAILS", () => {
    it("records pagination/sort/filter from the payload and clears readError", () => {
      const state = {
        ...PD_DEFAULT_STATE,
        readError: { kind: "unknown" }
      };
      const filters = { status: "Paid" };
      const result = purchaseDetailsReducer(state, {
        type: REQUEST_PURCHASE_DETAILS,
        payload: {
          currentPage: 3,
          perPage: 25,
          order: "number",
          orderDir: -1,
          filters
        }
      });
      expect(result.currentPage).toBe(3);
      expect(result.perPage).toBe(25);
      expect(result.order).toBe("number");
      expect(result.orderDir).toBe(-1);
      expect(result.filters).toStrictEqual(filters);
      expect(result.readError).toBeNull();
    });
  });

  describe("RECEIVE_PURCHASE_DETAILS", () => {
    const payload = {
      response: {
        data: [{ id: 1 }],
        total: 50,
        current_page: 2,
        last_page: 5,
        per_page: 10,
        summary: { total_paid: 10000 }
      }
    };

    it("maps data, total, pagination, summary", () => {
      const state = { ...PD_DEFAULT_STATE };
      const result = purchaseDetailsReducer(state, {
        type: RECEIVE_PURCHASE_DETAILS,
        payload
      });
      expect(result.data).toStrictEqual([{ id: 1 }]);
      expect(result.total).toBe(50);
      expect(result.currentPage).toBe(2);
      expect(result.lastPage).toBe(5);
      expect(result.perPage).toBe(10);
      expect(result.summary).toStrictEqual({ total_paid: 10000 });
      expect(result.readError).toBeNull();
      expect(result.validationError).toBeNull();
    });
  });

  describe("PURCHASE_DETAILS_READ_ERROR", () => {
    it("sets readError=payload", () => {
      const state = { ...PD_DEFAULT_STATE };
      const errorPayload = { kind: "unauthorized", status: 403, message: "" };
      const result = purchaseDetailsReducer(state, {
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: errorPayload
      });
      expect(result.readError).toStrictEqual(errorPayload);
    });
  });

  describe("PURCHASE_DETAILS_VALIDATION_ERROR", () => {
    it("sets validationError=payload without replacing body", () => {
      const existingData = [{ id: 1 }, { id: 2 }];
      const state = { ...PD_DEFAULT_STATE, data: existingData };
      const errPayload = { status: 412, message: "invalid filter" };
      const result = purchaseDetailsReducer(state, {
        type: PURCHASE_DETAILS_VALIDATION_ERROR,
        payload: errPayload
      });
      expect(result.validationError).toStrictEqual(errPayload);
      // body must NOT be replaced
      expect(result.data).toStrictEqual(existingData);
    });
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = { ...PD_DEFAULT_STATE, data: [{ id: 99 }], loading: true };
      const result = purchaseDetailsReducer(dirty, {
        type: SET_CURRENT_SUMMIT
      });
      expect(result).toStrictEqual(PD_DEFAULT_STATE);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// sponsor-asset reducer
// ═══════════════════════════════════════════════════════════════════════════════

describe("sponsorReportsSponsorAssetReducer", () => {
  describe("REQUEST_SPONSOR_ASSET", () => {
    it("records filters from the payload and clears readError", () => {
      const state = {
        ...SA_DEFAULT_STATE,
        readError: { kind: "unknown" }
      };
      const filters = { sponsorIds: [17] };
      const result = sponsorAssetReducer(state, {
        type: REQUEST_SPONSOR_ASSET,
        payload: { filters }
      });
      expect(result.filters).toStrictEqual(filters);
      expect(result.readError).toBeNull();
    });
  });

  describe("SPONSOR_ASSET_READ_ERROR", () => {
    it("sets readError=payload", () => {
      const state = { ...SA_DEFAULT_STATE };
      const err = { kind: "not-found", status: 404, message: "" };
      const result = sponsorAssetReducer(state, {
        type: SPONSOR_ASSET_READ_ERROR,
        payload: err
      });
      expect(result.readError).toStrictEqual(err);
    });
  });

  describe("RECEIVE_SPONSOR_ASSET_FILTERS", () => {
    it("sets filterOptions to payload.response and clears readError", () => {
      const state = { ...SA_DEFAULT_STATE, readError: { kind: "unknown" } };
      const filters = { sponsors: [{ id: 1, name: "ACME" }] };
      const result = sponsorAssetReducer(state, {
        type: RECEIVE_SPONSOR_ASSET_FILTERS,
        payload: { response: filters }
      });
      expect(result.filterOptions).toStrictEqual(filters);
      expect(result.readError).toBeNull();
    });
  });

  describe("RECEIVE_SPONSOR_ASSET_ROWS", () => {
    it("stores the full rows + summary", () => {
      const env = {
        data: [{ sponsor: { id: 1 } }, { sponsor: { id: 2 } }],
        summary: { total: 2, by_status: { completed: 2 } }
      };
      const s = sponsorAssetReducer(
        { ...SA_DEFAULT_STATE },
        { type: RECEIVE_SPONSOR_ASSET_ROWS, payload: { response: env } }
      );
      expect(s.rows.map((r) => r.sponsor.id)).toEqual([1, 2]);
      expect(s.summary.total).toBe(2);
    });
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = { ...SA_DEFAULT_STATE, data: [{ id: 5 }], loading: true };
      const result = sponsorAssetReducer(dirty, { type: SET_CURRENT_SUMMIT });
      expect(result).toStrictEqual(SA_DEFAULT_STATE);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// drilldown reducer
// ═══════════════════════════════════════════════════════════════════════════════

describe("sponsorReportsDrilldownReducer", () => {
  describe("REQUEST_SPONSOR_DRILLDOWN", () => {
    it("clears readError and detail", () => {
      const state = {
        ...DD_DEFAULT_STATE,
        readError: { kind: "unknown" },
        detail: { sponsor: { id: 1 } }
      };
      const result = drilldownReducer(state, {
        type: REQUEST_SPONSOR_DRILLDOWN,
        payload: {}
      });
      expect(result.readError).toBeNull();
      expect(result.detail).toBeNull();
    });
  });

  describe("RECEIVE_SPONSOR_DRILLDOWN", () => {
    it("sets detail=payload.response and clears readError", () => {
      const state = { ...DD_DEFAULT_STATE };
      const responseData = { sponsor: { id: 7, name: "ACME" }, pages: [] };
      const result = drilldownReducer(state, {
        type: RECEIVE_SPONSOR_DRILLDOWN,
        payload: { response: responseData }
      });
      expect(result.detail).toStrictEqual(responseData);
      expect(result.readError).toBeNull();
    });
  });

  describe("SPONSOR_DRILLDOWN_READ_ERROR", () => {
    it("sets readError=payload", () => {
      const state = { ...DD_DEFAULT_STATE };
      const err = { kind: "not-found", status: 404, message: "" };
      const result = drilldownReducer(state, {
        type: SPONSOR_DRILLDOWN_READ_ERROR,
        payload: err
      });
      expect(result.readError).toStrictEqual(err);
    });
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = {
        ...DD_DEFAULT_STATE,
        detail: { sponsor: { id: 1 } },
        loading: true
      };
      const result = drilldownReducer(dirty, { type: SET_CURRENT_SUMMIT });
      expect(result).toStrictEqual(DD_DEFAULT_STATE);
    });
  });
});
