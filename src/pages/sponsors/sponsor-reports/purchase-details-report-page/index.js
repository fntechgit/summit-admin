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

import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import moment from "moment-timezone";
import T from "i18n-react/dist/i18n-react";
import { Alert, Box, Button } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import DateTimePicker from "openstack-uicore-foundation/lib/components/inputs/datetimepicker";
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
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

// Report date filters are date-only "YYYY-MM-DD" strings that the query builder
// (expandDates) expands into UTC ISO datetimes. Drive the uicore date picker in
// UTC so the on-screen date equals the stored string with no off-by-one, and
// convert the picker's moment back to "YYYY-MM-DD" at the update boundary so the
// backend query contract is untouched.
const REPORT_DATE_TZ = "UTC";
const REPORT_DATE_FORMAT = "YYYY-MM-DD";
// The uicore picker emits moment(0) (epoch) on a CLEAR, not null — treat that
// sentinel as "no date" so clearing removes the filter instead of sending
// date>=1970-01-01. This matches the house filter convention (`.unix() || null`
// in date-interval-filter.js), which likewise coalesces epoch-0 to "no date";
// the harmless side effect (a literal 1970-01-01 pick reads as cleared) is
// irrelevant for an event purchase-date filter.
const toReportDate = (value) =>
  value && moment.isMoment(value) && value.valueOf() !== 0
    ? value.format(REPORT_DATE_FORMAT)
    : undefined;
const toPickerValue = (ymd) =>
  ymd ? moment.tz(ymd, REPORT_DATE_FORMAT, REPORT_DATE_TZ) : "";

// Shallow-stable equality for the shared filter object. Used on view switch to
// decide whether the entering view can keep its own page (filters unchanged) or
// must snap back to page 1 (the carried-over filters just changed).
const sameFilters = (a, b) =>
  JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

