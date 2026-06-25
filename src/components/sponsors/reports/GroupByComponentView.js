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

import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography
} from "@mui/material";
import T from "i18n-react/dist/i18n-react";
import StatusRollupChips from "./StatusRollupChips";
import StatusPill from "./StatusPill";
import SponsorAvatar from "./SponsorAvatar";
import { toPlainText } from "../../../utils/reports-text";

const NOT_PRESENT_STATUSES = ["pending", "not_applicable"];

const hasContent = (content) =>
  !!(content && (content.summary || content.value || content.filename));

// "Sponsor not present yet" is FE-derived from status + absence of content,
// NOT from submitted_at being null (an Info/Document row can be completed with
// content yet have submitted_at === null).
const isNotPresent = (entry) =>
  NOT_PRESENT_STATUSES.includes(entry.status) && !hasContent(entry.content);

// Each sponsor link inside a component card goes to the summit-admin drill-down.
// NOTE: path is /app/summits/:summitId/sponsors/reports/sponsor-assets/sponsors/:id,
// NOT the old /app/reports/summits/:summitId/... path from the sponsor-services source.
const GroupByComponentView = ({ summitId, cards = [] }) => (
  <Stack spacing={2}>
    {cards.map((card, idx) => (
      <Card
        key={card.component.is_unnamed ? `unnamed-${idx}` : card.component.name}
        variant="outlined"
      >
        <CardContent>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 1, flexWrap: "wrap" }}
          >
            <Typography variant="h6">
              {card.component.is_unnamed
                ? T.translate("sponsor_reports_page.unnamed_component")
                : card.component.name}
            </Typography>
            <Chip
              size="small"
              label={T.translate("sponsor_reports_page.sponsors_count", {
                count: card.sponsor_count
              })}
            />
          </Stack>
          <StatusRollupChips rollup={card.status_rollup} />
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            {card.sponsors.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ flexWrap: "wrap" }}
              >
                <SponsorAvatar name={entry.name} logoUrl={entry.logo_url} />
                <MuiLink
                  component={RouterLink}
                  to={`/app/summits/${summitId}/sponsors/reports/sponsor-assets/sponsors/${entry.id}`}
                >
                  {entry.name}
                </MuiLink>
                <StatusPill status={entry.status} />
                {/* Asset filename/summary: wrap (don't truncate) so the full
                    name is readable; overflowWrap breaks long hashed filenames. */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
                >
                  {isNotPresent(entry)
                    ? T.translate("sponsor_reports_page.not_present_yet")
                    : toPlainText(
                        entry.content?.summary ||
                          entry.content?.value ||
                          entry.content?.filename ||
                          ""
                      )}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    ))}
  </Stack>
);

export default GroupByComponentView;
