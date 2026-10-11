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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Alert, Box, Button } from "@mui/material";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import GridToolbar from "../../../../components/mui/grid-toolbar";
import history from "../../../../history";
import { getUnpaidCharges } from "../../../../actions/sponsor-reports-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

const UnpaidChargesReportPage = ({
  currentSummit,
  rows,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalCount,
  totalAmount,
  pricingErrorCount,
  filters,
  readError,
  getUnpaidCharges
}) => {
  useEffect(() => {
    getUnpaidCharges(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters
    );
  }, []);

  const fetchPage = (page, overrides = {}) => {
    const next = { term, perPage, order, orderDir, filters, ...overrides };
    getUnpaidCharges(
      next.term,
      page,
      next.perPage,
      next.order,
      next.orderDir,
      next.filters
    );
  };

  const sponsorUrl = (row) =>
    `/app/summits/${currentSummit.id}/sponsors/${row.sponsor_id}`;
  const isOrder = (row) =>
    row.stage === "invoiced" || row.stage === "processing";
  const handleOpen = (row) =>
    history.push(
      isOrder(row)
        ? `${sponsorUrl(row)}/purchases/${row.purchase_id}`
        : `${sponsorUrl(row)}/cart`
    );

  const columns = [
    {
      columnKey: "sponsor_name",
      header: T.translate("sponsor_reports_page.unpaid_col_sponsor"),
      sortable: true
    },
    {
      columnKey: "stage",
      header: T.translate("sponsor_reports_page.unpaid_col_cart"),
      render: (row) =>
        T.translate(`sponsor_reports_page.unpaid_stage_${row.stage}`)
    },
    {
      columnKey: "total",
      header: T.translate("sponsor_reports_page.unpaid_col_total"),
      sortable: true,
      // a null total must never render as $0
      render: (row) =>
        row.pricing_error
          ? T.translate("sponsor_reports_page.unpaid_price_missing")
          : currencyAmountFromCents(row.total)
    },
    {
      columnKey: "form_name",
      header: T.translate("sponsor_reports_page.unpaid_col_form")
    },
    {
      columnKey: "link",
      header: "",
      render: (row) => (
        <Button variant="text" size="small" onClick={() => handleOpen(row)}>
          {T.translate(
            isOrder(row)
              ? "sponsor_reports_page.unpaid_open_order"
              : "sponsor_reports_page.unpaid_open_cart"
          )}
        </Button>
      )
    }
  ];

  return (
    <div className="container">
      <h3>{T.translate("sponsor_reports_page.unpaid_charges_title")}</h3>
      <GridToolbar
        splitAt="lg"
        searchProps={{
          term,
          onSearch: (value) => fetchPage(DEFAULT_CURRENT_PAGE, { term: value }),
          placeholder: T.translate("general.placeholders.search")
        }}
        checkboxProps={{
          checked: !!filters.adminOnly,
          label: T.translate("sponsor_reports_page.unpaid_admin_only"),
          onChange: (ev) =>
            fetchPage(DEFAULT_CURRENT_PAGE, {
              filters: { ...filters, adminOnly: ev.target.checked }
            })
        }}
      />
      {readError ? (
        <Alert severity="error">
          {T.translate("sponsor_reports_page.unpaid_read_error", {
            message: readError.message ?? readError.status
          })}
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            {T.translate("sponsor_reports_page.unpaid_summary", {
              count: totalCount,
              amount: currencyAmountFromCents(totalAmount)
            })}
            {pricingErrorCount > 0 && (
              <Box component="span" sx={{ ml: 2, color: "warning.main" }}>
                {T.translate(
                  "sponsor_reports_page.unpaid_price_missing_count",
                  {
                    count: pricingErrorCount
                  }
                )}
              </Box>
            )}
          </Box>
          <MuiTable
            columns={columns}
            data={rows}
            options={{ sortCol: order, sortDir: orderDir }}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onPageChange={(page) => fetchPage(page)}
            onPerPageChange={(value) =>
              fetchPage(DEFAULT_CURRENT_PAGE, { perPage: value })
            }
            onSort={(key, dir) =>
              fetchPage(DEFAULT_CURRENT_PAGE, { order: key, orderDir: dir })
            }
          />
        </>
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  sponsorReportsUnpaidChargesState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...sponsorReportsUnpaidChargesState
});

export default connect(mapStateToProps, { getUnpaidCharges })(
  UnpaidChargesReportPage
);
