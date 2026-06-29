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
import moment from "moment-timezone";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE
} from "../../../utils/constants";
import StatusPill from "./StatusPill";

const ISO_DATE_LENGTH = 10; // "YYYY-MM-DD"

// Port of OrdersGrid.js formatCheckoutTime — handles BOTH the current ISO
// checkout_at (DRF DateTimeField on backend main) AND a future epoch int
// (pending ClickUp 86bagnfmn).  Parses in UTC so the displayed time always
// matches the stored UTC value and tests stay timezone-stable.
export const formatCheckoutTime = (value) => {
  if (value == null || value === "") return "";
  let m;
  if (typeof value === "number" || /^\d+$/.test(value)) {
    m = moment.unix(Number(value)).utc();
  } else {
    const s = String(value);
    if (!s.includes("T")) return s.slice(0, ISO_DATE_LENGTH);
    m = moment.utc(s);
  }
  if (!m.isValid()) return String(value).slice(0, ISO_DATE_LENGTH);
  return m.format("YYYY-MM-DD h:mm A");
};

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
    header: T.translate("sponsor_reports_page.col_order"),
    sortable: true,
    render: (row) => row.purchase_number
  },
  {
    columnKey: "sponsor",
    header: T.translate("sponsor_reports_page.col_sponsor"),
    sortable: true,
    render: (row) => row.sponsor?.name ?? ""
  },
  {
    columnKey: "order_date",
    header: T.translate("sponsor_reports_page.col_checkout_time"),
    sortable: true,
    // render reads checkout_at (ISO or epoch) via the shared helper.
    render: (row) => formatCheckoutTime(row.checkout_at)
  },
  {
    columnKey: "form_display",
    header: T.translate("sponsor_reports_page.col_type"),
    sortable: false, // not a backend ordering field
    render: (row) => row.form?.display ?? ""
  },
  {
    columnKey: "status",
    header: T.translate("sponsor_reports_page.col_status"),
    sortable: true,
    render: (row) => <StatusPill status={row.status} label={row.status} />
  },
  {
    columnKey: "invoice_total",
    header: T.translate("sponsor_reports_page.col_invoice_total"),
    sortable: true,
    align: "right",
    render: (row) =>
      row.invoice_total == null
        ? "—"
        : currencyAmountFromCents(row.invoice_total)
  },
  {
    columnKey: "sponsor_note",
    header: T.translate("sponsor_reports_page.col_sponsor_note"),
    sortable: false // not a backend ordering field
    // No render — MuiTable fallback reads row["sponsor_note"] directly.
  }
];

// Props mirror the MuiTable contract used by show-purchase-list-page.
// rows must be raw API rows (purchase_id present); id mapping is done here.
const OrdersTable = ({
  rows = [],
  totalRows = 0,
  currentPage = DEFAULT_CURRENT_PAGE,
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
