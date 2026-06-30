import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Link as MuiLink,
  Stack,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import T from "i18n-react/dist/i18n-react";
import ContentCell from "./ContentCell";
import StatusPill from "./StatusPill";
import StatusRollupChips from "./StatusRollupChips";
import TierBadge from "./TierBadge";
import SponsorAvatar from "./SponsorAvatar";
import { UNKNOWN_LABEL_KEYS } from "./pivot-defs";

const Leaf = ({ rows }) => (
  <Stack spacing={1}>
    {rows.map((row, i) => (
      <Stack
        key={row.module?.id ?? i}
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Typography variant="body2" sx={{ minWidth: 160 }}>
          {row.module?.component_name ||
            row.module?.title ||
            T.translate("sponsor_reports_page.pivot_unnamed_component")}
        </Typography>
        <StatusPill status={row.status} label={row.status} />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <ContentCell row={row} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

const PivotTree = ({ nodes, summitId, depth = 0, maxDepth }) => (
  <Box>
    {nodes.map((node) => {
      const isDeepestGroup = depth === maxDepth - 1;
      const sponsorLink =
        node.axisId === "sponsor" && node.key != null
          ? `/app/summits/${summitId}/sponsors/reports/sponsor-assets/sponsors/${node.key}`
          : null;
      return (
        <Accordion
          key={`${node.axisId}-${node.key ?? "unknown"}`}
          defaultExpanded={!isDeepestGroup}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: "wrap", width: "100%" }}
            >
              {node.axisId === "sponsor" && (
                <SponsorAvatar
                  name={node.sample.sponsor?.name}
                  logoUrl={node.sample.sponsor?.logo_url}
                />
              )}
              {sponsorLink ? (
                <MuiLink
                  component={RouterLink}
                  to={sponsorLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  {node.isUnknown
                    ? T.translate(UNKNOWN_LABEL_KEYS[node.axisId])
                    : node.label}
                </MuiLink>
              ) : (
                <Typography>
                  {node.isUnknown
                    ? T.translate(UNKNOWN_LABEL_KEYS[node.axisId])
                    : node.label}
                </Typography>
              )}
              {node.axisId === "sponsor" && (
                <TierBadge tier={node.sample.sponsor?.tier} />
              )}
              {node.axisId === "tier" && !node.isUnknown && (
                <TierBadge tier={node.label} />
              )}
              <Chip size="small" label={node.count} />
              <Box sx={{ ml: "auto" }}>
                <StatusRollupChips rollup={node.statusRollup} />
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {node.children ? (
              <PivotTree
                nodes={node.children}
                summitId={summitId}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ) : (
              <Leaf rows={node.leaves} />
            )}
          </AccordionDetails>
        </Accordion>
      );
    })}
  </Box>
);

export default PivotTree;
