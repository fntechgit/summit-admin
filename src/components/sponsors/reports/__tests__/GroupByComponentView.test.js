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
import GroupByComponentView from "../GroupByComponentView";

// Echo i18n keys; interpolate count for Chip labels.
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k, opts) =>
    opts && opts.count != null ? `${k}:${opts.count}` : k
}));

const cards = [
  {
    component: { name: "Company Logo", is_unnamed: false },
    sponsor_count: 2,
    status_rollup: {
      completed: 1,
      in_progress: 0,
      pending: 1,
      not_applicable: 0
    },
    sponsors: [
      {
        id: 17,
        name: "Acme",
        logo_url: null,
        status: "completed",
        submitted_at: "2026-06-09T16:00:19Z",
        content: { summary: "Acme bio", value: null, filename: "logo.png" }
      },
      {
        id: 23,
        name: "Beta",
        logo_url: null,
        status: "pending",
        submitted_at: null,
        content: { summary: null, value: null, filename: null }
      }
    ]
  },
  {
    component: { name: "", is_unnamed: true },
    sponsor_count: 1,
    status_rollup: {
      completed: 0,
      in_progress: 0,
      pending: 1,
      not_applicable: 0
    },
    sponsors: [
      {
        id: 31,
        name: "Cee",
        logo_url: null,
        status: "pending",
        submitted_at: null,
        content: { summary: null, value: null, filename: null }
      }
    ]
  }
];

const renderView = () =>
  render(
    <MemoryRouter>
      <GroupByComponentView summitId="42" cards={cards} />
    </MemoryRouter>
  );

describe("GroupByComponentView", () => {
  it("renders a component card with its name and a sponsor-count pill", () => {
    renderView();
    expect(screen.getByText("Company Logo")).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.sponsors_count:2")
    ).toBeInTheDocument();
  });

  it("renders the (Unnamed) label for an is_unnamed card", () => {
    renderView();
    expect(
      screen.getByText("sponsor_reports_page.unnamed_component")
    ).toBeInTheDocument();
  });

  it("shows a present sponsor's content and a not-present hint for an empty one", () => {
    renderView();
    expect(screen.getByText("Acme bio")).toBeInTheDocument();
    // Beta (pending, no content) and Cee (pending, no content)
    expect(
      screen.getAllByText("sponsor_reports_page.not_present_yet")
    ).toHaveLength(2);
  });

  it("links each sponsor entry to its SUMMIT-ADMIN drill-down route (not the old /app/reports path)", () => {
    renderView();
    const acme = screen.getByRole("link", { name: /Acme/ });
    expect(acme).toHaveAttribute(
      "href",
      "/app/summits/42/sponsors/reports/sponsor-assets/sponsors/17"
    );
    const beta = screen.getByRole("link", { name: /Beta/ });
    expect(beta).toHaveAttribute(
      "href",
      "/app/summits/42/sponsors/reports/sponsor-assets/sponsors/23"
    );
  });

  it("renders the status rollup chips for the component card", () => {
    renderView();
    expect(
      screen.getAllByText(/sponsor_reports_page\.status_completed/).length
    ).toBeGreaterThan(0);
  });
});
