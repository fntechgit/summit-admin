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

import React, { useEffect, useMemo } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Alert, Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import GridToolbar from "../../../../components/mui/grid-toolbar";
import SummaryPanel from "../../../../components/sponsors/reports/SummaryPanel";
import UnpaidChargesBySponsor, {
  buildUnpaidChargesCsvRows,
  groupUnpaidCharges,
  sortGroups,
  STAGE_TONE,
  summarizeGroups
} from "../../../../components/sponsors/reports/UnpaidChargesBySponsor";
import {
  exportUnpaidChargesCsv,
  getUnpaidCharges,
  setUnpaidChargesPaging,
  setUnpaidChargesSort
} from "../../../../actions/sponsor-reports-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

const STAGES = Object.keys(STAGE_TONE);
const SORTS = ["balance", "name"];

const t = (key, params) => T.translate(`sponsor_reports_page.${key}`, params);

const UnpaidChargesReportPage = ({
  currentSummit,
  rows,
  term,
  filters,
  sort,
  currentPage,
  perPage,
  readError,
  exportUnpaidChargesCsv,
  getUnpaidCharges,
  setUnpaidChargesPaging,
  setUnpaidChargesSort
}) => {
  useEffect(() => {
    getUnpaidCharges(term, filters);
  }, []);

  const groups = useMemo(
    () => sortGroups(groupUnpaidCharges(rows), sort),
    [rows, sort]
  );
  const summary = useMemo(() => summarizeGroups(groups), [groups]);

  const tiles = [
    {
      label: t("unpaid_tile_total"),
      value: currencyAmountFromCents(summary.total)
    },
    {
      label: t("unpaid_tile_open"),
      value: currencyAmountFromCents(summary.open)
    },
    {
      label: t("unpaid_tile_checked_out"),
      value: currencyAmountFromCents(summary.checkedOut),
      tone: "warning"
    },
    { label: t("unpaid_tile_sponsors"), value: summary.sponsors }
  ];

  return (
    <div className="container">
      <h3>{t("unpaid_charges_title")}</h3>
      <GridToolbar
        splitAt="lg"
        searchProps={{
          term,
          onSearch: (value) => getUnpaidCharges(value, filters),
          placeholder: T.translate("general.placeholders.search")
        }}
        checkboxProps={{
          checked: !!filters.adminOnly,
          label: t("unpaid_admin_only"),
          onChange: (ev) =>
            getUnpaidCharges(term, { ...filters, adminOnly: ev.target.checked })
        }}
      >
        <MuiDropdown
          id="unpaid-filter-stage"
          size="small"
          placeholder={t("unpaid_filter_stage")}
          SelectDisplayProps={{ "aria-label": t("unpaid_filter_stage") }}
          value={filters.stage}
          options={[
            { value: "", label: t("unpaid_all_stages") },
            ...STAGES.map((stage) => ({
              value: stage,
              label: t(`unpaid_stage_${stage}`)
            }))
          ]}
          onChange={(e) =>
            getUnpaidCharges(term, { ...filters, stage: e.target.value })
          }
        />
        <MuiDropdown
          id="unpaid-sort"
          size="small"
          placeholder={t("unpaid_sort")}
          SelectDisplayProps={{ "aria-label": t("unpaid_sort") }}
          value={sort}
          options={SORTS.map((value) => ({
            value,
            label: t(`unpaid_sort_${value}`)
          }))}
          onChange={(e) => setUnpaidChargesSort(e.target.value)}
        />
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          disabled={groups.length === 0}
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          onClick={() =>
            exportUnpaidChargesCsv(
              buildUnpaidChargesCsvRows(
                groups,
                currentSummit.id,
                window.location.origin
              )
            )
          }
        >
          {t("export_csv")}
        </Button>
      </GridToolbar>
      {readError ? (
        <Alert severity="error">
          {readError.message
            ? t("unpaid_read_error", { message: readError.message })
            : t("read_error")}
        </Alert>
      ) : (
        <>
          <SummaryPanel tiles={tiles} />
          {summary.missing > 0 && (
            <Box sx={{ my: 2, color: "warning.main" }}>
              {t("unpaid_price_missing_count", { count: summary.missing })}
            </Box>
          )}
          <UnpaidChargesBySponsor
            groups={groups}
            summitId={currentSummit.id}
            currentPage={currentPage}
            perPage={perPage}
            onPageChange={(page) =>
              setUnpaidChargesPaging({ currentPage: page, perPage })
            }
            onPerPageChange={(value) =>
              setUnpaidChargesPaging({
                currentPage: DEFAULT_CURRENT_PAGE,
                perPage: value
              })
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

export default connect(mapStateToProps, {
  exportUnpaidChargesCsv,
  getUnpaidCharges,
  setUnpaidChargesPaging,
  setUnpaidChargesSort
})(UnpaidChargesReportPage);
