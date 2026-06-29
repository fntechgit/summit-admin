// Buckets flat per-line rows into sponsor groups, preserving first-seen order.
//
// Do NOT rely on row adjacency: the backend orders lines by sponsor NAME
// (purchase__sponsor__name) and dim_sponsor.name is not unique, so two distinct
// sponsor ids sharing a name can interleave by date. Bucketing by sponsor.id
// keeps each sponsor's lines in a single group regardless of row order.
export const bucketLinesBySponsor = (rows = []) => {
  const groups = [];
  const indexByKey = new Map();
  rows.forEach((row) => {
    const id = row.sponsor?.id ?? null;
    const key = id === null ? "__null__" : id;
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        sponsorId: id,
        sponsorName: row.sponsor?.name ?? "",
        lines: []
      });
    }
    groups[indexByKey.get(key)].lines.push(row);
  });
  return groups;
};

export default bucketLinesBySponsor;
