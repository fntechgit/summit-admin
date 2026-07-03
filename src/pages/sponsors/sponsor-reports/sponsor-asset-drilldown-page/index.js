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

// src/pages/sponsors/sponsor-reports/sponsor-asset-drilldown-page/index.js
//
// Per-sponsor asset drill-down page. Reads summitId from Redux state
// (currentSummitState.currentSummit) and sponsorId from the URL via withRouter
// (match.params.sponsorId). Only sponsorId is validated with isPositiveIntId;
// summitId comes from authenticated state and is always a valid integer.
//
// The drill-down shows the sponsor header + per-page cards with module rows.
// Each module row can hold a media image, a document download link, or a text
// value; the ContentCell component gates on filename extension (not MIME type)
// because the backend returns the same minted URL for both (sponsor_asset_serializers.py:72,76).

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid2,
  Stack,
  Typography
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import { isPositiveIntId } from "../../../../utils/methods";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import usePrint from "../../../../hooks/usePrint";
import TierBadge from "../../../../components/sponsors/reports/TierBadge";
import StatusPill from "../../../../components/sponsors/reports/StatusPill";
import SponsorAvatar from "../../../../components/sponsors/reports/SponsorAvatar";
import ContentCell from "../../../../components/sponsors/reports/ContentCell";
import {
  exportSponsorAssetSectionCsv,
  getSponsorAssetSponsor
} from "../../../../actions/sponsor-reports-actions";

const SponsorAssetDrilldownPage = ({
  // From mapStateToProps
  detail,
  readError,
  // From mapDispatchToProps
  getSponsorAssetSponsor: fetchSponsor,
  exportSponsorAssetSectionCsv,
  // From withRouter
  match
}) => {
  const print = usePrint();

  // sponsorId from URL; summitId from Redux state (not URL params per summit-admin pattern).
  const { sponsorId } = match.params;
  // Accept only strict positive integers so a malformed :sponsorId cannot be
  // interpolated into filter clauses or the CSV URL path.
  const validParams = isPositiveIntId(sponsorId);

  // Fetch sponsor detail on mount / sponsorId change; summit is read from
  // getState inside the action — only sponsorId is passed.
  useEffect(() => {
    if (validParams) fetchSponsor(sponsorId);
  }, [sponsorId, validParams]); // fetchSponsor is stable from connect — no dep needed

  if (!validParams || readError?.kind === "not-found") {
    return (
      <ReportShell
        title={T.translate("sponsor_reports_page.sponsor_assets_title")}
      >
        <Box data-testid="sponsor-not-found" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6">
            {T.translate("sponsor_reports_page.sponsor_not_found")}
          </Typography>
        </Box>
      </ReportShell>
    );
  }

  if (readError) {
    return (
      <ReportShell
        title={T.translate("sponsor_reports_page.sponsor_assets_title")}
      >
        <Box
          data-testid="reports-read-error"
          sx={{ p: 4, textAlign: "center" }}
        >
          <Typography variant="h6">
            {readError.message ||
              T.translate("sponsor_reports_page.read_error")}
          </Typography>
        </Box>
      </ReportShell>
    );
  }

  const sponsor = detail?.sponsor;
  const pages = detail?.pages || [];

  // Hard-wired to collected (Media) only — filter out non-Media rows and drop
  // sections that become empty after filtering.
  const visiblePages = pages
    .map((section) => ({
      ...section,
      modules: (section.modules || []).filter(
        (row) => row.module?.type === "Media"
      )
    }))
    .filter((section) => section.modules.length > 0);

  return (
    <ReportShell
      title={
        sponsor?.name ||
        T.translate("sponsor_reports_page.sponsor_assets_title")
      }
      actions={
        <Button startIcon={<PrintIcon />} variant="outlined" onClick={print}>
          {T.translate("sponsor_reports_page.print")}
        </Button>
      }
    >
      {/* No collected (Media) submissions to show: either a valid sponsor with
          pages: [] (NOT a 404), or a sponsor whose pages hold only non-Media
          modules, which visiblePages filters out. Mirrors the visiblePages render below. */}
      {detail && visiblePages.length === 0 && (
        <Box
          data-testid="sponsor-no-submissions"
          sx={{ p: 4, textAlign: "center" }}
        >
          <Typography variant="h6">
            {T.translate("sponsor_reports_page.sponsor_no_submissions")}
          </Typography>
        </Box>
      )}
      {sponsor && (
        <Box
          sx={{
            bgcolor: "#1f2937",
            color: "common.white",
            borderRadius: 2,
            p: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <SponsorAvatar name={sponsor.name} logoUrl={sponsor.logo_url} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">{sponsor.name}</Typography>
                <TierBadge tier={sponsor.tier} onDark />
              </Stack>
              {typeof sponsor.pages_active === "number" && (
                <Typography variant="body2" sx={{ color: "grey.400" }}>
                  {T.translate("sponsor_reports_page.pages_active", {
                    count: sponsor.pages_active
                  })}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      )}

      {visiblePages.map((section) => (
        <Card
          key={section.page.id}
          variant="outlined"
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
                flexWrap: "wrap",
                gap: 1
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {section.page.title}
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={() =>
                  exportSponsorAssetSectionCsv(sponsorId, section.page.id)
                }
              >
                {T.translate("sponsor_reports_page.download_csv")}
              </Button>
            </Box>
            <Grid2 container spacing={2}>
              {section.modules?.map((row) => (
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={row.module?.id}>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 1.5,
                      height: "100%",
                      boxSizing: "border-box"
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                        noWrap
                        title={row.module?.title}
                      >
                        {row.module?.title}
                      </Typography>
                      <StatusPill
                        status={row.status}
                        label={T.translate(
                          `sponsor_reports_page.status_${row.status}`,
                          { notFound: row.status }
                        )}
                      />
                    </Stack>
                    <ContentCell row={row} />
                  </Box>
                </Grid2>
              ))}
            </Grid2>
          </CardContent>
        </Card>
      ))}
    </ReportShell>
  );
};

const mapStateToProps = ({ sponsorReportsDrilldownState }) => ({
  ...sponsorReportsDrilldownState
});

const mapDispatchToProps = {
  getSponsorAssetSponsor,
  exportSponsorAssetSectionCsv
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SponsorAssetDrilldownPage)
);
