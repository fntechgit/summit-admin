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
  Grid,
  Link as MuiLink,
  Stack,
  Typography
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import { htmlToPlainText } from "../../../../utils/methods";
import { isPositiveIntId } from "../../../../utils/reports-api";
import ReportShell from "../../../../components/sponsors/reports/ReportShell";
import usePrint from "../../../../hooks/usePrint";
import TierBadge from "../../../../components/sponsors/reports/TierBadge";
import StatusPill from "../../../../components/sponsors/reports/StatusPill";
import SponsorAvatar from "../../../../components/sponsors/reports/SponsorAvatar";
import {
  exportSponsorAssetSectionCsv,
  getSponsorAssetSponsor
} from "../../../../actions/sponsor-reports-actions";

// Gate the <img> on an image file extension; render every other file as a
// download link (a PDF url in an <img> would show a broken image).
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;

// ContentCell uses T.translate directly (no `t` prop) — this component is
// co-located with the page and uses the same i18n module as everything else.
const ContentCell = ({ row }) => {
  const url =
    row.content?.preview_url || row.actions?.single_download_url || null;
  const filename = row.content?.filename || "";
  // value/summary may carry HTML markup — flatten to plain text (don't render markup).
  const text = htmlToPlainText(
    row.content?.value || row.content?.summary || filename
  );
  const isImage = !!url && IMAGE_EXT.test(filename || url);

  if (url && isImage) {
    return (
      <Box
        component="img"
        src={url}
        alt={row.module.title}
        sx={{
          width: "100%",
          height: 120,
          objectFit: "contain",
          borderRadius: 1,
          bgcolor: "grey.50"
        }}
      />
    );
  }
  if (url) {
    return (
      <MuiLink
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
      >
        <InsertDriveFileOutlinedIcon
          fontSize="small"
          sx={{ flexShrink: 0, mt: 0.25 }}
        />
        {/* Long hashed filenames have no spaces; overflowWrap:anywhere breaks
            the unbroken hash so the link wraps inside its card instead of
            overflowing. minWidth:0 lets the text shrink within the flex row. */}
        <Typography
          variant="body2"
          title={filename}
          sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
        >
          {filename || row.module.title}
        </Typography>
        <DownloadIcon fontSize="small" sx={{ flexShrink: 0, mt: 0.25 }} />
      </MuiLink>
    );
  }
  if (text) {
    return (
      <Typography variant="body2" noWrap title={text}>
        {text}
      </Typography>
    );
  }
  return (
    <Stack
      alignItems="center"
      spacing={0.5}
      sx={{ color: "text.disabled", py: 2 }}
    >
      <ImageOutlinedIcon />
      <Typography variant="caption">
        {T.translate("sponsor_reports_page.pending_upload")}
      </Typography>
    </Stack>
  );
};

const SponsorAssetDrilldownPage = ({
  // From mapStateToProps
  detail,
  loading,
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
      {loading && (
        <Typography>{T.translate("sponsor_reports_page.loading")}</Typography>
      )}
      {/* A valid sponsor with no submissions returns pages: [] (NOT a 404). */}
      {!loading && detail && pages.length === 0 && (
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

      {pages.map((section) => (
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
            <Grid container spacing={2}>
              {section.modules?.map((row) => (
                <Grid item xs={12} sm={6} md={4} key={row.module.id}>
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
                        title={row.module.title}
                      >
                        {row.module.title}
                      </Typography>
                      <StatusPill status={row.status} label={row.status} />
                    </Stack>
                    <ContentCell row={row} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </ReportShell>
  );
};

const mapStateToProps = ({ sponsorReportsDrilldownState }) => ({
  ...sponsorReportsDrilldownState
});

const mapDispatchToProps = (dispatch) => ({
  getSponsorAssetSponsor: (sponsorId) =>
    dispatch(getSponsorAssetSponsor(sponsorId)),
  exportSponsorAssetSectionCsv: (sponsorId, pageId) =>
    dispatch(exportSponsorAssetSectionCsv(sponsorId, pageId))
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SponsorAssetDrilldownPage)
);
