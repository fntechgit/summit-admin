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
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import T from "i18n-react/dist/i18n-react";
import {
  amountFromCents,
  currencyAmountFromCents
} from "openstack-uicore-foundation/lib/utils/money";
import history from "../../../history";
import { PER_PAGE_OPTIONS } from "./LinesManifestView";

const STAGE_ORDER = ["open", "paying_by_card", "invoiced", "processing"];

export const STAGE_TONE = {
  open: "default",
  paying_by_card: "primary",
  invoiced: "warning",
  processing: "info"
};

const t = (key, params) => T.translate(`sponsor_reports_page.${key}`, params);

const entryKeyOf = (row) =>
  row.stage === "open" ? `cart-${row.cart_id}` : `order-${row.purchase_id}`;

const entryLabelOf = (entry) =>
  entry.stage === "open" ? String(entry.cartId) : String(entry.purchaseNumber);

// Rows → sponsor groups → entries (one open cart, or one order) → forms.
// Bucketed by sponsor_id / cart-or-order id, never by name or adjacency: the
// backend orders by sponsor name, which is not unique. Rows are de-duplicated
// by id because pages are fetched separately and a live cart can shift a row
// onto two pages.
export const groupUnpaidCharges = (rows = []) => {
  const seen = new Set();
  const sponsorMap = new Map();
  rows.forEach((row) => {
    if (seen.has(row.id)) return;
    seen.add(row.id);
    if (!sponsorMap.has(row.sponsor_id)) {
      sponsorMap.set(row.sponsor_id, {
        sponsorId: row.sponsor_id,
        sponsorName: row.sponsor_name || "",
        entryMap: new Map()
      });
    }
    const { entryMap } = sponsorMap.get(row.sponsor_id);
    const key = entryKeyOf(row);
    if (!entryMap.has(key)) {
      entryMap.set(key, {
        key,
        stage: row.stage,
        sponsorId: row.sponsor_id,
        cartId: row.cart_id,
        purchaseId: row.purchase_id,
        purchaseNumber: row.purchase_number,
        total: 0,
        missingCount: 0,
        formCodes: [],
        forms: []
      });
    }
    const entry = entryMap.get(key);
    if (row.pricing_error) {
      entry.missingCount += 1;
    } else if (row.total != null) {
      entry.total += row.total;
    }
    entry.formCodes.push(row.form_code);
    entry.forms.push(row);
  });

  return [...sponsorMap.values()].map((g) => {
    const entries = [...g.entryMap.values()].sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
        entryLabelOf(a).localeCompare(entryLabelOf(b), undefined, {
          numeric: true
        })
    );
    const stageCounts = {};
    entries.forEach((e) => {
      stageCounts[e.stage] = (stageCounts[e.stage] || 0) + 1;
    });
    return {
      sponsorId: g.sponsorId,
      sponsorName: g.sponsorName,
      total: entries.reduce((acc, e) => acc + e.total, 0),
      missingCount: entries.reduce((acc, e) => acc + e.missingCount, 0),
      stageCounts,
      entries
    };
  });
};

// Unnamed sponsors sort last under both orders, matching the card title
// fallback ("Unknown sponsor") that they render with.
export const sortGroups = (groups, sort) => {
  const byName = (a, b) => {
    if (!a.sponsorName !== !b.sponsorName) return a.sponsorName ? -1 : 1;
    return a.sponsorName
      .toLowerCase()
      .localeCompare(b.sponsorName.toLowerCase());
  };
  const byId = (a, b) => a.sponsorId - b.sponsorId;
  return [...groups].sort((a, b) =>
    sort === "balance"
      ? b.total - a.total || byName(a, b) || byId(a, b)
      : byName(a, b) || byId(a, b)
  );
};

export const summarizeGroups = (groups) => {
  const sumStages = (stages) =>
    groups.reduce(
      (acc, g) =>
        acc +
        g.entries
          .filter((e) => stages.includes(e.stage))
          .reduce((a, e) => a + e.total, 0),
      0
    );
  return {
    total: groups.reduce((acc, g) => acc + g.total, 0),
    open: sumStages(["open"]),
    checkedOut: sumStages(["paying_by_card", "invoiced", "processing"]),
    sponsors: groups.length,
    missing: groups.reduce((acc, g) => acc + g.missingCount, 0)
  };
};

