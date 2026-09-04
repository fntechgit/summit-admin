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
import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "../../../utils/test-utils";
import AuditLogPage from "../audit-log-page";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../components/audit-logs", () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="audit-logs-mock">{JSON.stringify(props)}</div>
  )
}));

const renderPage = (totalLogEntries) =>
  renderWithRedux(<AuditLogPage />, {
    initialState: { auditLogState: { totalLogEntries } }
  });

describe("AuditLogPage", () => {
  it("renders the log entries count in the heading", () => {
    renderPage(42);

    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "audit_log.log_entries (42)"
    );
  });

  it("scopes AuditLogs to the standalone context, filtered to SummitEvent audit logs", () => {
    renderPage(0);

    const props = JSON.parse(screen.getByTestId("audit-logs-mock").textContent);
    expect(props.filterId).toBe("standalone");
    expect(props.entityFilter).toEqual(["class_name==SummitEvent"]);
  });
});
