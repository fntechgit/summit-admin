import moment from "moment-timezone";
import {
  createAction,
  getRequest,
  getCSV,
  startLoading,
  stopLoading,
  authErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import pLimit from "p-limit";
import {
  getAccessTokenSafely,
  isPositiveIntId,
  escapeFilterValue
} from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  HUNDRED_PER_PAGE,
  TEN,
  ERROR_CODE_401,
  ERROR_CODE_404,
  ERROR_CODE_412
} from "../utils/constants";

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

export const REQUEST_PURCHASE_DETAILS_BY_ITEM =
  "REQUEST_PURCHASE_DETAILS_BY_ITEM";
export const RECEIVE_PURCHASE_DETAILS_BY_ITEM_PAGE =
  "RECEIVE_PURCHASE_DETAILS_BY_ITEM_PAGE"; // throwaway per-page action
export const RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS =
  "RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS";
export const PURCHASE_DETAILS_BY_ITEM_READ_ERROR =
  "PURCHASE_DETAILS_BY_ITEM_READ_ERROR";
export const SET_PURCHASE_DETAILS_BY_ITEM_PAGING =
  "SET_PURCHASE_DETAILS_BY_ITEM_PAGING";

// Per-thunk sequence-token factory guarding against stale-response commits.
// Two concurrent invocations of the same thunk (different filters/page/sponsor)
// carry different getRequest abort keys (only access_token is stripped from the
// key), so they never cancel each other and whichever response lands LAST would
// win — even the older one. Each begin(dispatch) bumps the thunk's counter and
// returns helpers scoped to that invocation:
//   isCurrent()        — false once a newer invocation has begun
//   guardedDispatch(a) — forwards to dispatch only while current, so a
//                        superseded invocation cannot mutate state at all
//                        (REQUEST, RECEIVE, error handlers, start/stopLoading).
// The newest invocation is always current, so the overlay is always cleared by
// whichever call finishes last. A STALE call's 401 re-login is also dropped
// (uicore authErrorHandler reaches doLogin by dispatching a thunk through the
// dispatch it is given) — safe: the fresh call carries the same token, so it
// 401s too and drives the re-login, and uicore's isClearingSessionState guard
// dedupes concurrent attempts.
const sequenced = () => {
  let seq = 0;
  return (dispatch) => {
    seq += 1;
    const mySeq = seq;
    return {
      isCurrent: () => mySeq === seq,
      guardedDispatch: (action) => {
        if (mySeq === seq) dispatch(action);
      }
    };
  };
};
// One sequence per thunk that commits fetched data to the store.
const purchaseDetailsSeq = sequenced();
const purchaseLinesSeq = sequenced();
const purchaseFiltersSeq = sequenced();
const sponsorAssetRowsSeq = sequenced();
const assetFiltersSeq = sequenced();
const sponsorDrilldownSeq = sequenced();
const purchaseByItemSeq = sequenced();

// Base URL helper — scoped to a specific summit's reports endpoint.
const base = (summitId) =>
  `${window.SPONSOR_REPORTS_API_URL}/api/v1/summits/${summitId}/reports`;

// Extract a human-readable message from a uicore getRequest error/response.
// Reports surface these inline in the page body, so an empty string (which the
// pages render as an i18n fallback) is preferred over a misleading partial.
const reportErrorMessage = (err = {}, res = {}) => {
  const candidates = [
    err?.response?.body?.message,
    err?.response?.body?.detail,
    err?.body?.message,
    err?.body?.detail,
    err?.message,
    res?.body?.message,
    res?.body?.detail
  ];
  return candidates.find((c) => typeof c === "string" && c.length > 0) || "";
};

// Error handler for the reports read endpoints. Unlike the rest of the app,
// reports replace the page body with an inline error panel (feature-off 503,
// not-found 404, …) rather than a global snackbar — a deliberate per-report UX.
// 401 is delegated to uicore's authErrorHandler so its session-clearing guard
// dedupes concurrent re-logins across the paginated asset fetch. 412 routes to
// an optional validation action (inline toast; body preserved); a 404 body
// carries kind:"not-found" so the drilldown can render its own panel.
const reportReadErrorHandler =
  ({ onReadError, onValidationError }) =>
  (err, res) =>
  (dispatch, getState) => {
    const status = err?.status ?? res?.status;
    if (status === ERROR_CODE_401) {
      authErrorHandler(err, res)(dispatch, getState);
      return;
    }
    const message = reportErrorMessage(err, res);
    if (status === ERROR_CODE_412 && onValidationError) {
      dispatch(onValidationError({ status, message }));
      return;
    }
    dispatch(
      onReadError({
        status,
        message,
        ...(status === ERROR_CODE_404 ? { kind: "not-found" } : {})
      })
    );
  };

