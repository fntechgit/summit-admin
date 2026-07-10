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

const PER_PAGE_OPTIONS = [
  DEFAULT_PER_PAGE,
  TWENTY_PER_PAGE,
  FIFTY_PER_PAGE,
  MAX_PER_PAGE
];

// Destination = the line's add-on (e.g. "Meeting Room T"); when absent, the
// logistics convention is the sponsor's booth. The booth NUMBER ships with
// slice #1 — until then show a muted "Booth" placeholder.
const Destination = ({ name }) =>
  name ? (
    <>{name}</>
  ) : (
    <Typography component="span" variant="body2" color="text.disabled">
      {T.translate("sponsor_reports_page.destination_booth_fallback")}
    </Typography>
  );

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
        lines: []
      });
    }
    groups[indexByKey.get(key)].lines.push(row);
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
  { key: "col_line_total", align: "right" }
];

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
                count: group.lines.length
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
                        <Destination name={line.add_on_name} />
                      </TableCell>
                      <TableCell>
                        {formatCheckoutTime(line.purchase?.checkout_at)}
                      </TableCell>
                      <TableCell>{line.notes}</TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      <TableCell>{line.rate_name}</TableCell>
                      <TableCell>
                        <StatusPill
                          status={line.purchase?.status}
                          label={line.purchase?.status}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {line.line_total == null
                          ? "—"
                          : currencyAmountFromCents(line.line_total)}
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
