/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import T from "i18n-react/dist/i18n-react";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import StatusPill from "./StatusPill";
import ChipList from "../../mui/chip-list";
import { Destination, PER_PAGE_OPTIONS } from "./LinesManifestView";
import { formatCheckoutTime } from "./OrdersTable";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE
} from "../../../utils/constants";
import { isEmptyString } from "../../../utils/methods";

// Pure rollup for the Purchase Details "By Item" view: flat line rows → sponsor
// groups → per-item aggregates. Named export from the component that
// owns the concept (cf. statusTone in StatusPill) — the page imports it from
// here for its useMemo. NO data filtering: qty-0 lines and canceled lines flow
// through — the report's contract is "show everything, visually annotate".
// Bucket by sponsor.id / item_code, never adjacency: the backend orders lines by
// sponsor NAME (not unique), so two sponsor ids sharing a name can interleave.
// Symbol sentinels for the null buckets — collision-free with any real id/code
// value (cf. UNKNOWN in build-pivot-tree.js).
const NO_SPONSOR_KEY = Symbol("no_sponsor");
const NO_CODE_KEY = Symbol("no_code");

// Folds one line row into an item bucket. Shared by both layouts: "by sponsor"
// calls it with a per-sponsor map, "all sponsors" with a single show-wide map.
// The two layouts must never diverge on what counts as purchased.
const accumulateRow = (itemMap, row) => {
  const code = isEmptyString(row.item_code)
    ? null
    : String(row.item_code).trim();
  const itemKey = code === null ? NO_CODE_KEY : code;
  if (!itemMap.has(itemKey)) {
    itemMap.set(itemKey, {
      itemCode: code,
      label: "",
      qty: 0,
      lines: 0,
      totalCents: null,
      orderIds: new Set(),
      statusOrderIds: new Map(),
      contributors: []
    });
  }
  const item = itemMap.get(itemKey);
  if (isEmptyString(item.label) && !isEmptyString(row.description)) {
    item.label = row.description.trim();
  }
  item.lines += 1;
  // Canceled lines are shown struck-through in the drill-down (as contributors
  // below) but excluded from ALL "purchased" aggregates: qty, money, orders,
  // and statusMix. Counting them would let a canceled-only line report an item
  // as purchased (Qty 0 next to Orders 1 / Paid 1). A mixed order keeps its
  // count because the live line for the same item still adds the order id.
  if (!row.is_canceled) {
    item.qty += row.quantity ?? 0;
    // Null-safe money: all-null stays null (renders "—"); mixed sums non-nulls.
    if (row.line_total != null) {
      item.totalCents = (item.totalCents ?? 0) + row.line_total;
    }
    const purchaseId = row.purchase?.id ?? null;
    if (purchaseId != null) {
      item.orderIds.add(purchaseId);
      const status = row.purchase?.status ?? "";
      if (!item.statusOrderIds.has(status)) {
        item.statusOrderIds.set(status, new Set());
      }
      item.statusOrderIds.get(status).add(purchaseId);
    }
  }
  item.contributors.push({
    // Rendered only by the all-sponsors layout, where the sponsor is no longer
    // the parent row: "10 monitors to Intel, 3 to Nvidia".
    sponsorName: row.sponsor?.name ?? "",
    number: row.purchase?.number ?? "",
    formCode: row.form?.code ?? "",
    addOnName: row.add_on_name ?? null,
    sponsorBooth: row.sponsor_booth ?? null,
    checkoutAt: row.purchase?.checkout_at ?? null,
    rateName: row.rate_name ?? "",
    status: row.purchase?.status ?? "",
    qty: row.quantity ?? 0,
    lineTotalCents: row.line_total ?? null,
    isCanceled: Boolean(row.is_canceled)
  });
};

