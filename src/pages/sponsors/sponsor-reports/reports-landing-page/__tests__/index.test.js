// src/pages/sponsors/sponsor-reports/reports-landing-page/__tests__/index.test.js
/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import ReportsLandingPage from "../index";

// Echo i18n keys so T.translate("sponsor_reports_page.foo") → "sponsor_reports_page.foo"
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

// react-breadcrumbs: render a simple stub so we can assert the breadcrumb title
jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: ({ data }) => (
    <div data-testid="breadcrumb" data-title={data.title} />
  )
}));

const BASE = "/app/summits/1/sponsors/reports";
const PAGE_ROUTE = "/app/summits/:summit_id/sponsors/reports";

function renderLanding(url = BASE) {
  const history = createMemoryHistory({ initialEntries: [url] });
  return render(
    <Router history={history}>
      <Route path={PAGE_ROUTE} component={ReportsLandingPage} />
    </Router>
  );
}

describe("ReportsLandingPage", () => {
  it("renders a card for Purchase Details", () => {
    renderLanding();
    expect(
      screen.getByText("sponsor_reports_page.purchase_details_title")
    ).toBeInTheDocument();
  });

  it("renders a card for Sponsor Assets", () => {
    renderLanding();
    expect(
      screen.getByText("sponsor_reports_page.sponsor_assets_title")
    ).toBeInTheDocument();
  });

  it("Purchase Details card links to .../purchase-details", () => {
    renderLanding();
    const link = screen
      .getByText("sponsor_reports_page.purchase_details_title")
      .closest("a");
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe(`${BASE}/purchase-details`);
  });

  it("Sponsor Assets card links to .../sponsor-assets", () => {
    renderLanding();
    const link = screen
      .getByText("sponsor_reports_page.sponsor_assets_title")
      .closest("a");
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe(`${BASE}/sponsor-assets`);
  });

  it("renders a breadcrumb with the landing_title i18n key", () => {
    renderLanding();
    const bc = screen.getByTestId("breadcrumb");
    expect(bc).toBeInTheDocument();
    expect(bc.getAttribute("data-title")).toBe(
      "sponsor_reports_page.landing_title"
    );
  });

  it("renders exactly two report cards", () => {
    renderLanding();
    // Each card has a data-testid
    expect(screen.getAllByTestId(/^report-card-/).length).toBe(2);
  });
});
