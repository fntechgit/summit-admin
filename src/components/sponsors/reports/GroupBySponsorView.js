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
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography
} from "@mui/material";
import T from "i18n-react/dist/i18n-react";
import StatusRollupChips from "./StatusRollupChips";
import TierBadge from "./TierBadge";
import SponsorAvatar from "./SponsorAvatar";

// Each sponsor card links to the summit-admin per-sponsor drill-down.
// NOTE: the drill-down path is /app/summits/:summitId/sponsors/reports/sponsor-assets/sponsors/:id,
// NOT the old /app/reports/summits/:summitId/... path from the sponsor-services source.
const GroupBySponsorView = ({ summitId, cards = [] }) => (
  <Stack spacing={2}>
    {cards.map((card) => {
      const s = card.sponsor;
      // company_name often equals name — only show it when it adds information.
      const showCompany = s.company_name && s.company_name !== s.name;
      return (
        <Card
          key={s.id}
          variant="outlined"
          sx={{ borderRadius: 2, "&:hover": { boxShadow: 2 } }}
        >
          <CardActionArea
            component={RouterLink}
            to={`/app/summits/${summitId}/sponsors/reports/sponsor-assets/sponsors/${s.id}`}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 1, flexWrap: "wrap" }}
              >
                <SponsorAvatar name={s.name} logoUrl={s.logo_url} />
                <Typography variant="h6">{s.name}</Typography>
                {showCompany && (
                  <Typography variant="body2" color="text.secondary">
                    {s.company_name}
                  </Typography>
                )}
                <TierBadge tier={s.tier} />
                <Chip
                  size="small"
                  label={T.translate("sponsor_reports_page.components_count", {
                    count: card.component_count
                  })}
                />
              </Stack>
              <StatusRollupChips rollup={card.status_rollup} />
            </CardContent>
          </CardActionArea>
        </Card>
      );
    })}
  </Stack>
);

export default GroupBySponsorView;
