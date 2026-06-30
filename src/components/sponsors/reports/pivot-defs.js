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
    labelOf: (r) =>
      blank(r.module?.component_name) ? "(Unnamed)" : r.module.component_name,
    isUnknown: (r) => blank(r.module?.component_name)
  }
};

export const axisKeyOf = (axisId, row) => AXES[axisId].keyOf(row);
export const axisLabelOf = (axisId, row) => AXES[axisId].labelOf(row);

export const PIVOTS = [
  {
    key: "sponsor_page_component",
    label: "Sponsor → Page → Component",
    axes: ["sponsor", "page", "component"]
  },
  {
    key: "page_component_sponsor",
    label: "Page → Component → Sponsor",
    axes: ["page", "component", "sponsor"]
  },
  {
    key: "page_sponsor_component",
    label: "Page → Sponsor → Component",
    axes: ["page", "sponsor", "component"]
  },
  {
    key: "component_sponsor",
    label: "Component → Sponsor",
    axes: ["component", "sponsor"]
  },
  {
    key: "tier_sponsor_page_component",
    label: "Tier → Sponsor → Page → Component",
    axes: ["tier", "sponsor", "page", "component"]
  }
];
