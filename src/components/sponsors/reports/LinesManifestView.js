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

import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
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
import T from "i18n-react/dist/i18n-react";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import StatusPill from "./StatusPill";
import { formatCheckoutTime } from "./OrdersTable";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE,
  FIFTY_PER_PAGE,
  MAX_PER_PAGE,
  TWENTY_PER_PAGE
} from "../../../utils/constants";

// Shared with ByItemView (single source for the report views' page-size list,
// cf. STATUS_KEYS in build-pivot-tree).
export const PER_PAGE_OPTIONS = [
  DEFAULT_PER_PAGE,
  TWENTY_PER_PAGE,
  FIFTY_PER_PAGE,
  MAX_PER_PAGE
];

// Clamped: legacy lines can have quantity 0, canceled_quantity 1.
// ByItemView imports from here, never the reverse (cycle).
export const liveQuantity = (row) => {
  if (row?.is_canceled) return 0;
  return Math.max(0, (row?.quantity ?? 0) - (row?.canceled_quantity ?? 0));
};

// Never prorate line_total — partial events charge floor unit price.
export const liveAmountCents = (row) => {
  if (row?.line_total == null) return null;
  if (row.is_canceled) return 0;
  return Math.max(0, row.line_total - (row.canceled_amount ?? 0));
};

// Destination = the line's add-on (e.g. "Meeting Room T"); when absent, the
// logistics convention is the sponsor's booth — the API supplies it as
// `sponsor_booth` (the sponsor's Booth-type add-on name(s)). The muted "Booth"
// placeholder remains only for sponsors with no booth add-on on file.
// `name || booth`, not ??: an empty-string add-on falls through to the booth,
// matching the backend CSV's `or` precedence.
export const Destination = ({ name, booth }) => {
  const label = name || booth;
  return label ? (
    <>{label}</>
  ) : (
    <Typography component="span" variant="body2" color="text.disabled">
      {T.translate("sponsor_reports_page.destination_booth_fallback")}
    </Typography>
  );
};

// Buckets flat per-line rows into sponsor groups, preserving first-seen order.
//
// Do NOT rely on row adjacency: the backend orders lines by sponsor NAME
// (purchase__sponsor__name) and dim_sponsor.name is not unique, so two distinct
// sponsor ids sharing a name can interleave by date. Bucketing by sponsor.id
// keeps each sponsor's lines in a single group regardless of row order.
const bucketLinesBySponsor = (rows = []) => {
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
        lines: [],
        // Canceled lines still RENDER (struck through) but must not be counted —
        // the chip means live lines, matching the By Item units chip on the same
        // screen, which already excludes them.
        liveLineCount: 0
      });
    }
    const group = groups[indexByKey.get(key)];
    group.lines.push(row);
    if (!row.is_canceled) group.liveLineCount += 1;
  });
  return groups;
};

const HEADERS = [
  { key: "col_order" },
  { key: "col_form_code" },
  { key: "col_item_code" },
  { key: "col_item_name" },
  { key: "col_destination" },
  { key: "col_checkout_at" },
  { key: "col_notes" },
  { key: "col_quantity", align: "right" },
  { key: "col_used_rate" },
  { key: "col_status" },
  { key: "col_line_total", align: "right" },
  { key: "col_synced_at" },
  { key: "col_source_updated" }
];

// Both cancellation states leave the parent order Paid, so purchase.status lies.
export const lineStatus = (row) => {
  if (row?.is_canceled) return "Canceled";
  if (row?.is_partially_canceled) return "partially_canceled";
  return row?.purchase?.status ?? "";
};

const LABEL_KEY_BY_LINE_STATUS = {
  Canceled: "sponsor_reports_page.status_canceled",
  partially_canceled: "sponsor_reports_page.status_partially_canceled"
};

// Live over charged, matching the Qty cell. Finance reads this column and this is
// the only per-line money surface, so netting alone would drop the charged figure.
const lineTotalLabel = (row) =>
  row.is_partially_canceled
    ? `${currencyAmountFromCents(
        liveAmountCents(row)
      )} / ${currencyAmountFromCents(row.line_total)}`
    : currencyAmountFromCents(row.line_total);

// Not redundant with the strikethrough, which no CSV export carries.
export const LineStatusPill = ({ status }) => {
  const labelKey = LABEL_KEY_BY_LINE_STATUS[status];
  return (
    <StatusPill
      status={status}
      label={labelKey ? T.translate(labelKey) : status}
    />
  );
};

const LinesManifestView = ({
  rows = [],
  total = 0,
  currentPage = DEFAULT_CURRENT_PAGE,
  perPage = FIFTY_PER_PAGE,
  onPageChange,
  onPerPageChange
}) => {
  const groups = bucketLinesBySponsor(rows);
  return (
    <Box>
      {groups.map((group) => (
        <Accordion key={group.sponsorId ?? "__null__"} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>
              {group.sponsorName}
            </Typography>
            <Chip
              size="small"
              sx={{ ml: 1.5 }}
              label={T.translate("sponsor_reports_page.lines_count", {
                count: group.liveLineCount
              })}
            />
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {HEADERS.map((h) => (
                      <TableCell key={h.key} align={h.align || "left"}>
                        {T.translate(`sponsor_reports_page.${h.key}`)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.lines.map((line, idx) => (
                    // No backend line id; purchase.id repeats per line, so a
                    // composite key (with the in-group index) is needed.
                    <TableRow
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${line.purchase?.id}-${
                        line.item_code ?? "na"
                      }-${idx}`}
                      data-canceled={line.is_canceled ? "true" : undefined}
                      sx={
                        line.is_canceled
                          ? {
                              opacity: 0.6,
                              "& td": { textDecoration: "line-through" }
                            }
                          : undefined
                      }
                    >
                      <TableCell>{line.purchase?.number}</TableCell>
                      <TableCell>{line.form?.code}</TableCell>
                      <TableCell>{line.item_code}</TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell>
                        <Destination
                          name={line.add_on_name}
                          booth={line.sponsor_booth}
                        />
                      </TableCell>
                      <TableCell>
                        {formatCheckoutTime(line.purchase?.checkout_at)}
                      </TableCell>
                      <TableCell>{line.notes}</TableCell>
                      <TableCell align="right">
                        {line.is_partially_canceled
                          ? `${liveQuantity(line)} / ${line.quantity}`
                          : line.quantity}
                      </TableCell>
                      <TableCell>{line.rate_name}</TableCell>
                      <TableCell>
                        <LineStatusPill status={lineStatus(line)} />
                      </TableCell>
                      <TableCell align="right">
                        {line.line_total == null ? "—" : lineTotalLabel(line)}
                      </TableCell>
                      <TableCell>
                        {formatCheckoutTime(line.synced_at)}
                      </TableCell>
                      <TableCell>
                        {formatCheckoutTime(line.source_updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
      <TablePagination
        component="div"
        count={total}
        page={currentPage - 1}
        rowsPerPage={perPage}
        rowsPerPageOptions={PER_PAGE_OPTIONS}
        onPageChange={(_e, zeroBased) => onPageChange(zeroBased + 1)}
        onRowsPerPageChange={(e) => onPerPageChange(Number(e.target.value))}
      />
    </Box>
  );
};

export default LinesManifestView;