// Item buckets → sorted display rows. Drops the accumulator's Sets/Maps so no
// mutable collection reaches props.
const finalizeItems = (itemMap) => {
  const items = [...itemMap.values()].map((it) => ({
    itemCode: it.itemCode,
    label: it.label,
    qty: it.qty,
    orders: it.orderIds.size,
    lines: it.lines,
    totalCents: it.totalCents,
    statusMix: Object.fromEntries(
      [...it.statusOrderIds.entries()].map(([status, ids]) => [
        status,
        ids.size
      ])
    ),
    contributors: it.contributors
  }));
  // Canonical order: qty desc, then orders desc, label asc as a deterministic
  // tiebreak. The view sorts on top of this; because that sort is stable, this
  // ordering survives underneath as the tiebreak for equal values.
  items.sort(
    (a, b) =>
      b.qty - a.qty || b.orders - a.orders || a.label.localeCompare(b.label)
  );
  return items;
};

export const groupLinesBySponsorItem = (rows = []) => {
  const sponsorMap = new Map();
  rows.forEach((row) => {
    const sponsorId = row.sponsor?.id ?? null;
    const sponsorKey = sponsorId === null ? NO_SPONSOR_KEY : sponsorId;
    if (!sponsorMap.has(sponsorKey)) {
      sponsorMap.set(sponsorKey, {
        sponsorId,
        sponsorName: row.sponsor?.name ?? "",
        itemMap: new Map()
      });
    }
    accumulateRow(sponsorMap.get(sponsorKey).itemMap, row);
  });

  const groups = [...sponsorMap.values()].map((g) => {
    const items = finalizeItems(g.itemMap);
    return {
      sponsorId: g.sponsorId,
      sponsorName: g.sponsorName,
      items,
      totalQty: items.reduce((acc, it) => acc + it.qty, 0),
      itemCount: items.length,
      purchasedCount: items.filter((it) => it.qty > 0).length
    };
  });
  // Nothing sorts the sponsor accordions explicitly (the column headers reorder
  // items WITHIN a group), so they default to alphabetical, unknown bucket last.
  // That test keys on the NAME, not sponsorId, because the card title renders as
  // `sponsorName || "Unknown sponsor"` — sorting on what the card displays keeps
  // every "Unknown sponsor" card together at the end. (The pivot tree keys on
  // the id instead, which splits them: a blank-named sponsor shows the unknown
  // label but sorts first.) This also decides which sponsors land on which
  // client-side page.
  groups.sort((a, b) => {
    if (!a.sponsorName !== !b.sponsorName) return a.sponsorName ? -1 : 1;
    return a.sponsorName
      .toLowerCase()
      .localeCompare(b.sponsorName.toLowerCase());
  });
  return groups;
};

// Show-wide rollup: one row per item_code across every sponsor — the warehouse
// pull sheet ("how many 43\" monitors for this show"). Same item aggregate as
// the by-sponsor layout, with the sponsor level removed; each contributing
// order carries its sponsor so the drill-down answers where they go. Reports
// are always summit-scoped (route + queryset), so "the show" needs no filter.
export const groupLinesByItem = (rows = []) => {
  const itemMap = new Map();
  rows.forEach((row) => accumulateRow(itemMap, row));
  return finalizeItems(itemMap);
};

// sortKey names the DERIVED item-row field, not an API ordering field — this
// rollup has no server-side sort. Columns without one are not sortable.
const ITEM_HEADERS = [
  { key: "col_item_code", sortKey: "itemCode" },
  { key: "col_item_name", sortKey: "label" },
  { key: "col_quantity", align: "right", sortKey: "qty" },
  { key: "byitem_col_orders", align: "right", sortKey: "orders" },
  { key: "byitem_col_total", align: "right" },
  { key: "col_status" }
];

// orderDir is the repo's numeric 1 / -1 (MuiTable contract), MUI wants a word.
const DIRECTION = { 1: "asc", "-1": "desc" };

const SORT_ACCESSORS = {
  // Null code (the no-code bucket, rendered "—") sorts as empty: first ascending.
  itemCode: (it) => it.itemCode ?? "",
  label: (it) => it.label,
  qty: (it) => it.qty,
  orders: (it) => it.orders
};

// Re-sorts already-canonical rows (finalizeItems emits qty↓, orders↓, label↑).
// Array.prototype.sort is stable, so ties keep that canonical order instead of
// landing arbitrarily — no explicit tiebreak needed here. Unknown key = no-op.
export const sortItems = (items, order, orderDir) => {
  const pick = SORT_ACCESSORS[order];
  if (!pick) return items;
  return [...items].sort((a, b) => {
    const left = pick(a);
    const right = pick(b);
    const cmp =
      typeof left === "number" ? left - right : left.localeCompare(right);
    return orderDir === 1 ? cmp : -cmp;
  });
};

