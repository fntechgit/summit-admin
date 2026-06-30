// Axis descriptors + the named multi-level pivots. Data, not code — adding a pivot
// is one entry in PIVOTS. Every axis key/label is derived from the flat row shape.
const blank = (v) => !v || String(v).trim() === "";

export const AXES = {
  sponsor: {
    id: "sponsor",
    keyOf: (r) => r.sponsor?.id ?? null,
    labelOf: (r) => r.sponsor?.name || "(Unknown sponsor)",
    isUnknown: (r) => r.sponsor?.id == null
  },
  tier: {
    id: "tier",
    keyOf: (r) => (blank(r.sponsor?.tier) ? null : r.sponsor.tier),
    labelOf: (r) => (blank(r.sponsor?.tier) ? "(No tier)" : r.sponsor.tier),
    isUnknown: (r) => blank(r.sponsor?.tier)
  },
  page: {
    id: "page",
    keyOf: (r) => r.page?.id ?? null,
    labelOf: (r) => r.page?.title || "(No page)",
    isUnknown: (r) => r.page?.id == null
  },
  component: {
    id: "component",
    // Normalize on trimmed lowercase so case/space variants collapse into one bucket.
    keyOf: (r) =>
      blank(r.module?.component_name)
        ? null
        : r.module.component_name.trim().toLowerCase(),
    // Trim to keep label/key in sync: " Logo " keys as "logo" and should display as "Logo".
    labelOf: (r) =>
      blank(r.module?.component_name)
        ? "(Unnamed)"
        : r.module.component_name.trim(),
    isUnknown: (r) => blank(r.module?.component_name)
  }
};

// i18n keys for unknown-bucket labels used by PivotTree to translate "(Unknown sponsor)" etc.
// The data layer (AXES.*.labelOf) returns English fallbacks so sorting stays string-based;
// the renderer overrides display for unknown nodes using these keys.
export const UNKNOWN_LABEL_KEYS = {
  sponsor: "sponsor_reports_page.pivot_unknown_sponsor",
  tier: "sponsor_reports_page.pivot_no_tier",
  page: "sponsor_reports_page.pivot_no_page",
  component: "sponsor_reports_page.pivot_unnamed_component"
};

export const PIVOTS = [
  {
    key: "sponsor_page_component",
    labelKey: "sponsor_reports_page.pivot_sponsor_page_component",
    axes: ["sponsor", "page", "component"]
  },
  {
    key: "page_component_sponsor",
    labelKey: "sponsor_reports_page.pivot_page_component_sponsor",
    axes: ["page", "component", "sponsor"]
  },
  {
    key: "page_sponsor_component",
    labelKey: "sponsor_reports_page.pivot_page_sponsor_component",
    axes: ["page", "sponsor", "component"]
  },
  {
    key: "component_sponsor",
    labelKey: "sponsor_reports_page.pivot_component_sponsor",
    axes: ["component", "sponsor"]
  },
  {
    key: "tier_sponsor_page_component",
    labelKey: "sponsor_reports_page.pivot_tier_sponsor_page_component",
    axes: ["tier", "sponsor", "page", "component"]
  }
];
