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

import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Snackbar,
  TextField
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { formatUsd } from "../reports-money";
import { buildPurchaseQuery, buildPurchaseLinesQuery } from "../report-query";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import SummaryPanel from "../../../../components/sponsors/reports/SummaryPanel";
import FilterBar from "../../../../components/sponsors/reports/FilterBar";
import OrdersTable from "../../../../components/sponsors/reports/OrdersTable";
import LinesManifestView from "../../../../components/sponsors/reports/LinesManifestView";
import ReportViewToggle from "../../../../components/sponsors/reports/ReportViewToggle";
import usePrint from "../../../../hooks/usePrint";
import {
  getPurchaseDetailsReport,
  getPurchaseDetailsLinesReport,
  getPurchaseDetailsFilters,
  clearPurchaseDetailsValidation,
  exportPurchaseDetailsCsv,
  exportPurchaseDetailsLinesCsv
} from "../../../../actions/sponsor-reports-actions";
import { DEFAULT_PER_PAGE } from "../../../../utils/constants";

const LINES_DEFAULT_PAGE_SIZE = 50;
const TOAST_AUTO_HIDE_MS = 6000;

const PurchaseDetailsReportPage = ({
  // From mapStateToProps
  data,
  summary,
  filterOptions,
  total,
  readError,
  validationError,
  // Lines slice (per-line manifest view)
  linesData,
  linesSummary,
  linesTotal,
  linesReadError,
  // From mapDispatchToProps (object form — bound action creators)
  getPurchaseDetailsReport: fetchReport,
  getPurchaseDetailsLinesReport: fetchLinesReport,
  getPurchaseDetailsFilters: fetchFilters,
  clearPurchaseDetailsValidation: clearValidation,
  exportPurchaseDetailsCsv: exportOrdersCsv,
  exportPurchaseDetailsLinesCsv: exportLinesCsv
}) => {
  const print = usePrint();

  // Local pagination/sort state. MuiTable dir = 1 (asc) | -1 (desc).
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [order, setOrder] = useState(null);
  const [orderDir, setOrderDir] = useState(1);
  const [view, setView] = useState("orders");
  const [linesPage, setLinesPage] = useState(1);
  const [linesPerPage, setLinesPerPage] = useState(LINES_DEFAULT_PAGE_SIZE);

  // Build the API query from all local state. Memoized so useEffect only re-runs
  // when the query actually changes (referential stability).
  const query = useMemo(
    () =>
      buildPurchaseQuery(filters, {
        page: currentPage,
        perPage,
        order,
        orderDir
      }),
    [filters, currentPage, perPage, order, orderDir]
  );

  // Lines query: same filters as Orders, but NO order param. CustomOrderingFilter
  // would replace the default sponsor-name ordering and scatter the sponsor groups,
  // so the manifest relies on the backend default ordering.
  const linesQuery = useMemo(
    () =>
      buildPurchaseLinesQuery(filters, {
        page: linesPage,
        perPage: linesPerPage
      }),
    [filters, linesPage, linesPerPage]
  );

  // Fetch filters once on mount. Summit is read from store inside the action.
  // Empty deps is intentional: fetchFilters is stable from connect() and reads
  // summit from Redux store inside the thunk.
  useEffect(() => {
    fetchFilters();
  }, []); // mount-only

  // Orders view: fetch the order-grain report when its query changes.
  useEffect(() => {
    if (view === "orders") fetchReport(query);
  }, [view, query]);

  // Line Items view: fetch the per-line feed when its query changes.
  useEffect(() => {
    if (view === "lines") fetchLinesReport(linesQuery);
  }, [view, linesQuery]);

  // ── Summary tiles ───────────────────────────────────────────────────────────
  // D9: Total Refunded tile renders ONLY when activeSummary.total_refunded != null.
  // Backend main does not yet expose it (ships in PR #24); the presence check
  // keeps the tile hidden on current main and auto-appears after PR #24 deploys.
  const activeSummary = view === "orders" ? summary : linesSummary;
  const tiles = activeSummary
    ? [
        {
          key: "total_orders",
          label: T.translate("sponsor_reports_page.total_orders"),
          value: activeSummary.total_orders
        },
        {
          key: "total_items",
          label: T.translate("sponsor_reports_page.total_items"),
          value: activeSummary.total_items
        },
        {
          key: "total_paid",
          label: T.translate("sponsor_reports_page.total_paid"),
          value: formatUsd(activeSummary.total_paid),
          tone: "success"
        },
        {
          key: "total_pending",
          label: T.translate("sponsor_reports_page.total_pending"),
          value: formatUsd(activeSummary.total_pending),
          tone: "warning"
        },
        ...(activeSummary.total_refunded != null
          ? [
              {
                key: "total_refunded",
                label: T.translate("sponsor_reports_page.total_refunded"),
                value: formatUsd(activeSummary.total_refunded)
              }
            ]
          : [])
      ]
    : [];

  // ── FilterBar handlers ──────────────────────────────────────────────────────
  // Applying/clearing a filter changes the result set → snap back to page 1.
  const handleApply = (next) => {
    setFilters(next);
    setCurrentPage(1);
    setLinesPage(1);
  };
  const handleClear = () => {
    setFilters({});
    setCurrentPage(1);
    setLinesPage(1);
  };

  // ── Sort/pagination handlers ─────────────────────────────────────────────────
  const handleSort = (columnKey, dir) => {
    setOrder(columnKey);
    setOrderDir(dir);
    setCurrentPage(1);
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };
  const handleLinesPageChange = (page) => setLinesPage(page);
  const handleLinesPerPageChange = (newPerPage) => {
    setLinesPerPage(newPerPage);
    setLinesPage(1);
  };

  // ── Extra filter controls (status / type / date range) ──────────────────────
  const statusOptions = filterOptions?.statuses || [];
  // Drop forms with no display name — they render as unpickable blank rows.
  const formOptions = (filterOptions?.forms || []).filter((f) =>
    f.name?.trim()
  );

  const extraControls = (draft, update) => (
    <>
      <TextField
        select
        size="small"
        sx={{ minWidth: 160 }}
        label={T.translate("sponsor_reports_page.filter_status")}
        value={draft.status || ""}
        onChange={(e) => update({ status: e.target.value || undefined })}
      >
        <MenuItem value="">{T.translate("sponsor_reports_page.any")}</MenuItem>
        {statusOptions.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        sx={{ minWidth: 160 }}
        label={T.translate("sponsor_reports_page.filter_form")}
        value={draft.formCode || ""}
        onChange={(e) => update({ formCode: e.target.value || undefined })}
      >
        <MenuItem value="">{T.translate("sponsor_reports_page.any")}</MenuItem>
        {formOptions.map((f) => (
          <MenuItem key={f.code} value={f.code}>
            {f.name}
          </MenuItem>
        ))}
      </TextField>
      {/* Date inputs emit ISO YYYY-MM-DD — expanded to ISO datetimes in buildQuery */}
      <TextField
        type="date"
        size="small"
        label={T.translate("sponsor_reports_page.filter_date_from")}
        InputLabelProps={{ shrink: true }}
        value={draft.dateFrom || ""}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
      />
      <TextField
        type="date"
        size="small"
        label={T.translate("sponsor_reports_page.filter_date_to")}
        InputLabelProps={{ shrink: true }}
        value={draft.dateTo || ""}
        onChange={(e) => update({ dateTo: e.target.value || undefined })}
      />
    </>
  );

  return (
    <ReportShell
      title={T.translate("sponsor_reports_page.purchase_details_title")}
      icon={<ShoppingCartOutlinedIcon />}
      iconTone="primary"
      subtitle={T.translate("sponsor_reports_page.purchase_details_subtitle")}
      actions={
        <>
          <ReportViewToggle value={view} onChange={setView} />
          <Button startIcon={<PrintIcon />} variant="outlined" onClick={print}>
            {T.translate("sponsor_reports_page.print")}
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() =>
              view === "orders"
                ? exportOrdersCsv(filters, order, orderDir)
                : exportLinesCsv(filters)
            }
          >
            {T.translate("sponsor_reports_page.export_csv")}
          </Button>
        </>
      }
      filterBar={
        <Box data-testid="reports-filter-bar">
          <FilterBar
            sponsors={filterOptions?.sponsors || []}
            value={filters}
            onApply={handleApply}
            onClear={handleClear}
            extraControls={extraControls}
          />
        </Box>
      }
    >
      <SummaryPanel tiles={tiles} />
      {/* 412 → inline toast; body preserved (rows stay visible) */}
      <Snackbar
        open={Boolean(validationError)}
        autoHideDuration={TOAST_AUTO_HIDE_MS}
        onClose={() => clearValidation()}
      >
        <Alert severity="error" data-testid="reports-validation-error">
          {validationError?.message ||
            T.translate("sponsor_reports_page.validation_error")}
        </Alert>
      </Snackbar>
      {(view === "orders" ? readError : linesReadError) ? (
        <Alert data-testid="reports-read-error" severity="warning">
          {(view === "orders" ? readError : linesReadError)?.message ||
            T.translate("sponsor_reports_page.read_error")}
        </Alert>
      ) : view === "orders" ? (
        <OrdersTable
          rows={data}
          totalRows={total}
          currentPage={currentPage}
          perPage={perPage}
          order={order}
          orderDir={orderDir}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
        />
      ) : (
        <LinesManifestView
          rows={linesData}
          total={linesTotal}
          currentPage={linesPage}
          perPage={linesPerPage}
          onPageChange={handleLinesPageChange}
          onPerPageChange={handleLinesPerPageChange}
        />
      )}
    </ReportShell>
  );
};

const mapStateToProps = ({
  sponsorReportsPurchaseDetailsState,
  sponsorReportsPurchaseDetailsLinesState
}) => ({
  ...sponsorReportsPurchaseDetailsState,
  linesData: sponsorReportsPurchaseDetailsLinesState.data,
  linesSummary: sponsorReportsPurchaseDetailsLinesState.summary,
  linesTotal: sponsorReportsPurchaseDetailsLinesState.total,
  linesReadError: sponsorReportsPurchaseDetailsLinesState.readError
});

const mapDispatchToProps = {
  getPurchaseDetailsReport,
  getPurchaseDetailsLinesReport,
  getPurchaseDetailsFilters,
  clearPurchaseDetailsValidation,
  exportPurchaseDetailsCsv,
  exportPurchaseDetailsLinesCsv
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(PurchaseDetailsReportPage)
);
