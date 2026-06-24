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
import { Link, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid2,
  Typography
} from "@mui/material";

const CARDS = [
  {
    id: "purchase-details",
    titleKey: "sponsor_reports_page.purchase_details_title",
    descKey: "sponsor_reports_page.purchase_details_desc"
  },
  {
    id: "sponsor-assets",
    titleKey: "sponsor_reports_page.sponsor_assets_title",
    descKey: "sponsor_reports_page.sponsor_assets_desc"
  }
];

const ReportsLandingPage = ({ match }) => (
  <div className="container">
    <Breadcrumb
      data={{
        title: T.translate("sponsor_reports_page.landing_title"),
        pathname: match.url
      }}
    />
    <h3>{T.translate("sponsor_reports_page.landing_title")}</h3>
    <Grid2 container spacing={2}>
      {CARDS.map((card) => (
        <Grid2 key={card.id} size={{ xs: 12, sm: 6 }}>
          <Card
            data-testid={`report-card-${card.id}`}
            variant="outlined"
            sx={{ borderRadius: 2, "&:hover": { boxShadow: 2 } }}
          >
            <CardActionArea component={Link} to={`${match.url}/${card.id}`}>
              <CardContent>
                <Typography variant="h6">
                  {T.translate(card.titleKey)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {T.translate(card.descKey)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid2>
      ))}
    </Grid2>
  </div>
);

export default withRouter(ReportsLandingPage);
