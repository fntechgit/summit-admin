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
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import StatusPill from "./StatusPill";
import { formatUsd } from "../../../utils/reports-money";

// Backend `order=` key map. Keys are the MuiTable columnKey values (= backend
// order keys) for sortable columns. Non-sortable columns (form_display,
// sponsor_note) are intentionally absent — toOrderParam ignores them.
export const SORT_FIELD_MAP = {
  number: "number",
  order_date: "order_date",
  sponsor: "sponsor",
  status: "status",
  invoice_total: "invoice_total"
};

const ISO_DATE_LENGTH = 10; // "YYYY-MM-DD"
const MS_PER_SECOND = 1000;
const NOON = 12;

// Port of OrdersGrid.js formatCheckoutTime — handles BOTH the current ISO
// checkout_at (DRF DateTimeField on backend main) AND a future epoch int
// (pending ClickUp 86bagnfmn).  Parses date/time directly off the ISO string
// parts so the displayed time always matches the stored UTC value and tests
// stay timezone-stable regardless of the machine's local TZ offset.
export const formatCheckoutTime = (value) => {
  if (value == null || value === "") return "";
  const iso =
    typeof value === "number" || /^\d+$/.test(value)
      ? new Date(Number(value) * MS_PER_SECOND).toISOString()
      : String(value);
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso.slice(0, ISO_DATE_LENGTH);
  const [, date, hh, mm] = m;
  const hour24 = Number(hh);
  const ampm = hour24 >= NOON ? "PM" : "AM";
  const hour12 = hour24 % NOON || NOON;
  return `${date} ${hour12}:${mm} ${ampm}`;
};

// MuiTable keys rows on row.id; the API exposes purchase_id, not id.
// The page must call rows.map(r => ({ ...r, id: r.purchase_id })) before
// passing data, or use this helper for explicit mapping.
export const getOrderRowId = (row) => row.purchase_id;

// Converts MuiTable sort state to the `order` query param expected by the API.
// MuiTable calls onSort(columnKey, dir) where dir = 1 (asc) | -1 (desc).
// Since columnKey IS the backend key for sortable columns, no extra translation
// is needed — the page passes (key, dir) directly to buildReportQuery's `order`.
export const toOrderParam = (columnKey, dir) => {
  if (!columnKey) return undefined;
  return dir === -1 ? `-${columnKey}` : columnKey;
};

// MuiTable column definitions.
// columnKey for sortable columns equals the backend `order=` parameter so
// onSort(columnKey, dir) → toOrderParam(columnKey, dir) yields the correct string
// without any additional translation in the page handler.
// Non-sortable columns (Type, Sponsor Note) use arbitrary unique keys.
const columns = [
  {
    columnKey: "number",
    header: "Order #",
    sortable: true,
    render: (row) => row.purchase_number
  },
  {
    columnKey: "sponsor",
    header: "Sponsor",
    sortable: true,
    render: (row) => row.sponsor?.name ?? ""
  },
  {
    columnKey: "order_date",
    header: "Checkout Time",
    sortable: true,
    // render reads checkout_at (ISO or epoch) via the shared helper.
    render: (row) => formatCheckoutTime(row.checkout_at)
  },
  {
    columnKey: "form_display",
    header: "Type",
    sortable: false, // not a backend ordering field
    render: (row) => row.form?.display ?? ""
  },
  {
    columnKey: "status",
    header: "Status",
    sortable: true,
    render: (row) => <StatusPill status={row.status} label={row.status} />
  },
  {
    columnKey: "invoice_total",
    header: "Invoice Total",
    sortable: true,
    align: "right",
    render: (row) => formatUsd(row.invoice_total)
  },
  {
    columnKey: "sponsor_note",
    header: "Sponsor Note",
    sortable: false // not a backend ordering field
    // No render — MuiTable fallback reads row["sponsor_note"] directly.
  }
];

// eslint-disable-next-line no-magic-numbers
const DEFAULT_PER_PAGE = 10;

// Props mirror the MuiTable contract used by show-purchase-list-page.
// rows must be raw API rows (purchase_id present); id mapping is done here.
const OrdersTable = ({
  rows = [],
  totalRows = 0,
  currentPage = 1,
  perPage = DEFAULT_PER_PAGE,
  order = null,
  orderDir = 1,
  onPageChange,
  onPerPageChange,
  onSort
}) => (
  <MuiTable
    columns={columns}
    // MuiTable keys rows on row.id; map purchase_id → id before passing.
    data={rows.map((row) => ({ ...row, id: row.purchase_id }))}
    options={{ sortCol: order, sortDir: orderDir }}
    totalRows={totalRows}
    currentPage={currentPage}
    perPage={perPage}
    onPageChange={onPageChange}
    onPerPageChange={onPerPageChange}
    onSort={onSort}
  />
);

export default OrdersTable;
