import { useMemo } from "react";
import { buildPivotTree } from "./build-pivot-tree";

// Memoized pivot tree — only rebuilds when rows/axes change, so switching the pivot
// selector or re-rendering the page doesn't re-group on every render.
export const usePivot = (rows, axisIds) =>
  useMemo(() => buildPivotTree(rows, axisIds), [rows, axisIds]);