const allEntriesMissing = (entries) =>
  entries.every((e) => e.missingCount === e.forms.length);

const MissingLabel = () => (
  <Typography component="span" variant="body2" color="error">
    {t("unpaid_price_missing")}
  </Typography>
);

// Known sum, never a $0 stand-in for an unpriced form; "price missing" alone
// when nothing in the bucket is priced.
const Amount = ({ total, missingCount, allMissing }) => {
  if (allMissing) return <MissingLabel />;
  return (
    <>
      {currencyAmountFromCents(total)}
      {missingCount > 0 && (
        <>
          {" "}
          <MissingLabel />
        </>
      )}
    </>
  );
};

const isCartLink = (stage) => stage === "open" || stage === "paying_by_card";

const entryPath = (entry, summitId) => {
  const base = `/app/summits/${summitId}/sponsors/${entry.sponsorId}`;
  return isCartLink(entry.stage)
    ? `${base}/cart`
    : `${base}/purchases/${entry.purchaseId}`;
};

const entryLabel = (entry) =>
  entry.stage === "open"
    ? t("unpaid_cart_label", { id: entry.cartId })
    : t("unpaid_order_label", { number: entry.purchaseNumber });

const addedByLabel = (form) =>
  form.added_by_admin
    ? t("unpaid_added_by_admin")
    : t("unpaid_added_by_sponsor");

// The CSV export: one row per form, in the order the page lists them, with the
// sponsor and cart/order values the page shows repeated on every row. Totals
// follow <Amount>: "Price missing" only when nothing in the bucket is priced.
// Links are absolute because the file is opened outside show-admin.
export const buildUnpaidChargesCsvRows = (groups, summitId, origin) => {
  const csvAmount = (total, missingCount, formCount) =>
    missingCount === formCount
      ? t("unpaid_price_missing")
      : amountFromCents(total);
  const header = [
    t("unpaid_csv_sponsor"),
    t("unpaid_csv_sponsor_stages"),
    t("unpaid_csv_sponsor_missing"),
    t("unpaid_csv_sponsor_total"),
    t("unpaid_col_cart_order"),
    t("unpaid_col_stage"),
    t("unpaid_col_forms"),
    t("unpaid_csv_cart_order_total"),
    t("unpaid_csv_cart_order_missing"),
    t("unpaid_csv_link"),
    t("unpaid_col_form"),
    t("unpaid_col_code"),
    t("unpaid_col_added_by"),
    t("unpaid_csv_form_total")
  ];
  const rows = groups.flatMap((group) => {
    const stages = Object.entries(group.stageCounts)
      .map(([stage, count]) =>
        t("unpaid_stage_count", { count, stage: t(`unpaid_stage_${stage}`) })
      )
      .join("; ");
    const sponsorFormCount = group.entries.reduce(
      (acc, e) => acc + e.forms.length,
      0
    );
    const sponsorTotal = csvAmount(
      group.total,
      group.missingCount,
      sponsorFormCount
    );
    return group.entries.flatMap((entry) =>
      entry.forms.map((form) => [
        group.sponsorName || t("pivot_unknown_sponsor"),
        stages,
        group.missingCount,
        sponsorTotal,
        entryLabel(entry),
        t(`unpaid_stage_${entry.stage}`),
        entry.formCodes.join(", "),
        csvAmount(entry.total, entry.missingCount, entry.forms.length),
        entry.missingCount,
        `${origin}${entryPath(entry, summitId)}`,
        form.form_name,
        form.form_code,
        addedByLabel(form),
        form.pricing_error || form.total == null
          ? t("unpaid_price_missing")
          : amountFromCents(form.total)
      ])
    );
  });
  return [header, ...rows];
};

