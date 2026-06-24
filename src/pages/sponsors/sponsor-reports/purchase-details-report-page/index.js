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
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { formatUsd } from "../../../../utils/reports-money";
import { buildReportQuery } from "../../../../utils/report-query";
import { getReportsApiBaseUrl } from "../../../../utils/reports-api";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import SummaryPanel from "../../../../components/sponsors/reports/SummaryPanel";
import FilterBar from "../../../../components/sponsors/reports/FilterBar";
import OrdersTable, {
  toOrderParam
} from "../../../../components/sponsors/reports/OrdersTable";
import ExportCsvButton from "../../../../components/sponsors/reports/ExportCsvButton";
import usePrint from "../../../../components/sponsors/reports/usePrint";
import {
  getPurchaseDetailsReport,
  getPurchaseDetailsFilters,
  PURCHASE_DETAILS_VALIDATION_CLEAR
} from "../../../../actions/sponsor-reports-actions";

const DEFAULT_PAGE_SIZE = 10;
const TOAST_AUTO_HIDE_MS = 6000;
const ISO_DATE_LENGTH = 10; // "YYYY-MM-DD"

const PurchaseDetailsReportPage = ({
  // From mapStateToProps
  currentSummit,
  data,
  summary,
  filterOptions,
  total,
  loading,
  readError,
  validationError,
  exportDisabled,
  // From mapDispatchToProps (function form — includes raw dispatch)
  dispatch,
  getPurchaseDetailsReport: fetchReport,
  getPurchaseDetailsFilters: fetchFilters
}) => {
  const print = usePrint();

  // Local pagination/sort state. MuiTable dir = 1 (asc) | -1 (desc).
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [order, setOrder] = useState(null);
  const [orderDir, setOrderDir] = useState(1);

  // Build the API query from all local state. Memoized so useEffect only re-runs
  // when the query actually changes (referential stability).
  const query = useMemo(() => {
    const { dateFrom, dateTo, ...rest } = filters;
    // Expand YYYY-MM-DD dates to ISO datetimes for the IsoDateTimeFilter backend field.
    // dateTo → start of the NEXT day (exclusive <) so same-day fractional-second rows
    // are included rather than dropped by a <= end-of-day bound.
    const nextDayStartIso = (ymd) => {
      const d = new Date(`${ymd}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      return `${d.toISOString().slice(0, ISO_DATE_LENGTH)}T00:00:00Z`;
    };
    return buildReportQuery({
      ...rest,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
      dateTo: dateTo ? nextDayStartIso(dateTo) : undefined,
      page: currentPage,
      perPage,
      order: toOrderParam(order, orderDir)
    });
  }, [filters, currentPage, perPage, order, orderDir]);

  // Fetch filters once on mount. Summit is read from store inside the action.
  // Empty deps is intentional: fetchFilters is stable from connect() and reads
  // summit from Redux store inside the thunk.
  useEffect(() => {
    fetchFilters();
  }, []); // mount-only

  // Fetch report data whenever the derived query object changes.
  // fetchReport reads summit from the store — only query changes drive re-fetches.
  useEffect(() => {
    fetchReport(query);
  }, [query]); // query is memoized; updates only when filters/pagination/sort change

  // ── Summary tiles ───────────────────────────────────────────────────────────
  // D9: Total Refunded tile renders ONLY when summary.total_refunded != null.
  // Backend main does not yet expose it (ships in PR #24); the presence check
  // keeps the tile hidden on current main and auto-appears after PR #24 deploys.
  const tiles = summary
    ? [
        {
          key: "total_orders",
          label: T.translate("sponsor_reports_page.total_orders"),
          value: summary.total_orders
        },
        {
          key: "total_items",
          label: T.translate("sponsor_reports_page.total_items"),
          value: summary.total_items
        },
        {
          key: "total_paid",
          label: T.translate("sponsor_reports_page.total_paid"),
          value: formatUsd(summary.total_paid),
          tone: "success"
        },
        {
          key: "total_pending",
          label: T.translate("sponsor_reports_page.total_pending"),
          value: formatUsd(summary.total_pending),
          tone: "warning"
        },
        ...(summary.total_refunded != null
          ? [
              {
                key: "total_refunded",
                label: T.translate("sponsor_reports_page.total_refunded"),
                value: formatUsd(summary.total_refunded)
              }
            ]
          : [])
      ]
    : [];

  // ── CSV export ──────────────────────────────────────────────────────────────
  const csvUrl = currentSummit
    ? `${getReportsApiBaseUrl()}/api/v1/summits/${
        currentSummit.id
      }/reports/purchase-details/csv`
    : "";
  const csvQuery = useMemo(() => {
    // Drop pagination params from the CSV query — exports the full filtered set.
    const { page: _page, per_page: _perPage, ...rest } = query;
    return rest;
  }, [query]);

  // ── FilterBar handlers ──────────────────────────────────────────────────────
  // Applying/clearing a filter changes the result set → snap back to page 1.
  const handleApply = (next) => {
    setFilters(next);
    setCurrentPage(1);
  };
  const handleClear = () => {
    setFilters({});
    setCurrentPage(1);
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
          <Button startIcon={<PrintIcon />} variant="outlined" onClick={print}>
            {T.translate("sponsor_reports_page.print")}
          </Button>
          <ExportCsvButton
            url={csvUrl}
            query={csvQuery}
            filename={`purchase-details-summit-${
              currentSummit?.id ?? "unknown"
            }.csv`}
            disabled={exportDisabled}
          />
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
        onClose={() => dispatch({ type: PURCHASE_DETAILS_VALIDATION_CLEAR })}
      >
        <Alert severity="error" data-testid="reports-validation-error">
          {validationError?.message ||
            T.translate("sponsor_reports_page.validation_error")}
        </Alert>
      </Snackbar>
      {readError ? (
        <Alert data-testid="reports-read-error" severity="warning">
          {readError.message || T.translate("sponsor_reports_page.read_error")}
        </Alert>
      ) : (
        <OrdersTable
          rows={data}
          totalRows={total}
          loading={loading}
          currentPage={currentPage}
          perPage={perPage}
          order={order}
          orderDir={orderDir}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
        />
      )}
    </ReportShell>
  );
};

const mapStateToProps = ({
  sponsorReportsPurchaseDetailsState,
  currentSummitState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...sponsorReportsPurchaseDetailsState
});

// Function form of mapDispatchToProps: injects raw dispatch (needed for the
// PURCHASE_DETAILS_VALIDATION_CLEAR action in the Snackbar handler) alongside
// the bound action creators.
const mapDispatchToProps = (dispatch) => ({
  dispatch,
  getPurchaseDetailsReport: (query) =>
    dispatch(getPurchaseDetailsReport(query)),
  getPurchaseDetailsFilters: () => dispatch(getPurchaseDetailsFilters())
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(PurchaseDetailsReportPage)
);