// ─── Query builders ──────────────────────────────────────────────────────────
// Translate report UI filter state into a base-api-utils query object.
//
// Filter limitation (base-api-utils, do not modify): a filter[] value with a
// comma is an OR group; separate filter[] entries AND; apply_or_filters merges
// EVERY comma-bracket into one global OR. So multi-select works on at most ONE
// dimension. v1 designates SPONSOR as that dimension; all others are single-value.
// Every emitted value uses valid `field==value` / `field>=value` operator syntax
// (a no-operator value triggers a server IndexError → 500).

// Converts MuiTable sort state to the `order` query param expected by the API.
// MuiTable calls onSort(columnKey, dir) where dir = 1 (asc) | -1 (desc).
export const toOrderParam = (columnKey, dir) => {
  if (!columnKey) return undefined;
  return dir === -1 ? `-${columnKey}` : columnKey;
};

export const buildReportQuery = (filters = {}) => {
  const {
    sponsorIds = [],
    status,
    formCode,
    paymentMethod,
    pageId,
    moduleType,
    mediaRequestType,
    dateFrom,
    dateTo,
    search,
    order,
    page,
    perPage
  } = filters;

  const filter = [];

  // Sponsor — the one multi-select dimension → comma-OR in a SINGLE bracket.
  // Keep only positive-integer ids (shared isPositiveIntId — string-aware), so a
  // stray entry can't emit `sponsor_id==NaN`/`==0`/negative (rejected by the
  // backend; can hit the bad-filter 500 path).
  const sponsorFilterIds = sponsorIds.filter(isPositiveIntId).map(Number);
  if (sponsorFilterIds.length > 0) {
    filter.push(sponsorFilterIds.map((id) => `sponsor_id==${id}`).join(","));
  }

  // Single-value dimensions — each its own comma-free bracket (AND).
  if (status) filter.push(`status==${escapeFilterValue(status)}`);
  if (formCode) filter.push(`form_code==${escapeFilterValue(formCode)}`);
  if (paymentMethod)
    filter.push(`payment_method==${escapeFilterValue(paymentMethod)}`);
  if (pageId) filter.push(`page_id==${pageId}`);
  if (moduleType) filter.push(`module_type==${escapeFilterValue(moduleType)}`);
  if (mediaRequestType)
    filter.push(`media_request_type==${escapeFilterValue(mediaRequestType)}`);

  // Date range — two comma-free brackets (AND). order_date is an IsoDateTimeFilter
  // server-side, so dateFrom/dateTo MUST be ISO-8601 strings (never epochs). dateFrom is
  // an INCLUSIVE lower bound (>= → __gte); dateTo is an EXCLUSIVE upper bound (< → __lt,
  // verified in base-api-utils operator_map). The caller passes the START of the day AFTER
  // the range as dateTo, so same-day rows with fractional seconds are included (a <=
  // end-of-day bound would drop sub-second-later timestamps).
  if (dateFrom != null) filter.push(`order_date>=${dateFrom}`);
  if (dateTo != null) filter.push(`order_date<${dateTo}`);

  const query = {};
  if (filter.length > 0) query["filter[]"] = filter;
  if (search) query.search = search;
  if (order) query.order = order;
  if (page != null) query.page = page;
  if (perPage != null) query.per_page = perPage;
  // Canceled is excluded server-side by default.
  if (status === "Canceled") query.include_cancelled = "true";

  return query;
};

// dateTo → start of the NEXT day (exclusive <) so same-day fractional-second rows
// are included rather than dropped by a <= end-of-day bound.
const nextDayStartIso = (ymd) => {
  const m = moment.utc(ymd, "YYYY-MM-DD", true).add(1, "day");
  return m.isValid() ? m.format("YYYY-MM-DDT00:00:00[Z]") : ymd;
};

