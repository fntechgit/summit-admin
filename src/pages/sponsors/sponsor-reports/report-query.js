// src/pages/sponsors/sponsor-reports/report-query.js
//
// Translates report UI filter state into a base-api-utils query object.
//
// Filter limitation (base-api-utils, do not modify): a filter[] value with a
// comma is an OR group; separate filter[] entries AND; apply_or_filters merges
// EVERY comma-bracket into one global OR. So multi-select works on at most ONE
// dimension. v1 designates SPONSOR as that dimension; all others are single-value.
// Every emitted value uses valid `field==value` / `field>=value` operator syntax
// (a no-operator value triggers a server IndexError → 500).

import moment from "moment-timezone";
import { toOrderParam } from "../../../components/sponsors/reports/OrdersTable";

export const buildReportQuery = (filters = {}) => {
  const {
    sponsorIds = [],
    status,
    formCode,
    pageId,
    moduleType,
    mediaRequestType,
    dateFrom,
    dateTo,
    search,
    order,
    page,
    perPage,
    groupBy
  } = filters;

  const filter = [];

  // Sponsor — the one multi-select dimension → comma-OR in a SINGLE bracket.
  // Coerce to positive integers and drop everything else, so a stray entry can't
  // emit `sponsor_id==NaN`/`==0` (rejected by the backend; can hit the bad-filter
  // 500 path). Note Number(null) === 0, so the `> 0` check is load-bearing.
  const sponsorFilterIds = sponsorIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (sponsorFilterIds.length > 0) {
    filter.push(sponsorFilterIds.map((id) => `sponsor_id==${id}`).join(","));
  }

  // Single-value dimensions — each its own comma-free bracket (AND).
  if (status) filter.push(`status==${status}`);
  if (formCode) filter.push(`form_code==${formCode}`);
  if (pageId) filter.push(`page_id==${pageId}`);
  if (moduleType) filter.push(`module_type==${moduleType}`);
  if (mediaRequestType) filter.push(`media_request_type==${mediaRequestType}`);

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

  // Grouped mode: filters/search above still apply (server groups the filtered set).
  // Only `sponsor`/`component` are valid; an empty/falsy value stays flat (omit).
  if (groupBy) query.group_by = groupBy;

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
export const buildPurchaseLinesQuery = (filters = {}, { page, perPage } = {}) =>
  buildReportQuery({ ...expandDates(filters), page, perPage });
