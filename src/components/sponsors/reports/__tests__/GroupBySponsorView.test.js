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

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GroupBySponsorView from "../GroupBySponsorView";

// Echo i18n keys; interpolate count for Chip labels.
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k, opts) =>
    opts && opts.count != null ? `${k}:${opts.count}` : k
}));

const cards = [
  {
    sponsor: {
      id: 17,
      name: "Acme",
      company_name: "Acme Inc",
      tier: "Gold",
      logo_url: null
    },
    component_count: 3,
    status_rollup: {
      completed: 2,
      in_progress: 0,
      pending: 1,
      not_applicable: 0
    }
  }
];

const renderView = () =>
  render(
    <MemoryRouter>
      <GroupBySponsorView summitId="42" cards={cards} />
    </MemoryRouter>
  );

describe("GroupBySponsorView", () => {
  it("renders a sponsor card with name and a components-count pill", () => {
    renderView();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.components_count:3")
    ).toBeInTheDocument();
  });

  it("links the card to the SUMMIT-ADMIN sponsor drill-down route (not the old /app/reports path)", () => {
    renderView();
    // CardActionArea renders as <a> when component=RouterLink — getByRole("link") finds it.
    const link = screen.getByRole("link", { name: /Acme/ });
    expect(link).toHaveAttribute(
      "href",
      "/app/summits/42/sponsors/reports/sponsor-assets/sponsors/17"
    );
  });

  it("renders the status rollup chips", () => {
    renderView();
    // StatusRollupChips renders "sponsor_reports_page.status_completed: 2" etc.
    expect(
      screen.getByText(/sponsor_reports_page\.status_completed/)
    ).toBeInTheDocument();
  });

  it("renders the tier badge", () => {
    renderView();
    expect(screen.getByText("GOLD")).toBeInTheDocument();
  });

  it("shows company_name when it differs from sponsor name", () => {
    renderView();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
  });

  it("hides company_name when it equals the sponsor name", () => {
    render(
      <MemoryRouter>
        <GroupBySponsorView
          summitId="69"
          cards={[
            {
              sponsor: {
                id: 1,
                name: "AcBel Polytech",
                company_name: "AcBel Polytech",
                tier: "Gold"
              },
              component_count: 7,
              status_rollup: {
                completed: 8,
                in_progress: 0,
                pending: 3,
                not_applicable: 0
              }
            }
          ]}
        />
      </MemoryRouter>
    );
    // name appears once (heading), NOT duplicated as company line
    expect(screen.getAllByText("AcBel Polytech")).toHaveLength(1);
  });
});