const expandDates = (filters = {}) => {
  const { dateFrom, dateTo, ...rest } = filters;
  return {
    ...rest,
    dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
    dateTo: dateTo ? nextDayStartIso(dateTo) : undefined
  };
};

// Orders grain: date expansion + pagination + formatted sort. Used by the on-screen
// fetch AND exportPurchaseDetailsCsv (export passes no page/perPage → none emitted).
export const buildPurchaseQuery = (
  filters = {},
  { page, perPage, order, orderDir } = {}
) =>
  buildReportQuery({
    ...expandDates(filters),
    page,
    perPage,
    order: toOrderParam(order, orderDir)
  });

// Lines grain: same date expansion, NO order (manifest relies on backend default
// ordering). Used by the on-screen lines fetch AND exportPurchaseDetailsLinesCsv.
// The lines endpoint's filter set omits payment_method (it's an order-level
// attribute), so drop it here rather than emit a clause BaseFilter silently
// ignores. The UI also hides the Payment Method control in the Line Items view.
export const buildPurchaseLinesQuery = (
  { paymentMethod: _paymentMethod, ...filters } = {},
  { page, perPage } = {}
) => buildReportQuery({ ...expandDates(filters), page, perPage });

export const getPurchaseDetailsReport =
  (filters = {}, pagination = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    // No summit in context → skip. Otherwise base(currentSummit.id) throws
    // synchronously after startLoading() and the spinner is never cleared.
    if (!currentSummit?.id) return Promise.resolve();
    // Sequence-guard (see sequenced()): concurrent calls with different
    // filters/page/sort never abort each other, so a stale response could land
    // last and overwrite the fresh one. guardedDispatch drops every dispatch
    // (REQUEST/RECEIVE/errors/loading) from a superseded invocation.
    const { isCurrent, guardedDispatch } = purchaseDetailsSeq(dispatch);
    const accessToken = await getAccessTokenSafely();
    // Superseded while awaiting the token → don't fire a request at all.
    if (!isCurrent()) return Promise.resolve();
    guardedDispatch(startLoading());
    const { page, perPage, order, orderDir } = pagination;
    const query = buildPurchaseQuery(filters, pagination);
    const params = { access_token: accessToken, ...query };
    // 5th arg → REQUEST_PURCHASE_DETAILS payload: the reducer records these so
    // pagination/sort/filter survive SPA navigation (cf. getTicketTypes).
    return getRequest(
      createAction(REQUEST_PURCHASE_DETAILS),
      createAction(RECEIVE_PURCHASE_DETAILS),
      `${base(currentSummit.id)}/purchase-details`,
      reportReadErrorHandler({
        onReadError: createAction(PURCHASE_DETAILS_READ_ERROR),
        onValidationError: createAction(PURCHASE_DETAILS_VALIDATION_ERROR)
      }),
      { currentPage: page, perPage, order, orderDir, filters }
    )(params)(guardedDispatch)
      .catch(() => {})
      .finally(() => guardedDispatch(stopLoading()));
  };

// Clears the Purchase Details validation toast (dispatched from the Snackbar
// onClose).
export const clearPurchaseDetailsValidation = () => (dispatch) => {
  dispatch(createAction(PURCHASE_DETAILS_VALIDATION_CLEAR)({}));
};

export const getPurchaseDetailsLinesReport =
  (filters = {}, pagination = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    // Sequence-guard (see sequenced()): drops every dispatch from a superseded
    // invocation so a stale lines response cannot land over a fresh one.
    const { isCurrent, guardedDispatch } = purchaseLinesSeq(dispatch);
    const accessToken = await getAccessTokenSafely();
    if (!isCurrent()) return Promise.resolve();
    guardedDispatch(startLoading());
    const { page, perPage } = pagination;
    const query = buildPurchaseLinesQuery(filters, pagination);
    const params = { access_token: accessToken, ...query };
    // 5th arg → REQUEST_PURCHASE_DETAILS_LINES payload: the reducer records these
    // so pagination/filter survive SPA navigation (cf. getTicketTypes).
    return getRequest(
      createAction(REQUEST_PURCHASE_DETAILS_LINES),
      createAction(RECEIVE_PURCHASE_DETAILS_LINES),
      `${base(currentSummit.id)}/purchase-details/lines`,
      reportReadErrorHandler({
        // No distinct validation UX here: this view sends no client-invalid
        // input, so a 412 falls through to the read-error body, which still
        // clears loading rather than silently no-op.
        onReadError: createAction(PURCHASE_DETAILS_LINES_READ_ERROR)
      }),
      { currentPage: page, perPage, filters }
    )(params)(guardedDispatch)
      .catch(() => {})
      .finally(() => guardedDispatch(stopLoading()));
  };

