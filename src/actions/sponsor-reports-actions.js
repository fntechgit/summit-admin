import {
  createAction,
  getRequest,
  getCSV,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely, isPositiveIntId } from "../utils/methods";
import { ALL_ROWS_PER_PAGE } from "../utils/constants";
import { makeReadErrorHandler } from "./sponsor-reports-errors";
import {
  buildReportQuery,
  buildPurchaseQuery,
  buildPurchaseLinesQuery
} from "./sponsor-reports-query";

export const REQUEST_PURCHASE_DETAILS = "REQUEST_PURCHASE_DETAILS";
export const RECEIVE_PURCHASE_DETAILS = "RECEIVE_PURCHASE_DETAILS";
export const RECEIVE_PURCHASE_DETAILS_FILTERS =
  "RECEIVE_PURCHASE_DETAILS_FILTERS";
export const PURCHASE_DETAILS_READ_ERROR = "PURCHASE_DETAILS_READ_ERROR";
export const PURCHASE_DETAILS_VALIDATION_ERROR =
  "PURCHASE_DETAILS_VALIDATION_ERROR";
export const PURCHASE_DETAILS_VALIDATION_CLEAR =
  "PURCHASE_DETAILS_VALIDATION_CLEAR";

export const REQUEST_SPONSOR_ASSET = "REQUEST_SPONSOR_ASSET";
export const RECEIVE_SPONSOR_ASSET_FILTERS = "RECEIVE_SPONSOR_ASSET_FILTERS";
export const SPONSOR_ASSET_READ_ERROR = "SPONSOR_ASSET_READ_ERROR";
export const RECEIVE_SPONSOR_ASSET_ROWS = "RECEIVE_SPONSOR_ASSET_ROWS";
export const RECEIVE_SPONSOR_ASSET_PAGE = "RECEIVE_SPONSOR_ASSET_PAGE"; // throwaway per-page action

export const REQUEST_SPONSOR_DRILLDOWN = "REQUEST_SPONSOR_DRILLDOWN";
export const RECEIVE_SPONSOR_DRILLDOWN = "RECEIVE_SPONSOR_DRILLDOWN";
export const SPONSOR_DRILLDOWN_READ_ERROR = "SPONSOR_DRILLDOWN_READ_ERROR";

export const REQUEST_PURCHASE_DETAILS_LINES = "REQUEST_PURCHASE_DETAILS_LINES";
export const RECEIVE_PURCHASE_DETAILS_LINES = "RECEIVE_PURCHASE_DETAILS_LINES";
export const PURCHASE_DETAILS_LINES_READ_ERROR =
  "PURCHASE_DETAILS_LINES_READ_ERROR";

// Monotonically-increasing counter used to detect stale getSponsorAssetRows completions.
// Each invocation captures the counter value at entry; only the invocation whose captured
// value still matches the current counter (i.e. no newer call was started) is allowed to
// commit its RECEIVE_SPONSOR_ASSET_ROWS dispatch.
let sponsorAssetRowsSeq = 0;

// Base URL helper — scoped to a specific summit's reports endpoint.
const base = (summitId) =>
  `${window.SPONSOR_REPORTS_API_URL}/api/v1/summits/${summitId}/reports`;

export const getPurchaseDetailsReport =
  (filters = {}, pagination = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    // No summit in context → skip. Otherwise base(currentSummit.id) throws
    // synchronously after startLoading() and the spinner is never cleared.
    if (!currentSummit?.id) return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    const query = buildPurchaseQuery(filters, pagination);
    const params = { access_token: accessToken, ...query };
    return getRequest(
      createAction(REQUEST_PURCHASE_DETAILS),
      createAction(RECEIVE_PURCHASE_DETAILS),
      `${base(currentSummit.id)}/purchase-details`,
      makeReadErrorHandler({
        onReadError: createAction(PURCHASE_DETAILS_READ_ERROR),
        onValidationError: createAction(PURCHASE_DETAILS_VALIDATION_ERROR),
        onExportDisabled: createAction(PURCHASE_DETAILS_READ_ERROR)
      })
    )(params)(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };

// Clears the Purchase Details validation toast (dispatched from the Snackbar
// onClose). A plain action creator lets the page bind it via the object form of
// mapDispatchToProps instead of receiving raw dispatch.
export const clearPurchaseDetailsValidation = () => ({
  type: PURCHASE_DETAILS_VALIDATION_CLEAR
});

export const getPurchaseDetailsLinesReport =
  (filters = {}, pagination = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    const query = buildPurchaseLinesQuery(filters, pagination);
    const params = { access_token: accessToken, ...query };
    return getRequest(
      createAction(REQUEST_PURCHASE_DETAILS_LINES),
      createAction(RECEIVE_PURCHASE_DETAILS_LINES),
      `${base(currentSummit.id)}/purchase-details/lines`,
      makeReadErrorHandler({
        onReadError: createAction(PURCHASE_DETAILS_LINES_READ_ERROR),
        // This view sends no client-invalid input, but a 412 must still clear
        // loading rather than silently no-op → route it to the read-error body.
        onValidationError: createAction(PURCHASE_DETAILS_LINES_READ_ERROR),
        onExportDisabled: createAction(PURCHASE_DETAILS_LINES_READ_ERROR)
      })
    )(params)(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };

export const getPurchaseDetailsFilters = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  if (!currentSummit?.id) return Promise.resolve();
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());
  return getRequest(
    null,
    createAction(RECEIVE_PURCHASE_DETAILS_FILTERS),
    `${base(currentSummit.id)}/purchase-details/filters`,
    makeReadErrorHandler({
      onReadError: createAction(PURCHASE_DETAILS_READ_ERROR)
    })
  )({ access_token: accessToken })(dispatch)
    .catch(() => {})
    .finally(() => dispatch(stopLoading()));
};

