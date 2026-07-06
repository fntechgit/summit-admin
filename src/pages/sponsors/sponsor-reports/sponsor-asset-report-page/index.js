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

import React, { useEffect, useState, useMemo, useRef } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import { isPositiveIntId } from "../../../../utils/methods";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import SummaryPanel from "../../../../components/sponsors/reports/SummaryPanel";
import FilterBar from "../../../../components/sponsors/reports/FilterBar";
import PivotSelector from "../../../../components/sponsors/reports/PivotSelector";
import PivotTree from "../../../../components/sponsors/reports/PivotTree";
import { PIVOTS } from "../../../../components/sponsors/reports/pivot-defs";
import {
  buildPivotTree,
  STATUS_KEYS
} from "../../../../components/sponsors/reports/build-pivot-tree";
import { statusTone } from "../../../../components/sponsors/reports/StatusPill";
import usePrint from "../../../../hooks/usePrint";
import {
  exportSponsorAssetCsv,
  getSponsorAssetFilters,
  getSponsorAssetRows
} from "../../../../actions/sponsor-reports-actions";

const SponsorAssetReportPage = ({
  // From mapStateToProps
  currentSummit,
  filterOptions,
  rows,
  summary,
  filters,
  readError,
  // From mapDispatchToProps
  getSponsorAssetRows: fetchRows,
  getSponsorAssetFilters: fetchFilters,
  exportSponsorAssetCsv
}) => {
  const print = usePrint();

  // Summit comes from Redux state (not URL params) — page is inside the summit
  // route context and always has a valid currentSummit when rendered normally.
  const validSummit = !!(currentSummit && isPositiveIntId(currentSummit.id));

  // Pivot/groupBy is a transient UI-only selection (client-side pivot), not server
  // state — it stays local. Active `filters` live in the reducer (recorded on the
  // fetch thunk) and arrive as a prop; there is no local filters state.
  const [pivotKey, setPivotKey] = useState(PIVOTS[0].key);
  // Loading is owned by the global overlay (state.baseState.loading), so the empty
  // state ("no groups") can no longer key off a per-slice loading flag. Track a
  // local hasFetched instead so the empty panel is suppressed until the first row
  // fetch resolves (avoids a no-results flash before data arrives).
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch rows and flag hasFetched once the fetch settles. Tolerates a mocked
  // thunk that returns a plain action object (Promise.resolve normalizes both).
  // Generation-guard the finalizer: a superseded fetch (summit change, or a
  // rapid apply/clear) must not flip hasFetched back on and flash the empty
  // state before the newer fetch settles — only the latest fetch commits.
  const fetchGenRef = useRef(0);
  const fetchRowsTracked = (next) => {
    fetchGenRef.current += 1;
    const gen = fetchGenRef.current;
    return Promise.resolve(fetchRows(next)).finally(() => {
      if (gen === fetchGenRef.current) setHasFetched(true);
    });
  };

  // On mount (and summit change) fetch filter options + the full flat row set;
  // summit is read from store inside each action. The thunk records the active
  // `filters` into the reducer, so onApply/onClear drive the fetch directly and
  // there is no filters-watching effect (which would double-fetch). Guard on
  // validSummit so no network call fires when currentSummit is temporarily null.
  useEffect(() => {
    if (validSummit) {
      // Re-arm the empty-state guard for this summit so "no groups" can't flash
      // between the reducer reset and the new summit's first row fetch settling.
      setHasFetched(false);
      fetchFilters();
      fetchRowsTracked(filters);
    }
  }, [currentSummit?.id]); // filters/validSummit read at call time — handlers drive refetches

  const activePivot = PIVOTS.find((p) => p.key === pivotKey) || PIVOTS[0];
  // Memoized pivot tree — only rebuilds when rows/axes change, so switching the
  // pivot selector or re-rendering doesn't re-group on every render.
  // CRITICAL: pass activePivot.axes directly (stable reference into PIVOTS).
  // Do NOT spread/rebuild — a fresh array each render busts the useMemo.
  const tree = useMemo(
    () => buildPivotTree(rows, activePivot.axes),
    [rows, activePivot.axes]
  );

  const onApply = (next) => fetchRowsTracked(next);
  const onClear = () => fetchRowsTracked({});

  const tiles = STATUS_KEYS.map((key) => ({
    key,
    label: T.translate(`sponsor_reports_page.status_${key}`),
    value: summary?.by_status?.[key] ?? 0,
    tone: statusTone(key)
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
            onClick={() =>
              exportSponsorAssetCsv({ ...filters, moduleType: "Media" })
            }
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
        <PivotSelector value={pivotKey} onChange={setPivotKey} />
      </Stack>
      <Box sx={{ mb: 2 }}>
        <FilterBar
          sponsors={filterOptions?.sponsors || []}
          value={filters}
          onApply={onApply}
          onClear={onClear}
          showSearch
          extraControls={(draft, update) => (
            <Box sx={{ width: 200 }}>
              <MuiDropdown
                id="sa-filter-status"
                size="small"
                placeholder={T.translate(
                  "sponsor_reports_page.filter_asset_status"
                )}
                SelectDisplayProps={{
                  "aria-label": T.translate(
                    "sponsor_reports_page.filter_asset_status"
                  )
                }}
                value={draft.status || ""}
                options={[
                  { value: "", label: T.translate("sponsor_reports_page.any") },
                  ...STATUS_KEYS.map((key) => ({
                    value: key,
                    label: T.translate(`sponsor_reports_page.status_${key}`)
                  }))
                ]}
                onChange={(e) =>
                  update({ status: e.target.value || undefined })
                }
              />
            </Box>
          )}
        />
      </Box>
      {summary && <SummaryPanel tiles={tiles} />}

      {readError && (
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
      {!readError && hasFetched && rows.length === 0 && (
        <Box data-testid="reports-no-groups" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6">
            {T.translate("sponsor_reports_page.no_results")}
          </Typography>
        </Box>
      )}
      {!readError && rows.length > 0 && (
        <PivotTree
          nodes={tree}
          summitId={currentSummit.id}
          maxDepth={activePivot.axes.length}
        />
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

const mapDispatchToProps = {
  getSponsorAssetRows,
  getSponsorAssetFilters,
  exportSponsorAssetCsv
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SponsorAssetReportPage)
);
