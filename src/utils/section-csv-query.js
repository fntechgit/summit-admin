// Build a CSV query scoped to one sponsor+page section. Replaces any existing
// sponsor_id / page_id clauses (a second same-field filter[] ANDs to empty),
// preserving every unrelated filter and non-filter param. Parses each comma-OR
// bracket STRUCTURALLY (per clause) so a co-located unrelated clause survives.
//
// Caveat: if an active bracket were a true mixed OR like `status==Paid,sponsor_id==17`,
// stripping the sponsor clause and re-emitting `status==Paid` as its own bracket turns
// OR into AND. The v1 query builder never emits mixed brackets (sponsor is always its
// own bracket), so this is a defensive edge, not a live path.
export const buildSectionCsvQuery = (
  activeQuery = {},
  { sponsorId, pageId }
) => {
  const {
    "filter[]": existing = [],
    page: _page,
    per_page: _perPage,
    ...rest
  } = activeQuery;
  const brackets = Array.isArray(existing) ? existing : [existing];
  const kept = [];
  for (const bracket of brackets) {
    const clauses = String(bracket)
      .split(",")
      .filter(
        (c) => c && !/^sponsor_id[<>=!]/.test(c) && !/^page_id[<>=!]/.test(c)
      );
    if (clauses.length) kept.push(clauses.join(","));
  }
  const sid = Number(sponsorId);
  const pid = Number(pageId);
  // Defense-in-depth: callers pass route/backend integer ids (the drill-down page
  // validates :sponsorId/:summitId before rendering). Never interpolate a
  // non-integer value into a filter clause sent to the CSV endpoint.
  if (Number.isInteger(sid)) kept.push(`sponsor_id==${sid}`);
  if (Number.isInteger(pid)) kept.push(`page_id==${pid}`);
  return { ...rest, "filter[]": kept };
};