export const getSponsorAssetFilters = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  if (!currentSummit?.id) return Promise.resolve();
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());
  return getRequest(
    null, // loading is owned by getSponsorAssetRows; filters must not toggle it
    createAction(RECEIVE_SPONSOR_ASSET_FILTERS),
    `${base(currentSummit.id)}/sponsor-assets/filters`,
    makeReadErrorHandler({
      onReadError: createAction(SPONSOR_ASSET_READ_ERROR)
    })
  )({ access_token: accessToken })(dispatch)
    .catch(() => {})
    .finally(() => dispatch(stopLoading()));
};

// Fetch the WHOLE filtered collected-asset set for the current summit so the FE can pivot
// client-side. The server applies filters + module_type==Media and computes the embedded
// summary on the unpaginated set. One request at the raised cap covers normal summits; if
// last_page > 1 we page the remainder (correctness safety net — no cap is a completeness
// guarantee). Loading is atomic: REQUEST_SPONSOR_ASSET → (accumulate all pages) → ONE
// RECEIVE_SPONSOR_ASSET_ROWS, so the tree never renders a partial set.
export const getSponsorAssetRows =
  (filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    // Capture the sequence token immediately so any concurrent call that starts after this
    // one will bump the counter and render this invocation "stale" before we finish.
    sponsorAssetRowsSeq += 1;
    const mySeq = sponsorAssetRowsSeq;
    const accessToken = await getAccessTokenSafely();
    dispatch(createAction(REQUEST_SPONSOR_ASSET)({})); // loading:true, readError:null
    const baseQuery = buildReportQuery({ ...filters, moduleType: "Media" });
    const url = `${base(currentSummit.id)}/sponsor-assets`;
    // null request action (loading already set); throwaway receive — we read {response}.
    const fetchPage = (page) =>
      getRequest(
        null,
        createAction(RECEIVE_SPONSOR_ASSET_PAGE),
        url,
        makeReadErrorHandler({
          onReadError: createAction(SPONSOR_ASSET_READ_ERROR),
          onValidationError: createAction(SPONSOR_ASSET_READ_ERROR),
          onExportDisabled: createAction(SPONSOR_ASSET_READ_ERROR)
        })
      )({
        access_token: accessToken,
        ...baseQuery,
        per_page: ALL_ROWS_PER_PAGE,
        page
      })(dispatch);
    try {
      const { response } = await fetchPage(1);
      let allRows = response.data;
      for (let p = 2; p <= (response.last_page || 1); p += 1) {
        // eslint-disable-next-line no-await-in-loop
        const next = await fetchPage(p);
        allRows = allRows.concat(next.response.data);
      }
      // Only commit if we are still the latest call. A superseded (stale) invocation
      // that finishes after a newer one would otherwise overwrite the newer call's rows.
      // Per-page makeReadErrorHandler error dispatches inside the loop are not seq-guarded
      // (they live inside getRequest and target the dominant case of a stale SUCCESS).
      if (mySeq === sponsorAssetRowsSeq) {
        dispatch(
          createAction(RECEIVE_SPONSOR_ASSET_ROWS)({
            response: { ...response, data: allRows }
          })
        );
      }
    } catch (e) {
      // For HTTP failures, makeReadErrorHandler already dispatched SPONSOR_ASSET_READ_ERROR
      // (which clears the local `loading` flag — reducer sets `loading:false`). But global
      // stopLoading does NOT clear this reducer's local `loading`, and a NON-HTTP exception
      // after REQUEST_SPONSOR_ASSET would otherwise leave the page stuck loading. So dispatch
      // a local terminal SPONSOR_ASSET_READ_ERROR here too (idempotent if both fire).
      if (mySeq === sponsorAssetRowsSeq) {
        dispatch(
          createAction(SPONSOR_ASSET_READ_ERROR)({ message: e?.message })
        );
      }
    }
    return Promise.resolve();
  };