export const getPurchaseDetailsFilters = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  if (!currentSummit?.id) return Promise.resolve();
  // Sequence-guard (see sequenced()): same-summit duplicates share an abort key
  // (no user-varying params) so getRequest cancels them, but a summit SWITCH
  // changes the URL — the old summit's late response would land after the
  // SET_CURRENT_SUMMIT reset and repopulate filterOptions with stale options.
  const { isCurrent, guardedDispatch } = purchaseFiltersSeq(dispatch);
  const accessToken = await getAccessTokenSafely();
  if (!isCurrent()) return Promise.resolve();
  guardedDispatch(startLoading());
  return getRequest(
    null,
    createAction(RECEIVE_PURCHASE_DETAILS_FILTERS),
    `${base(currentSummit.id)}/purchase-details/filters`,
    reportReadErrorHandler({
      onReadError: createAction(PURCHASE_DETAILS_READ_ERROR)
    })
  )({ access_token: accessToken })(guardedDispatch)
    .catch(() => {})
    .finally(() => guardedDispatch(stopLoading()));
};

export const getSponsorAssetFilters = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  if (!currentSummit?.id) return Promise.resolve();
  // Sequence-guard: see getPurchaseDetailsFilters — protects the summit-switch
  // case (different summit id → different abort key → no cancellation).
  const { isCurrent, guardedDispatch } = assetFiltersSeq(dispatch);
  const accessToken = await getAccessTokenSafely();
  if (!isCurrent()) return Promise.resolve();
  guardedDispatch(startLoading());
  return getRequest(
    null, // no request action for the filters fetch (it records no report state)
    createAction(RECEIVE_SPONSOR_ASSET_FILTERS),
    `${base(currentSummit.id)}/sponsor-assets/filters`,
    reportReadErrorHandler({
      onReadError: createAction(SPONSOR_ASSET_READ_ERROR)
    })
  )({ access_token: accessToken })(guardedDispatch)
    .catch(() => {})
    .finally(() => guardedDispatch(stopLoading()));
};