const CONTRIB_HEADERS = [
  { key: "col_order" },
  { key: "col_form_code" },
  { key: "col_destination" },
  { key: "col_checkout_at" },
  { key: "col_used_rate" },
  { key: "col_status" },
  { key: "col_quantity", align: "right" },
  { key: "col_line_total", align: "right" }
];

// One expansion key per (sponsor, item) so the same item code under two
// sponsors drills down independently. JSON-encoded so null buckets can never
// collide with a real string code.
const itemKey = (group, item) =>
  JSON.stringify([group.sponsorId ?? null, item.itemCode ?? null]);

// The group container BOTH layouts render: an accordion whose summary carries
// the title, the items chip and the Σ qty. One component, not two call sites, so
// the card surface, summary divider and AccordionDetails inset stay identical
// between the layouts instead of being matched by hand.
const ItemGroup = ({
  title,
  itemCount,
  purchasedCount,
  totalQty,
  expanded,
  onToggle,
  children
}) => (
  <Accordion expanded={expanded} onChange={onToggle}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      <Chip
        size="small"
        sx={{ ml: 1.5 }}
        label={T.translate("sponsor_reports_page.byitem_sponsor_items_chip", {
          items: itemCount,
          purchased: purchasedCount
        })}
      />
      <Typography sx={{ ml: "auto", mr: 2, fontWeight: 600 }}>
        {T.translate("sponsor_reports_page.byitem_sum_qty", { qty: totalQty })}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

// The item table both layouts render: one row per item_code with the purchased
// aggregates, expanding to the orders that contributed. `showSponsor` adds the
// Sponsor column to the drill-down for the all-sponsors layout, where the
// sponsor is no longer carried by a parent accordion.
const ItemTable = ({
  items,
  keyFor,
  expandedItems,
  onToggle,
  order,
  orderDir,
  onSort,
  showSponsor = false
}) => {
  const contribHeaders = showSponsor
    ? [{ key: "col_sponsor" }, ...CONTRIB_HEADERS]
    : CONTRIB_HEADERS;
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            {ITEM_HEADERS.map((h) => {
              const label = T.translate(`sponsor_reports_page.${h.key}`);
              const active = order === h.sortKey;
              return (
                <TableCell
                  key={h.key}
                  align={h.align || "left"}
                  sortDirection={active ? DIRECTION[orderDir] : false}
                >
                  {h.sortKey ? (
                    <TableSortLabel
                      active={active}
                      direction={active ? DIRECTION[orderDir] : "asc"}
                      // Re-clicking the active column flips it; a new column
                      // starts from the current direction (cf. MuiInfiniteTable).
                      onClick={() => onSort(h.sortKey, orderDir * -1)}
                    >
                      {label}
                      {active ? (
                        <Box component="span" sx={visuallyHidden}>
                          {T.translate(
                            orderDir === 1
                              ? "mui_table.sorted_asc"
                              : "mui_table.sorted_desc"
                          )}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    label
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const key = keyFor(item);
            const expanded = expandedItems.has(key);
            return (
              <React.Fragment key={key}>
                <TableRow
                  hover
                  onClick={() => onToggle(key)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell padding="checkbox">
                    <IconButton
                      size="small"
                      aria-label={T.translate(
                        "sponsor_reports_page.byitem_contributing_orders"
                      )}
                      aria-expanded={expanded}
                      onClick={(e) => {
                        // Row click also toggles; don't double-fire.
                        e.stopPropagation();
                        onToggle(key);
                      }}
                    >
                      {expanded ? (
                        <KeyboardArrowUpIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowDownIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>{item.itemCode ?? "—"}</TableCell>
                  <TableCell>{item.label}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {item.qty}
                  </TableCell>
                  <TableCell align="right">{item.orders}</TableCell>
                  <TableCell align="right">
                    {item.totalCents == null
                      ? "—"
                      : currencyAmountFromCents(item.totalCents)}
                  </TableCell>
                  <TableCell>
                    <ChipList
                      chips={Object.entries(item.statusMix).map(
                        ([status, count]) => `${status}: ${count}`
                      )}
                      maxLength={Object.keys(item.statusMix).length}
                    />
                  </TableCell>
                </TableRow>
                {expanded && (
                  <TableRow>
                    <TableCell
                      colSpan={ITEM_HEADERS.length + 1}
                      sx={{ bgcolor: "grey.50", py: 1.5 }}
                    >
                      <Typography variant="overline" color="text.secondary">
                        {T.translate(
                          "sponsor_reports_page.byitem_contributing_orders"
                        )}
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {contribHeaders.map((h) => (
                              <TableCell key={h.key} align={h.align || "left"}>
                                {T.translate(`sponsor_reports_page.${h.key}`)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {item.contributors.map((c, idx) => (
                            <TableRow
                              // No stable line id in the payload; index
                              // within the item's fixed contributor list.
                              // eslint-disable-next-line react/no-array-index-key
                              key={`${c.number}-${idx}`}
                              data-canceled={c.isCanceled ? "true" : undefined}
                              sx={
                                c.isCanceled
                                  ? {
                                      opacity: 0.6,
                                      "& td": {
                                        textDecoration: "line-through"
                                      }
                                    }
                                  : undefined
                              }
                            >
                              {showSponsor && (
                                <TableCell>{c.sponsorName}</TableCell>
                              )}
                              <TableCell>{c.number}</TableCell>
                              <TableCell>{c.formCode}</TableCell>
                              <TableCell>
                                <Destination
                                  name={c.addOnName}
                                  booth={c.sponsorBooth}
                                />
                              </TableCell>
                              <TableCell>
                                {formatCheckoutTime(c.checkoutAt)}
                              </TableCell>
                              <TableCell>{c.rateName}</TableCell>
                              <TableCell>
                                <StatusPill
                                  status={c.status}
                                  label={c.status}
                                />
                              </TableCell>
                              <TableCell align="right">{c.qty}</TableCell>
                              <TableCell align="right">
                                {c.lineTotalCents == null
                                  ? "—"
                                  : currencyAmountFromCents(c.lineTotalCents)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// The all-sponsors layout is a single group; by-sponsor keys on the sponsor id.
const ALL_SPONSORS_GROUP_KEY = "__all__";
const groupKeyOf = (group) => group.sponsorId ?? "__null__";

// Expansion key for the all-sponsors layout. Distinct first element so a
// show-wide item can never collide with a by-sponsor key whose sponsor id is
// null (the unknown-sponsor bucket).
const allItemKey = (item) => JSON.stringify(["all", item.itemCode ?? null]);

// Rollup of the whole-set By Item data, in two layouts over the same rows:
//   "sponsor" — sponsor accordions → item table (who ordered what)
//   "item"    — one row per item across every sponsor (what to pull for the
//               show), drilling down to which sponsor/destination each goes to
// Pagination is CLIENT-side over whichever list the active layout shows; the
// parent owns page/perPage (redux) — this component only clamps the display
// when that list shrinks under the current page.
const ByItemView = ({
  groups = [],
  items = [],
  layout = "sponsor",
  onLayoutChange,
  order,
  orderDir,
  onSort,
  currentPage = DEFAULT_CURRENT_PAGE,
  perPage = DEFAULT_PER_PAGE,
  onPageChange,
  onPerPageChange
}) => {
  const [expandedItems, setExpandedItems] = useState(() => new Set());
  // Groups are expanded by default, so track the COLLAPSED ones — an empty set
  // is the initial state either way, and new groups arrive expanded.
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const byItem = layout === "item";
  // Sort BEFORE paging: the all-sponsors layout pages over items, so sorting
  // has to decide which items land on the page, not just their order within it.
  const sortedItems = byItem ? sortItems(items, order, orderDir) : items;
  const list = byItem ? sortedItems : groups;
  const lastPage = Math.max(1, Math.ceil(list.length / perPage));
  const displayPage = Math.min(currentPage, lastPage);
  const paged = list.slice((displayPage - 1) * perPage, displayPage * perPage);
  // Σ over the WHOLE item list, not the page: the pull total is the point.
  const totalQty = items.reduce((acc, it) => acc + it.qty, 0);
  const purchasedCount = items.filter((it) => it.qty > 0).length;

  const toggleItem = (key) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Expand/collapse everything expandable: the group accordion(s) AND every
  // item's contributing-orders drill-down. Keys cover the WHOLE list, not just
  // the current page, so paging forward keeps the state you asked for.
  const allItemKeys = () =>
    byItem
      ? sortedItems.map(allItemKey)
      : groups.flatMap((group) =>
          group.items.map((item) => itemKey(group, item))
        );

  const expandAll = () => {
    setCollapsedGroups(new Set());
    setExpandedItems(new Set(allItemKeys()));
  };

  // Collapse All closes the DRILL-DOWNS only, landing you back on the default
  // view — item rows visible inside their groups. Collapsing the groups too
  // overshoots it: you get a wall of sponsor headers and no data. Group state is
  // left untouched rather than reset, so a group you closed by hand stays closed.
  const collapseAll = () => setExpandedItems(new Set());

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1
        }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={layout}
          onChange={(_e, next) => {
            // MUI passes null when the active button is re-clicked in exclusive
            // mode; ignore it so a layout is always selected (cf.
            // ReportViewToggle).
            if (next) onLayoutChange(next);
          }}
          aria-label={T.translate("sponsor_reports_page.group_by")}
        >
          <ToggleButton value="sponsor">
            {T.translate("sponsor_reports_page.byitem_layout_sponsor")}
          </ToggleButton>
          <ToggleButton value="item">
            {T.translate("sponsor_reports_page.byitem_layout_all_sponsors")}
          </ToggleButton>
        </ToggleButtonGroup>
        <Box>
          <Button size="small" onClick={expandAll}>
            {T.translate("sponsor_reports_page.byitem_expand_all")}
          </Button>
          <Button size="small" onClick={collapseAll}>
            {T.translate("sponsor_reports_page.byitem_collapse_all")}
          </Button>
        </Box>
      </Box>
      {byItem && (
        <ItemGroup
          title={T.translate("sponsor_reports_page.byitem_layout_all_sponsors")}
          itemCount={items.length}
          purchasedCount={purchasedCount}
          totalQty={totalQty}
          expanded={!collapsedGroups.has(ALL_SPONSORS_GROUP_KEY)}
          onToggle={() => toggleGroup(ALL_SPONSORS_GROUP_KEY)}
        >
          <ItemTable
            items={paged}
            keyFor={allItemKey}
            expandedItems={expandedItems}
            onToggle={toggleItem}
            order={order}
            orderDir={orderDir}
            onSort={onSort}
            showSponsor
          />
        </ItemGroup>
      )}
      {!byItem &&
        paged.map((group) => (
          <ItemGroup
            key={groupKeyOf(group)}
            expanded={!collapsedGroups.has(groupKeyOf(group))}
            onToggle={() => toggleGroup(groupKeyOf(group))}
            title={
              group.sponsorName ||
              T.translate("sponsor_reports_page.pivot_unknown_sponsor")
            }
            itemCount={group.itemCount}
            purchasedCount={group.purchasedCount}
            totalQty={group.totalQty}
          >
            <ItemTable
              // Sorting reorders items WITHIN each sponsor; the sponsor
              // accordions stay alphabetical.
              items={sortItems(group.items, order, orderDir)}
              keyFor={(item) => itemKey(group, item)}
              expandedItems={expandedItems}
              onToggle={toggleItem}
              order={order}
              orderDir={orderDir}
              onSort={onSort}
            />
          </ItemGroup>
        ))}
      <TablePagination
        component="div"
        count={list.length}
        page={displayPage - 1}
        rowsPerPage={perPage}
        rowsPerPageOptions={PER_PAGE_OPTIONS}
        labelRowsPerPage={T.translate(
          byItem
            ? "sponsor_reports_page.byitem_items_per_page"
            : "sponsor_reports_page.byitem_sponsors_per_page"
        )}
        onPageChange={(_e, zeroBased) => onPageChange(zeroBased + 1)}
        onRowsPerPageChange={(e) => onPerPageChange(Number(e.target.value))}
      />
    </Box>
  );
};

export default ByItemView;