const EntryRow = ({ entry, summitId, expanded, onToggle }) => {
  const open = () => history.push(entryPath(entry, summitId));
  return (
    <>
      <TableRow
        hover
        onClick={() => onToggle(entry.key)}
        sx={{ cursor: "pointer" }}
      >
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            aria-label={t("unpaid_show_forms")}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(entry.key);
            }}
          >
            {expanded ? (
              <KeyboardArrowUpIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>
        <TableCell>{entryLabel(entry)}</TableCell>
        <TableCell>
          <Chip
            size="small"
            color={STAGE_TONE[entry.stage]}
            label={t(`unpaid_stage_${entry.stage}`)}
          />
        </TableCell>
        <TableCell>{entry.formCodes.join(", ")}</TableCell>
        <TableCell align="right">
          <Amount
            total={entry.total}
            missingCount={entry.missingCount}
            allMissing={entry.missingCount === entry.forms.length}
          />
        </TableCell>
        <TableCell align="right">
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            {isCartLink(entry.stage)
              ? t("unpaid_open_cart")
              : t("unpaid_open_order")}
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} sx={{ bgcolor: "grey.50", py: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("unpaid_col_form")}</TableCell>
                  <TableCell>{t("unpaid_col_code")}</TableCell>
                  <TableCell>{t("unpaid_col_added_by")}</TableCell>
                  <TableCell align="right">{t("unpaid_col_total")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entry.forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>{form.form_name}</TableCell>
                    <TableCell>{form.form_code}</TableCell>
                    <TableCell>{addedByLabel(form)}</TableCell>
                    <TableCell align="right">
                      {form.pricing_error || form.total == null ? (
                        <MissingLabel />
                      ) : (
                        currencyAmountFromCents(form.total)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const UnpaidChargesBySponsor = ({
  groups = [],
  summitId,
  currentPage,
  perPage,
  onPageChange,
  onPerPageChange
}) => {
  const [expandedSponsors, setExpandedSponsors] = useState(() => new Set());
  const [expandedEntries, setExpandedEntries] = useState(() => new Set());

  const lastPage = Math.max(1, Math.ceil(groups.length / perPage));
  const displayPage = Math.min(currentPage, lastPage);
  const paged = groups.slice(
    (displayPage - 1) * perPage,
    displayPage * perPage
  );

  const toggle = (setter) => (key) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  const toggleSponsor = toggle(setExpandedSponsors);
  const toggleEntry = toggle(setExpandedEntries);

  const expandAll = () =>
    setExpandedSponsors((prev) => {
      const next = new Set(prev);
      paged.forEach((g) => next.add(g.sponsorId));
      return next;
    });
  // Sponsors start collapsed, so the default view means everything closed.
  const collapseAll = () => {
    setExpandedSponsors(new Set());
    setExpandedEntries(new Set());
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button size="small" onClick={expandAll}>
          {t("byitem_expand_all")}
        </Button>
        <Button size="small" onClick={collapseAll}>
          {t("byitem_collapse_all")}
        </Button>
      </Box>
      {paged.map((group) => (
        <Accordion
          key={group.sponsorId}
          expanded={expandedSponsors.has(group.sponsorId)}
          onChange={() => toggleSponsor(group.sponsorId)}
          TransitionProps={{ unmountOnExit: true }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>
              {group.sponsorName || t("pivot_unknown_sponsor")}
            </Typography>
            {Object.entries(group.stageCounts).map(([stage, count]) => (
              <Chip
                key={stage}
                size="small"
                color={STAGE_TONE[stage]}
                sx={{ ml: 1.5 }}
                label={t("unpaid_stage_count", {
                  count,
                  stage: t(`unpaid_stage_${stage}`)
                })}
              />
            ))}
            {group.missingCount > 0 && (
              <Chip
                size="small"
                variant="outlined"
                color="error"
                sx={{ ml: 1.5 }}
                label={t("unpaid_missing_count", { count: group.missingCount })}
              />
            )}
            <Typography
              sx={{ ml: "auto", mr: 2, fontWeight: 600 }}
              component="div"
            >
              <Amount
                total={group.total}
                missingCount={group.missingCount}
                allMissing={allEntriesMissing(group.entries)}
              />
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>{t("unpaid_col_cart_order")}</TableCell>
                    <TableCell>{t("unpaid_col_stage")}</TableCell>
                    <TableCell>{t("unpaid_col_forms")}</TableCell>
                    <TableCell align="right">{t("unpaid_col_total")}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.entries.map((entry) => (
                    <EntryRow
                      key={entry.key}
                      entry={entry}
                      summitId={summitId}
                      expanded={expandedEntries.has(entry.key)}
                      onToggle={toggleEntry}
                    />
                  ))}
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
        labelRowsPerPage={t("byitem_sponsors_per_page")}
        onPageChange={(_e, zeroBased) => onPageChange(zeroBased + 1)}
        onRowsPerPageChange={(e) => onPerPageChange(Number(e.target.value))}
      />
    </Box>
  );
};

export default UnpaidChargesBySponsor;