// Fetch the WHOLE filtered collected-asset set for the current summit so the FE can pivot
// client-side. The server applies filters + module_type==Media and computes the embedded
// summary on the unpaginated set. Page 1 (at a normal page size) yields last_page + the
// summary; the remaining pages bulk-load with a bounded-concurrency pool (pLimit + Promise.all,
// pattern: ticket-actions.js) rather than one oversized page. Rows commit atomically:
// REQUEST_SPONSOR_ASSET → (accumulate all pages) → ONE RECEIVE_SPONSOR_ASSET_ROWS, so the tree
// never renders a partial set. The global overlay (state.baseState.loading) is bracketed via
// guarded start/stopLoading so a superseded invocation cannot toggle it.
export const getSponsorAssetRows =
  (filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    // Begin the sequence immediately so any concurrent call that starts after this
    // one renders this invocation "stale" before we finish. guardedDispatch covers:
    //   • REQUEST_SPONSOR_ASSET after the token await (stuck-loading hole)
    //   • per-page error dispatches inside getRequest's error handler (stale-error hole)
    //   • both terminal dispatches (RECEIVE and SPONSOR_ASSET_READ_ERROR in catch)
    const { isCurrent, guardedDispatch } = sponsorAssetRowsSeq(dispatch);
    const accessToken = await getAccessTokenSafely();
    // Superseded before the token resolved → do not fire any request. uicore getRequest
    // aborts the in-flight same-URL request, so a stale call would cancel the current load.
    if (!isCurrent()) return Promise.resolve();
    // Guarded so only the still-current invocation drives the global overlay and
    // records the active filters (REQUEST payload) for SPA-navigation persistence.
    guardedDispatch(startLoading());
    guardedDispatch(createAction(REQUEST_SPONSOR_ASSET)({ filters }));
    const baseQuery = buildReportQuery({ ...filters, moduleType: "Media" });
    const url = `${base(currentSummit.id)}/sponsor-assets`;
    // null request action (REQUEST already dispatched above); throwaway receive — we read {response}.
    // guardedDispatch is passed so getRequest's internal error handler is also seq-guarded.
    const fetchPage = (page) =>
      getRequest(
        null,
        createAction(RECEIVE_SPONSOR_ASSET_PAGE),
        url,
        reportReadErrorHandler({
          onReadError: createAction(SPONSOR_ASSET_READ_ERROR)
        })
      )({
        access_token: accessToken,
        ...baseQuery,
        per_page: HUNDRED_PER_PAGE,
        page
      })(guardedDispatch);
    try {
      // Page 1 first to learn last_page, then bulk-load the remainder in parallel
      // with a concurrency cap. getRequest's in-flight abort key includes `page`
      // (only access_token is stripped), so these parallel same-URL requests do
      // NOT cancel each other; a superseded load is still aborted by the fresh
      // invocation's identical-page requests, and guardedDispatch blocks any stale
      // RECEIVE. Promise.all preserves order, so pages concat in sequence.
      const { response } = await fetchPage(1);
      const lastPage = response.last_page || 1;
      const limit = pLimit(TEN);
      // Pages 2..last_page (page 1 already fetched). Build 1..last_page with the
      // house idiom (i + DEFAULT_CURRENT_PAGE) and drop the first.
      const restPages = Array.from(
        { length: lastPage },
        (_, i) => i + DEFAULT_CURRENT_PAGE
      ).slice(DEFAULT_CURRENT_PAGE);
      // Re-check the seq INSIDE the pool callback: a superseded invocation's still
      // queued jobs must not fire — an identical-page request from a stale job would
      // abort the fresh invocation's in-flight same-page request (getRequest aborts
      // by a page-bearing key). The empty placeholder is never consumed: the
      // post-load guard below returns before the reduce for a stale invocation.
      const rest = await Promise.all(
        restPages.map((p) =>
          limit(() =>
            isCurrent()
              ? fetchPage(p)
              : Promise.resolve({ response: { data: [] } })
          )
        )
      );
      // Superseded mid-load → skip the commit; guardedDispatch would drop it anyway.
      if (!isCurrent()) return Promise.resolve();
      const allRows = rest.reduce(
        (acc, r) => acc.concat(r.response.data),
        response.data
      );
      guardedDispatch(
        createAction(RECEIVE_SPONSOR_ASSET_ROWS)({
          response: { ...response, data: allRows }
        })
      );
      guardedDispatch(stopLoading());
    } catch (e) {
      // HTTP failures are already handled by reportReadErrorHandler (it dispatched
      // SPONSOR_ASSET_READ_ERROR for 403/404/…, or delegated 401 to guarded reauth
      // without an inline error). uicore rejects those with a plain {err,res,…}
      // object, so only an Error here is a genuine non-HTTP exception (e.g. a
      // malformed response body). Guarding on that avoids clobbering the handler's
      // server message and avoids flashing a read error over the 401 reauth.
      if (e instanceof Error) {
        guardedDispatch(
          createAction(SPONSOR_ASSET_READ_ERROR)({ message: e.message })
        );
      }
      // Clear the global overlay (guarded: a superseded call must not stop the
      // overlay while the fresh invocation is still loading). HTTP-error branches
      // (403/404/…) route through reportReadErrorHandler above; 401 delegates to
      // uicore's authErrorHandler which also stops loading.
      guardedDispatch(stopLoading());
    }
    return Promise.resolve();
  };

