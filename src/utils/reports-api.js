export const getReportsApiBaseUrl = () => window.SPONSOR_REPORTS_API_URL;

// Strict positive-integer route-id validator. summit_id / sponsor_id arrive as
// strings from route params; accept only positive integers so a malformed or
// tampered id can't be interpolated into a filter clause, the CSV URL path, or a
// download filename. Invalid ids should render a not-found state, not fetch.
export const isPositiveIntId = (v) => /^[1-9]\d*$/.test(String(v));
