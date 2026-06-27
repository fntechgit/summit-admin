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
import { Box, Button, Pagination, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import { buildReportQuery } from "../report-query";
import { isPositiveIntId } from "../../../../utils/reports-api";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import SummaryPanel from "../../../../components/sponsors/reports/SummaryPanel";
import FilterBar from "../../../../components/sponsors/reports/FilterBar";
import GroupByToggle from "../../../../components/sponsors/reports/GroupByToggle";
import GroupBySponsorView from "../../../../components/sponsors/reports/GroupBySponsorView";
import GroupByComponentView from "../../../../components/sponsors/reports/GroupByComponentView";
import usePrint from "../../../../hooks/usePrint";
import {
  exportSponsorAssetCsv,
  getSponsorAssetFilters,
  getSponsorAssetReport
} from "../../../../actions/sponsor-reports-actions";

const STATUS_TILE_KEYS = [
  "completed",
  "in_progress",
  "pending",
  "not_applicable"
];
const TILE_TONE = {
  completed: "success",
  in_progress: "info",
  pending: "warning",
  not_applicable: "neutral"
};
const GROUP_PER_PAGE = 25;
const FIRST_PAGE = 1;

const SponsorAssetReportPage = ({
  // From mapStateToProps
  currentSummit,
  filterOptions,
  data,
  summary,
  lastPage,
  currentPage,
  loading,
  readError,
  // From mapDispatchToProps
  getSponsorAssetReport: fetchReport,
  getSponsorAssetFilters: fetchFilters,
  exportSponsorAssetCsv
}) => {
  const print = usePrint();

  // Summit comes from Redux state (not URL params) — page is inside the summit
  // route context and always has a valid currentSummit when rendered normally.
  const validSummit = !!(currentSummit && isPositiveIntId(currentSummit.id));

  const [groupBy, setGroupBy] = useState("sponsor");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(FIRST_PAGE);

  // Fetch sponsor filter options once on mount; summit is read from store inside
  // the action. Guard on validSummit so no network call fires when currentSummit
  // is temporarily null (race on initial load or in test scaffolding).
  useEffect(() => {
    if (validSummit) fetchFilters();
  }, []); // mount-only — validSummit is stable once the summit context is set

  // Build the API query from all local state. Memoized so useEffect only re-runs
  // when the query actually changes (referential stability).
  const query = useMemo(
    () =>
      buildReportQuery({
        ...filters,
        groupBy,
        page,
        perPage: GROUP_PER_PAGE
      }),
    [filters, groupBy, page]
  );

  // Fetch the grouped report whenever the derived query changes; skips if
  // currentSummit is not yet available (rare — summit always loads before nav).
  useEffect(() => {
    if (validSummit) fetchReport(query);
  }, [query]); // query is memoized; re-fetches only on real changes

  const onApply = (next) => {
    setPage(FIRST_PAGE);
    setFilters(next);
  };
  const onClear = () => {
    setPage(FIRST_PAGE);
    setFilters({});
  };
  const onGroupBy = (next) => {
    setPage(FIRST_PAGE);
    setGroupBy(next);
  };

  const tiles = STATUS_TILE_KEYS.map((key) => ({
    key,
    label: T.translate(`sponsor_reports_page.status_${key}`),
    value: summary?.by_status?.[key] ?? 0,
    tone: TILE_TONE[key]
  }));

  if (!validSummit) {
    return (
      <ReportShell
        title={T.translate("sponsor_reports_page.sponsor_assets_title")}
      >
        <Box
          data-testid="reports-summit-not-found"
          sx={{ p: 4, textAlign: "center" }}
        >
          <Typography variant="h6">
            {T.translate("sponsor_reports_page.summit_not_found")}
          </Typography>
        </Box>
      </ReportShell>
    );
  }

  return (
    <ReportShell
      title={T.translate("sponsor_reports_page.sponsor_assets_title")}
      subtitle={T.translate("sponsor_reports_page.sponsor_assets_subtitle")}
      icon={<CollectionsOutlinedIcon />}
      iconTone="primary"
      actions={
        <>
          <Button startIcon={<PrintIcon />} variant="outlined" onClick={print}>
            {T.translate("sponsor_reports_page.print")}
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => exportSponsorAssetCsv(filters)}
          >
            {T.translate("sponsor_reports_page.export_csv")}
          </Button>
        </>
      }
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        <GroupByToggle value={groupBy} onChange={onGroupBy} />
      </Stack>
      <Box sx={{ mb: 2 }}>
        <FilterBar
          sponsors={filterOptions?.sponsors || []}
          value={filters}
          onApply={onApply}
          onClear={onClear}
          showSearch
        />
      </Box>
      {summary && <SummaryPanel tiles={tiles} />}

      {loading && (
        <Typography>{T.translate("sponsor_reports_page.loading")}</Typography>
      )}
      {!loading && readError && (
        <Box
          data-testid="reports-read-error"
          sx={{ p: 4, textAlign: "center" }}
        >
          <Typography variant="h6">
            {readError.message ||
              T.translate("sponsor_reports_page.read_error")}
          </Typography>
        </Box>
      )}
      {/* currentPage is 0 until the first report load → no empty-state flash before the
          fetch resolves, and no flicker if /filters lands before the report (Task 3 decouple). */}
      {!loading &&
        !readError &&
        currentPage >= FIRST_PAGE &&
        data.length === 0 && (
          <Box
            data-testid="reports-no-groups"
            sx={{ p: 4, textAlign: "center" }}
          >
            <Typography variant="h6">
              {T.translate("sponsor_reports_page.no_results")}
            </Typography>
          </Box>
        )}
      {/* Render the view that matches the data we actually hold, not the live toggle —
          a stale/out-of-order grouped response could otherwise feed the wrong view component
          a mismatched card shape and crash (sponsor card has .sponsor, component card .component). */}
      {!loading && !readError && data.length > 0 && !!data[0].sponsor && (
        <GroupBySponsorView summitId={currentSummit.id} cards={data} />
      )}
      {!loading && !readError && data.length > 0 && !!data[0].component && (
        <GroupByComponentView summitId={currentSummit.id} cards={data} />
      )}

      {!loading && !readError && lastPage > FIRST_PAGE && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={lastPage}
            page={currentPage || FIRST_PAGE}
            onChange={(_e, p) => setPage(p)}
          />
        </Stack>
      )}
    </ReportShell>
  );
};

const mapStateToProps = ({
  sponsorReportsSponsorAssetState,
  currentSummitState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...sponsorReportsSponsorAssetState
});

const mapDispatchToProps = (dispatch) => ({
  getSponsorAssetReport: (query) => dispatch(getSponsorAssetReport(query)),
  getSponsorAssetFilters: () => dispatch(getSponsorAssetFilters()),
  exportSponsorAssetCsv: (filters) => dispatch(exportSponsorAssetCsv(filters))
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SponsorAssetReportPage)
);