// Fetch the WHOLE filtered line set for the By Item rollup — same whole-set
// client-side-pivot flow as getSponsorAssetRows above (see that thunk for the
// full sequencing rationale). Page 1 yields last_page + the embedded summary
// (the backend computes it over the unpaginated filtered set); pages 2..last
// bulk-load with a bounded-concurrency pool. Rows commit atomically in ONE
// RECEIVE so the rollup never renders a partial set.
export const getPurchaseDetailsByItemRows =
  (filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    if (!currentSummit?.id) return Promise.resolve();
    const { isCurrent, guardedDispatch } = purchaseByItemSeq(dispatch);
    const accessToken = await getAccessTokenSafely();
    if (!isCurrent()) return Promise.resolve();
    guardedDispatch(startLoading());
    guardedDispatch(
      createAction(REQUEST_PURCHASE_DETAILS_BY_ITEM)({ filters })
    );
    // Lines-grain query (drops paymentMethod); one arg → no page/per_page emitted.
    const baseQuery = buildPurchaseLinesQuery(filters);
    const url = `${base(currentSummit.id)}/purchase-details/lines`;
    const fetchPage = (page) =>
      getRequest(
        null,
        createAction(RECEIVE_PURCHASE_DETAILS_BY_ITEM_PAGE),
        url,
        reportReadErrorHandler({
          onReadError: createAction(PURCHASE_DETAILS_BY_ITEM_READ_ERROR)
        })
      )({
        access_token: accessToken,
        ...baseQuery,
        per_page: HUNDRED_PER_PAGE,
        page
      })(guardedDispatch);
    try {
      const { response } = await fetchPage(1);
      const lastPage = response.last_page || 1;
      const limit = pLimit(TEN);
      const restPages = Array.from(
        { length: lastPage },
        (_, i) => i + DEFAULT_CURRENT_PAGE
      ).slice(DEFAULT_CURRENT_PAGE);
      // Re-check the seq INSIDE the pool callback: a superseded invocation's
      // queued jobs must not fire (see getSponsorAssetRows).
      const rest = await Promise.all(
        restPages.map((p) =>
          limit(() =>
            isCurrent()
              ? fetchPage(p)
              : Promise.resolve({ response: { data: [] } })
          )
        )
      );
      if (!isCurrent()) return Promise.resolve();
      const allRows = rest.reduce(
        (acc, r) => acc.concat(r.response.data),
        response.data
      );
      guardedDispatch(
        createAction(RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS)({
          response: { ...response, data: allRows }
        })
      );
      guardedDispatch(stopLoading());
    } catch (e) {
      // Only a genuine non-HTTP Error lands here (HTTP errors already routed
      // through reportReadErrorHandler) — see getSponsorAssetRows.
      if (e instanceof Error) {
        guardedDispatch(
          createAction(PURCHASE_DETAILS_BY_ITEM_READ_ERROR)({
            message: e.message
          })
        );
      }
      guardedDispatch(stopLoading());
    }
    return Promise.resolve();
  };

// Client-side paging over the DERIVED By Item sponsor groups — recorded in redux
// (not local state) so the user's place survives the Orders ↔ By Item toggle and
// SPA navigation. Pure client dispatch (cf. clearPurchaseDetailsValidation).
export const setPurchaseDetailsByItemPaging =
  ({ currentPage, perPage }) =>
  (dispatch) => {
    dispatch(
      createAction(SET_PURCHASE_DETAILS_BY_ITEM_PAGING)({
        currentPage,
        perPage
      })
    );
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
    // Sequence-guard (see sequenced()): sponsor A's late response must not land
    // over sponsor B's after an A → B navigation (different sponsorId = different
    // abort key, so the requests never cancel each other).
    const { isCurrent, guardedDispatch } = sponsorDrilldownSeq(dispatch);
    const accessToken = await getAccessTokenSafely();
    if (!isCurrent()) return Promise.resolve();
    guardedDispatch(startLoading());
    return getRequest(
      createAction(REQUEST_SPONSOR_DRILLDOWN),
      createAction(RECEIVE_SPONSOR_DRILLDOWN),
      `${base(currentSummit.id)}/sponsor-assets/sponsors/${sponsorId}`,
      reportReadErrorHandler({
        // A 412/503 on this read endpoint falls through to the READ_ERROR body
        // (clears loading so the page does not spin forever); a 404 additionally
        // carries kind:"not-found" so the page renders its sponsor-not-found panel.
        onReadError: createAction(SPONSOR_DRILLDOWN_READ_ERROR)
      })
    )({ access_token: accessToken })(guardedDispatch)
      .catch(() => {})
      .finally(() => guardedDispatch(stopLoading()));
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
