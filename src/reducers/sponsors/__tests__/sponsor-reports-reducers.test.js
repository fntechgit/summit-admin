import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";
import {
  REQUEST_PURCHASE_DETAILS,
  RECEIVE_PURCHASE_DETAILS,
  PURCHASE_DETAILS_READ_ERROR,
  PURCHASE_DETAILS_VALIDATION_ERROR,
  PURCHASE_DETAILS_VALIDATION_CLEAR,
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
  describe("initial state", () => {
    it("matches DEFAULT_STATE", () => {
      const result = purchaseDetailsReducer(undefined, { type: "@@INIT" });
      expect(result).toStrictEqual(PD_DEFAULT_STATE);
    });
  });

  describe("REQUEST_PURCHASE_DETAILS", () => {
    it("sets loading=true and readError=null", () => {
      const state = {
        ...PD_DEFAULT_STATE,
        loading: false,
        readError: { kind: "unknown" }
      };
      const result = purchaseDetailsReducer(state, {
        type: REQUEST_PURCHASE_DETAILS,
        payload: {}
      });
      expect(result.loading).toBe(true);
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

    it("maps data, total, pagination, summary; sets loading=false", () => {
      const state = { ...PD_DEFAULT_STATE, loading: true };
      const result = purchaseDetailsReducer(state, {
        type: RECEIVE_PURCHASE_DETAILS,
        payload
      });
      expect(result.loading).toBe(false);
      expect(result.data).toStrictEqual([{ id: 1 }]);
      expect(result.total).toBe(50);
      expect(result.currentPage).toBe(2);
      expect(result.lastPage).toBe(5);
      expect(result.perPage).toBe(10);
      expect(result.summary).toStrictEqual({ total_paid: 10000 });
      expect(result.readError).toBeNull();
      expect(result.validationError).toBeNull();
    });

    it("preserves existing summary when response summary is null", () => {
      const prevSummary = { total_paid: 20000 };
      const state = { ...PD_DEFAULT_STATE, summary: prevSummary };
      const result = purchaseDetailsReducer(state, {
        type: RECEIVE_PURCHASE_DETAILS,
        payload: { response: { ...payload.response, summary: null } }
      });
      expect(result.summary).toStrictEqual(prevSummary);
    });
  });

  describe("PURCHASE_DETAILS_READ_ERROR", () => {
    it("sets loading=false and readError=payload", () => {
      const state = { ...PD_DEFAULT_STATE, loading: true };
      const errorPayload = { kind: "unauthorized", status: 403, message: "" };
      const result = purchaseDetailsReducer(state, {
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: errorPayload
      });
      expect(result.loading).toBe(false);
      expect(result.readError).toStrictEqual(errorPayload);
    });
  });

  describe("PURCHASE_DETAILS_VALIDATION_ERROR", () => {
    it("sets loading=false and validationError=payload without replacing body", () => {
      const existingData = [{ id: 1 }, { id: 2 }];
      const state = { ...PD_DEFAULT_STATE, loading: true, data: existingData };
      const errPayload = { status: 412, message: "invalid filter" };
      const result = purchaseDetailsReducer(state, {
        type: PURCHASE_DETAILS_VALIDATION_ERROR,
        payload: errPayload
      });
      expect(result.loading).toBe(false);
      expect(result.validationError).toStrictEqual(errPayload);
      // body must NOT be replaced
      expect(result.data).toStrictEqual(existingData);
    });
  });

  describe("PURCHASE_DETAILS_VALIDATION_CLEAR", () => {
    it("clears validationError without replacing the body", () => {
      const existingData = [{ id: 1 }, { id: 2 }];
      const state = {
        ...PD_DEFAULT_STATE,
        data: existingData,
        validationError: { status: 412, message: "invalid filter" }
      };
      const result = purchaseDetailsReducer(state, {
        type: PURCHASE_DETAILS_VALIDATION_CLEAR
      });
      expect(result.validationError).toBeNull();
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

  describe("LOGOUT_USER", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = {
        ...PD_DEFAULT_STATE,
        data: [{ id: 1 }],
        readError: { kind: "unknown" }
      };
      const result = purchaseDetailsReducer(dirty, { type: LOGOUT_USER });
      expect(result).toStrictEqual(PD_DEFAULT_STATE);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// sponsor-asset reducer
// ═══════════════════════════════════════════════════════════════════════════════

describe("sponsorReportsSponsorAssetReducer", () => {
  describe("initial state", () => {
    it("matches DEFAULT_STATE", () => {
      const result = sponsorAssetReducer(undefined, { type: "@@INIT" });
      expect(result).toStrictEqual(SA_DEFAULT_STATE);
    });
  });

  describe("REQUEST_SPONSOR_ASSET", () => {
    it("sets loading=true and readError=null", () => {
      const state = {
        ...SA_DEFAULT_STATE,
        loading: false,
        readError: { kind: "unknown" }
      };
      const result = sponsorAssetReducer(state, {
        type: REQUEST_SPONSOR_ASSET,
        payload: {}
      });
      expect(result.loading).toBe(true);
      expect(result.readError).toBeNull();
    });
  });

  describe("SPONSOR_ASSET_READ_ERROR", () => {
    it("sets loading=false and readError=payload", () => {
      const state = { ...SA_DEFAULT_STATE, loading: true };
      const err = { kind: "not-found", status: 404, message: "" };
      const result = sponsorAssetReducer(state, {
        type: SPONSOR_ASSET_READ_ERROR,
        payload: err
      });
      expect(result.loading).toBe(false);
      expect(result.readError).toStrictEqual(err);
    });
  });

  describe("RECEIVE_SPONSOR_ASSET_FILTERS", () => {
    it("sets filterOptions to payload.response without changing loading", () => {
      const state = { ...SA_DEFAULT_STATE, loading: true };
      const filters = { sponsors: [{ id: 1, name: "ACME" }] };
      const result = sponsorAssetReducer(state, {
        type: RECEIVE_SPONSOR_ASSET_FILTERS,
        payload: { response: filters }
      });
      expect(result.filterOptions).toStrictEqual(filters);
      // loading must NOT change
      expect(result.loading).toBe(true);
    });
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = { ...SA_DEFAULT_STATE, data: [{ id: 5 }], loading: true };
      const result = sponsorAssetReducer(dirty, { type: SET_CURRENT_SUMMIT });
      expect(result).toStrictEqual(SA_DEFAULT_STATE);
    });
  });

  describe("LOGOUT_USER", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = {
        ...SA_DEFAULT_STATE,
        data: [{ id: 5 }],
        filterOptions: {}
      };
      const result = sponsorAssetReducer(dirty, { type: LOGOUT_USER });
      expect(result).toStrictEqual(SA_DEFAULT_STATE);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// drilldown reducer
// ═══════════════════════════════════════════════════════════════════════════════

describe("sponsorReportsDrilldownReducer", () => {
  describe("initial state", () => {
    it("matches DEFAULT_STATE", () => {
      const result = drilldownReducer(undefined, { type: "@@INIT" });
      expect(result).toStrictEqual(DD_DEFAULT_STATE);
    });
  });

  describe("REQUEST_SPONSOR_DRILLDOWN", () => {
    it("sets loading=true, readError=null, detail=null", () => {
      const state = {
        ...DD_DEFAULT_STATE,
        loading: false,
        readError: { kind: "unknown" },
        detail: { sponsor: { id: 1 } }
      };
      const result = drilldownReducer(state, {
        type: REQUEST_SPONSOR_DRILLDOWN,
        payload: {}
      });
      expect(result.loading).toBe(true);
      expect(result.readError).toBeNull();
      expect(result.detail).toBeNull();
    });
  });

  describe("RECEIVE_SPONSOR_DRILLDOWN", () => {
    it("sets detail=payload.response and loading=false", () => {
      const state = { ...DD_DEFAULT_STATE, loading: true };
      const responseData = { sponsor: { id: 7, name: "ACME" }, pages: [] };
      const result = drilldownReducer(state, {
        type: RECEIVE_SPONSOR_DRILLDOWN,
        payload: { response: responseData }
      });
      expect(result.detail).toStrictEqual(responseData);
      expect(result.loading).toBe(false);
      expect(result.readError).toBeNull();
    });
  });

  describe("SPONSOR_DRILLDOWN_READ_ERROR", () => {
    it("sets loading=false and readError=payload", () => {
      const state = { ...DD_DEFAULT_STATE, loading: true };
      const err = { kind: "not-found", status: 404, message: "" };
      const result = drilldownReducer(state, {
        type: SPONSOR_DRILLDOWN_READ_ERROR,
        payload: err
      });
      expect(result.loading).toBe(false);
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

  describe("LOGOUT_USER", () => {
    it("resets to DEFAULT_STATE", () => {
      const dirty = { ...DD_DEFAULT_STATE, detail: { sponsor: { id: 2 } } };
      const result = drilldownReducer(dirty, { type: LOGOUT_USER });
      expect(result).toStrictEqual(DD_DEFAULT_STATE);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// sponsor-asset reducer — flat rows (Task 4)
// ═══════════════════════════════════════════════════════════════════════════════

describe("sponsor-asset reducer flat rows", () => {
  it("REQUEST_SPONSOR_ASSET sets loading true", () => {
    const s = sponsorAssetReducer(SA_DEFAULT_STATE, {
      type: REQUEST_SPONSOR_ASSET
    });
    expect(s.loading).toBe(true);
  });

  it("RECEIVE_SPONSOR_ASSET_ROWS stores the full rows + summary and clears loading", () => {
    const env = {
      data: [{ sponsor: { id: 1 } }, { sponsor: { id: 2 } }],
      summary: { total: 2, by_status: { completed: 2 } }
    };
    const s = sponsorAssetReducer(
      { ...SA_DEFAULT_STATE, loading: true },
      { type: RECEIVE_SPONSOR_ASSET_ROWS, payload: { response: env } }
    );
    expect(s.rows.map((r) => r.sponsor.id)).toEqual([1, 2]);
    expect(s.summary.total).toBe(2);
    expect(s.loading).toBe(false);
  });
});
