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
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from "@mui/material";
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

// Pure rollup for the Purchase Details "By Item" view (Layout A): flat line rows
// → sponsor groups → per-item aggregates. Named export from the component that
// owns the concept (cf. statusTone in StatusPill) — the page imports it from
// here for its useMemo. NO data filtering: qty-0 lines and canceled lines flow
// through — the report's contract is "show everything, visually annotate".
// Bucket by sponsor.id / item_code, never adjacency: the backend orders lines by
// sponsor NAME (not unique), so two sponsor ids sharing a name can interleave.
// Symbol sentinels for the null buckets — collision-free with any real id/code
// value (cf. UNKNOWN in build-pivot-tree.js).
const NO_SPONSOR_KEY = Symbol("no_sponsor");
const NO_CODE_KEY = Symbol("no_code");

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
    const group = sponsorMap.get(sponsorKey);
    const code = isEmptyString(row.item_code)
      ? null
      : String(row.item_code).trim();
    const itemKey = code === null ? NO_CODE_KEY : code;
    if (!group.itemMap.has(itemKey)) {
      group.itemMap.set(itemKey, {
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
    const item = group.itemMap.get(itemKey);
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
  });

  const groups = [...sponsorMap.values()].map((g) => {
    const items = [...g.itemMap.values()].map((it) => ({
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
    // "Sorted by Qty ↓, then Orders"; label asc as a deterministic tiebreak.
    items.sort(
      (a, b) =>
        b.qty - a.qty || b.orders - a.orders || a.label.localeCompare(b.label)
    );
    const totalQty = items.reduce((acc, it) => acc + it.qty, 0);
    return {
      sponsorId: g.sponsorId,
      sponsorName: g.sponsorName,
      items,
      totalQty,
      itemCount: items.length,
      purchasedCount: items.filter((it) => it.qty > 0).length
    };
  });
  groups.sort(
    (a, b) =>
      b.totalQty - a.totalQty || a.sponsorName.localeCompare(b.sponsorName)
  );
  return groups;
};

const ITEM_HEADERS = [
  { key: "col_item_code" },
  { key: "col_item_name" },
  { key: "col_quantity", align: "right" },
  { key: "byitem_col_orders", align: "right" },
  { key: "byitem_col_total", align: "right" },
  { key: "col_status" }
];

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

// Rollup of the whole-set By Item data (Layout A: sponsor accordions → item
// table → contributing-orders drill-down). Pagination is CLIENT-side over the
// sponsor groups; the parent owns page/perPage (redux) — this component only
// clamps the display when the group list shrinks under the current page.
const ByItemView = ({
  groups = [],
  currentPage = DEFAULT_CURRENT_PAGE,
  perPage = DEFAULT_PER_PAGE,
  onPageChange,
  onPerPageChange
}) => {
  const [expandedItems, setExpandedItems] = useState(() => new Set());
  const lastPage = Math.max(1, Math.ceil(groups.length / perPage));
  const displayPage = Math.min(currentPage, lastPage);
  const paged = groups.slice(
    (displayPage - 1) * perPage,
    displayPage * perPage
  );

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

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textAlign: "right", mb: 1 }}
      >
        {T.translate("sponsor_reports_page.byitem_sorted_caption")}
      </Typography>
      {paged.map((group) => (
        <Accordion key={group.sponsorId ?? "__null__"} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>
              {group.sponsorName ||
                T.translate("sponsor_reports_page.pivot_unknown_sponsor")}
            </Typography>
            <Chip
              size="small"
              sx={{ ml: 1.5 }}
              label={T.translate(
                "sponsor_reports_page.byitem_sponsor_items_chip",
                { items: group.itemCount, purchased: group.purchasedCount }
              )}
            />
            <Typography sx={{ ml: "auto", mr: 2, fontWeight: 600 }}>
              {T.translate("sponsor_reports_page.byitem_sum_qty", {
                qty: group.totalQty
              })}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    {ITEM_HEADERS.map((h) => (
                      <TableCell key={h.key} align={h.align || "left"}>
                        {T.translate(`sponsor_reports_page.${h.key}`)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.items.map((item) => {
                    const key = itemKey(group, item);
                    const expanded = expandedItems.has(key);
                    return (
                      <React.Fragment key={key}>
                        <TableRow
                          hover
                          onClick={() => toggleItem(key)}
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
                                toggleItem(key);
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
                              <Typography
                                variant="overline"
                                color="text.secondary"
                              >
                                {T.translate(
                                  "sponsor_reports_page.byitem_contributing_orders"
                                )}
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    {CONTRIB_HEADERS.map((h) => (
                                      <TableCell
                                        key={h.key}
                                        align={h.align || "left"}
                                      >
                                        {T.translate(
                                          `sponsor_reports_page.${h.key}`
                                        )}
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
                                      data-canceled={
                                        c.isCanceled ? "true" : undefined
                                      }
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
                                      <TableCell align="right">
                                        {c.qty}
                                      </TableCell>
                                      <TableCell align="right">
                                        {c.lineTotalCents == null
                                          ? "—"
                                          : currencyAmountFromCents(
                                              c.lineTotalCents
                                            )}
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
          </AccordionDetails>
        </Accordion>
      ))}
      <TablePagination
        component="div"
        count={groups.length}
        page={displayPage - 1}
        rowsPerPage={perPage}
        rowsPerPageOptions={PER_PAGE_OPTIONS}
        labelRowsPerPage={T.translate(
          "sponsor_reports_page.byitem_sponsors_per_page"
        )}
        onPageChange={(_e, zeroBased) => onPageChange(zeroBased + 1)}
        onRowsPerPageChange={(e) => onPerPageChange(Number(e.target.value))}
      />
    </Box>
  );
};

export default ByItemView;