// Orders CSV export — owns URL + params + filename (cf. exportEventRsvpsCSV).
// Keeps the on-screen sort so the exported rows match what the user sees.
// No page/perPage → buildPurchaseQuery emits neither; backend exports the full
// filtered set.
export const exportPurchaseDetailsCsv =
  (filters, order, orderDir) => async (dispatch, getState) => {
    const { currentSummit } = getState().currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    const params = {
      access_token: accessToken,
      ...buildPurchaseQuery(filters, { order, orderDir })
    };
    return dispatch(
      getCSV(
        `${base(currentSummit.id)}/purchase-details/csv`,
        params,
        `purchase-details-summit-${currentSummit.id}.csv`
      )
    );
  };

// Per-line CSV export — no order param (backend default ordering keeps sponsor
// groups intact; see lines query comment in the page).
export const exportPurchaseDetailsLinesCsv =
  (filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummit } = getState().currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    const params = {
      access_token: accessToken,
      ...buildPurchaseLinesQuery(filters, {})
    };
    return dispatch(
      getCSV(
        `${base(currentSummit.id)}/purchase-details/lines/csv`,
        params,
        `purchase-details-lines-summit-${currentSummit.id}.csv`
      )
    );
  };

export const getSponsorAssetSponsor =
  (sponsorId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    // No summit in context → skip. Otherwise base(currentSummit.id) throws
    // synchronously after startLoading() and the spinner is never cleared.
    if (!currentSummit?.id) return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    return getRequest(
      createAction(REQUEST_SPONSOR_DRILLDOWN),
      createAction(RECEIVE_SPONSOR_DRILLDOWN),
      `${base(currentSummit.id)}/sponsor-assets/sponsors/${sponsorId}`,
      makeReadErrorHandler({
        onReadError: createAction(SPONSOR_DRILLDOWN_READ_ERROR),
        // A 412 or export-disabled 503 on a read endpoint must still clear
        // loading; route both to the same READ_ERROR action so the page does
        // not spin forever.
        onValidationError: createAction(SPONSOR_DRILLDOWN_READ_ERROR),
        onExportDisabled: createAction(SPONSOR_DRILLDOWN_READ_ERROR)
      })
    )({ access_token: accessToken })(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };

// Sponsor-asset CSV — flat export: drop grouping/order/pagination so the export
// matches the active filters but not the grouped/paged view.
export const exportSponsorAssetCsv =
  (filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummit } = getState().currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    const {
      order: _o,
      page: _p,
      per_page: _pp,
      ...rest
    } = buildReportQuery(filters);
    return dispatch(
      getCSV(
        `${base(currentSummit.id)}/sponsor-assets/csv`,
        { access_token: accessToken, ...rest },
        `sponsor-assets-summit-${currentSummit.id}.csv`
      )
    );
  };

// Single sponsor+page section export. Both ids must be positive ints (shared
// isPositiveIntId; the drilldown route validates :sponsorId before render) — bail
// rather than emit a broadened CSV, since dropping one id would widen the export
// to the whole sponsor/report. Scoped to collected (module_type==Media) so the
// per-page CSV matches the collected-only view — downloads/info are excluded.
export const exportSponsorAssetSectionCsv =
  (sponsorId, pageId) => async (dispatch, getState) => {
    const { currentSummit } = getState().currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    if (!isPositiveIntId(sponsorId) || !isPositiveIntId(pageId))
      return Promise.resolve();
    const accessToken = await getAccessTokenSafely();
    const filter = [
      `sponsor_id==${sponsorId}`,
      `page_id==${pageId}`,
      "module_type==Media"
    ];
    return dispatch(
      getCSV(
        `${base(currentSummit.id)}/sponsor-assets/csv`,
        { access_token: accessToken, "filter[]": filter },
        `sponsor-${sponsorId}-page-${pageId}.csv`
      )
    );
  };
