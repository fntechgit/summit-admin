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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import { isPositiveIntId } from "../../../../utils/methods";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import SummaryPanel from "../../../../components/sponsors/reports/SummaryPanel";
import FilterBar from "../../../../components/sponsors/reports/FilterBar";
import PivotSelector from "../../../../components/sponsors/reports/PivotSelector";
import PivotTree from "../../../../components/sponsors/reports/PivotTree";
import { PIVOTS } from "../../../../components/sponsors/reports/pivot-defs";
import { usePivot } from "../../../../components/sponsors/reports/usePivot";
import usePrint from "../../../../hooks/usePrint";
import {
  exportSponsorAssetCsv,
  getSponsorAssetFilters,
  getSponsorAssetRows
} from "../../../../actions/sponsor-reports-actions";

// not_applicable is omitted — the report is scoped to Media assets (server applies
// module_type==Media), which never yield an N/A status, so the tile was always zero.
const STATUS_TILE_KEYS = ["completed", "in_progress", "pending"];
const TILE_TONE = {
  completed: "success",
  in_progress: "info",
  pending: "warning"
};

const SponsorAssetReportPage = ({
  // From mapStateToProps
  currentSummit,
  filterOptions,
  rows,
  summary,
  loading,
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

  const [pivotKey, setPivotKey] = useState(PIVOTS[0].key);
  const [filters, setFilters] = useState({});

  // Fetch sponsor filter options once on mount; summit is read from store inside
  // the action. Guard on validSummit so no network call fires when currentSummit
  // is temporarily null (race on initial load or in test scaffolding).
  useEffect(() => {
    if (validSummit) fetchFilters();
  }, []); // mount-only — validSummit is stable once the summit context is set

  // Fetch the full flat row set when filters change; server applies
  // module_type==Media. Pivot is purely client-side — no refetch on pivot change.
  useEffect(() => {
    if (validSummit) fetchRows(filters);
  }, [filters]); // validSummit omitted intentionally — stable once summit loads

  const activePivot = PIVOTS.find((p) => p.key === pivotKey) || PIVOTS[0];
  // CRITICAL: pass activePivot.axes directly (stable reference into PIVOTS).
  // Do NOT spread/rebuild — a fresh array each render busts the useMemo.
  const tree = usePivot(rows, activePivot.axes);

  const onApply = (next) => setFilters(next);
  const onClear = () => setFilters({});

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
            <TextField
              select
              size="small"
              sx={{ minWidth: 160 }}
              label={T.translate("sponsor_reports_page.filter_asset_status")}
              value={draft.status || ""}
              onChange={(e) => update({ status: e.target.value || undefined })}
            >
              <MenuItem value="">
                {T.translate("sponsor_reports_page.any")}
              </MenuItem>
              {STATUS_TILE_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  {T.translate(`sponsor_reports_page.status_${key}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
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
      {!loading && !readError && rows.length === 0 && (
        <Box data-testid="reports-no-groups" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6">
            {T.translate("sponsor_reports_page.no_results")}
          </Typography>
        </Box>
      )}
      {!loading && !readError && rows.length > 0 && (
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