const PurchaseDetailsReportPage = ({
  // Orders slice (spread via mapStateToProps) — pagination/sort/filter now live
  // in the reducer (recorded on REQUEST) so they survive SPA navigation.
  data,
  summary,
  filterOptions,
  total,
  currentPage,
  perPage,
  order,
  orderDir,
  filters,
  readError,
  validationError,
  // Lines slice (per-line manifest view) — its own pagination/filter.
  linesData,
  linesSummary,
  linesTotal,
  linesReadError,
  linesCurrentPage,
  linesPerPage,
  linesFilters,
  // From mapDispatchToProps (object form — bound action creators)
  getPurchaseDetailsReport: fetchReport,
  getPurchaseDetailsLinesReport: fetchLinesReport,
  getPurchaseDetailsFilters: fetchFilters,
  clearPurchaseDetailsValidation: clearValidation,
  exportPurchaseDetailsCsv: exportOrdersCsv,
  exportPurchaseDetailsLinesCsv: exportLinesCsv
}) => {
  const print = usePrint();
  const { errorMessage } = useSnackbarMessage();

  // "orders" | "lines" — a transient UI toggle (NOT server state), so it stays
  // local. Everything else is sourced from the reducer slices above.
  const [view, setView] = useState("orders");
  const prevViewRef = useRef(view);

  // Show a global snackbar toast when the backend returns a 412 validation error,
  // then clear the redux slice so the toast fires only once per error.
  useEffect(() => {
    if (validationError) {
      errorMessage(
        validationError.message ||
          T.translate("sponsor_reports_page.validation_error")
      );
      clearValidation();
    }
  }, [validationError]);

  // Fetch filter options once on mount. Summit is read from store inside the
  // thunk; empty deps is intentional (fetchFilters is stable from connect()).
  useEffect(() => {
    fetchFilters();
  }, []); // mount-only

  // Fetch the active view. Runs on mount (initial load) and on every view switch.
  // A single FilterBar is shared across both views, so the filters applied in the
  // view we're leaving are carried into the view we're entering; the entering view
  // keeps its own page when those filters are unchanged, else snaps back to page 1.
  useEffect(() => {
    const prevView = prevViewRef.current;
    prevViewRef.current = view;
    const carried = prevView === "orders" ? filters : linesFilters;
    if (view === "orders") {
      const page = sameFilters(carried, filters)
        ? currentPage
        : DEFAULT_CURRENT_PAGE;
      fetchReport(carried, { page, perPage, order, orderDir });
    } else {
      const page = sameFilters(carried, linesFilters)
        ? linesCurrentPage
        : DEFAULT_CURRENT_PAGE;
      fetchLinesReport(carried, { page, perPage: linesPerPage });
    }
  }, [view]);

  // ── Summary tiles ───────────────────────────────────────────────────────────
  // D9: Total Refunded tile renders ONLY when total_refunded != null — a defensive
  // presence check (the field is optional in the summary payload).
  const activeSummary = view === "orders" ? summary : linesSummary;
  // money: format integer CENTS via uicore; guard unexpected nulls with em dash.
  const money = (cents) =>
    cents == null ? "—" : currencyAmountFromCents(cents);
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
          value: money(activeSummary.total_paid),
          tone: "success"
        },
        {
          key: "total_pending",
          label: T.translate("sponsor_reports_page.total_pending"),
          value: money(activeSummary.total_pending),
          tone: "warning"
        },
        ...(activeSummary.total_refunded != null
          ? [
              {
                key: "total_refunded",
                label: T.translate("sponsor_reports_page.total_refunded"),
                value: money(activeSummary.total_refunded)
              }
            ]
          : [])
      ]
    : [];

  // ── FilterBar handlers ──────────────────────────────────────────────────────
  // The active view's slice filters ARE the FilterBar value; each handler reads
  // the current slice values from props and calls the thunk with the one changed
  // axis (the thunk re-dispatches REQUEST, which re-records the slice state).
  // Applying/clearing a filter changes the result set → snap back to page 1.
  const handleApply = (next) => {
    if (view === "orders") {
      fetchReport(next, {
        page: DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      });
    } else {
      fetchLinesReport(next, {
        page: DEFAULT_CURRENT_PAGE,
        perPage: linesPerPage
      });
    }
  };
  const handleClear = () => handleApply({});

  // ── Orders sort/pagination handlers ──────────────────────────────────────────
  const handleSort = (columnKey, dir) => {
    fetchReport(filters, {
      page: DEFAULT_CURRENT_PAGE,
      perPage,
      order: columnKey,
      orderDir: dir
    });
  };
  const handlePageChange = (page) => {
    fetchReport(filters, { page, perPage, order, orderDir });
  };
  const handlePerPageChange = (newPerPage) => {
    fetchReport(filters, {
      page: DEFAULT_CURRENT_PAGE,
      perPage: newPerPage,
      order,
      orderDir
    });
  };

  // ── Lines pagination handlers (no sort — manifest keeps backend ordering) ────
  const handleLinesPageChange = (page) => {
    fetchLinesReport(linesFilters, { page, perPage: linesPerPage });
  };
  const handleLinesPerPageChange = (newPerPage) => {
    fetchLinesReport(linesFilters, {
      page: DEFAULT_CURRENT_PAGE,
      perPage: newPerPage
    });
  };

  // ── Extra filter controls (status / form / payment / date range) ─────────────
  const anyLabel = T.translate("sponsor_reports_page.any");
  const statusSelectOptions = [
    { value: "", label: anyLabel },
    ...(filterOptions?.statuses || []).map((s) => ({ value: s, label: s }))
  ];
  // Drop forms with no display name — they render as unpickable blank rows.
  const formSelectOptions = [
    { value: "", label: anyLabel },
    ...(filterOptions?.forms || [])
      .filter((f) => f.name?.trim())
      .map((f) => ({ value: f.code, label: f.name }))
  ];
  const paymentMethodSelectOptions = [
    { value: "", label: anyLabel },
    ...(filterOptions?.payment_methods || []).map((pm) => ({
      value: pm,
      label: pm
    }))
  ];

  const extraControls = (draft, update) => (
    <>
      <Box sx={{ width: 200 }}>
        <MuiDropdown
          id="pd-filter-status"
          size="small"
          label={T.translate("sponsor_reports_page.filter_status")}
          placeholder={anyLabel}
          value={draft.status || ""}
          options={statusSelectOptions}
          onChange={(e) => update({ status: e.target.value || undefined })}
        />
      </Box>
      <Box sx={{ width: 200 }}>
        <MuiDropdown
          id="pd-filter-form"
          size="small"
          label={T.translate("sponsor_reports_page.filter_form")}
          placeholder={anyLabel}
          value={draft.formCode || ""}
          options={formSelectOptions}
          onChange={(e) => update({ formCode: e.target.value || undefined })}
        />
      </Box>
      {/* Payment Method is an order-level attribute; only the orders endpoint
          filters on it (the lines filter set omits payment_method), so surface
          it in the orders view only — mirrors search being view-specific. */}
      {view === "orders" && (
        <Box sx={{ width: 200 }}>
          <MuiDropdown
            id="pd-filter-payment-method"
            size="small"
            label={T.translate("sponsor_reports_page.filter_payment_method")}
            placeholder={anyLabel}
            value={draft.paymentMethod || ""}
            options={paymentMethodSelectOptions}
            onChange={(e) =>
              update({ paymentMethod: e.target.value || undefined })
            }
          />
        </Box>
      )}
      {/* Date pickers keep draft.dateFrom/dateTo as "YYYY-MM-DD"; buildQuery
          expands them to UTC ISO datetimes. Convert the picker's moment back to
          "YYYY-MM-DD" at the update boundary so the query contract is unchanged. */}
      <Box sx={{ width: 160 }}>
        <DateTimePicker
          id="pd-filter-date-from"
          format={{ date: REPORT_DATE_FORMAT, time: false }}
          timezone={REPORT_DATE_TZ}
          inputProps={{
            placeholder: T.translate("sponsor_reports_page.filter_date_from")
          }}
          value={toPickerValue(draft.dateFrom)}
          onChange={(ev) => update({ dateFrom: toReportDate(ev.target.value) })}
        />
      </Box>
      <Box sx={{ width: 160 }}>
        <DateTimePicker
          id="pd-filter-date-to"
          format={{ date: REPORT_DATE_FORMAT, time: false }}
          timezone={REPORT_DATE_TZ}
          inputProps={{
            placeholder: T.translate("sponsor_reports_page.filter_date_to")
          }}
          value={toPickerValue(draft.dateTo)}
          onChange={(ev) => update({ dateTo: toReportDate(ev.target.value) })}
        />
      </Box>
    </>
  );

  const activeFilters = view === "orders" ? filters : linesFilters;

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
                : exportLinesCsv(linesFilters)
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
            value={activeFilters}
            onApply={handleApply}
            onClear={handleClear}
            extraControls={extraControls}
          />
        </Box>
      }
    >
      <SummaryPanel tiles={tiles} />
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
          currentPage={linesCurrentPage}
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
  linesReadError: sponsorReportsPurchaseDetailsLinesState.readError,
  linesCurrentPage: sponsorReportsPurchaseDetailsLinesState.currentPage,
  linesPerPage: sponsorReportsPurchaseDetailsLinesState.perPage,
  linesFilters: sponsorReportsPurchaseDetailsLinesState.filters
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
