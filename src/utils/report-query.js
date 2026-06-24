// src/utils/report-query.js
//
// Translates report UI filter state into a base-api-utils query object.
//
// Filter limitation (base-api-utils, do not modify): a filter[] value with a
// comma is an OR group; separate filter[] entries AND; apply_or_filters merges
// EVERY comma-bracket into one global OR. So multi-select works on at most ONE
// dimension. v1 designates SPONSOR as that dimension; all others are single-value.
// Every emitted value uses valid `field==value` / `field>=value` operator syntax
// (a no-operator value triggers a server IndexError → 500).

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
  if (sponsorIds.length > 0) {
    // Number() coercion prevents stray-comma strings from injecting extra OR terms.
    filter.push(sponsorIds.map((id) => `sponsor_id==${Number(id)}`).join(","));
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
