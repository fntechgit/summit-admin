import { AXES } from "./pivot-defs";

const STATUS_KEYS = ["completed", "in_progress", "pending", "not_applicable"];
// Symbol sentinel for the "key is null" (unknown) bucket — collision-free with any
// real id/string key, and (unlike a string literal) impossible to clash with data.
const UNKNOWN = Symbol("unknown");

const rollupOf = (rows) => {
  const r = { completed: 0, in_progress: 0, pending: 0, not_applicable: 0 };
  rows.forEach((row) => {
    if (STATUS_KEYS.includes(row.status)) r[row.status] += 1;
  });
  return r;
};

// Group `rows` recursively by the ordered `axisIds`. Returns nodes sorted by label
// (asc, case-insensitive) with isUnknown buckets ("(No tier)"/"(Unnamed)"/...) last.
// Each node carries a statusRollup (header chips) and a sample row (so headers can read
// tier/logo). Leaf nodes (last axis) carry `leaves`; inner nodes carry `children`.
export const buildPivotTree = (rows, axisIds) => {
  if (!axisIds.length) return [];
  const [axisId, ...rest] = axisIds;
  const axis = AXES[axisId];

  const buckets = new Map(); // key (or UNKNOWN symbol) -> { sample row, rows[] }
  rows.forEach((row) => {
    const key = axis.keyOf(row);
    const mapKey = key === null ? UNKNOWN : key;
    if (!buckets.has(mapKey)) buckets.set(mapKey, { sample: row, rows: [] });
    buckets.get(mapKey).rows.push(row);
  });

  const nodes = [...buckets.values()].map(({ sample, rows: bucketRows }) => {
    const node = {
      axisId,
      key: axis.keyOf(sample),
      label: axis.labelOf(sample),
      isUnknown: axis.isUnknown(sample),
      count: bucketRows.length,
      statusRollup: rollupOf(bucketRows),
      sample
    };
    if (rest.length) node.children = buildPivotTree(bucketRows, rest);
    else node.leaves = bucketRows;
    return node;
  });

  // Unknown buckets last; otherwise label asc, case-insensitive.
  nodes.sort((a, b) => {
    if (a.isUnknown !== b.isUnknown) return a.isUnknown ? 1 : -1;
    return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
  });
  return nodes;
};
