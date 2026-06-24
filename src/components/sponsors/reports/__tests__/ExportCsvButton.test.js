// src/components/sponsors/reports/__tests__/ExportCsvButton.test.js
// D8: ExportCsvButton uses uicore getCSV (fire-and-forget, generic error
// handling). Tests assert dispatch args; bespoke error-classification tests
// from the source are intentionally absent.
import "@testing-library/jest-dom";
import React from "react";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import { getCSV } from "openstack-uicore-foundation/lib/utils/actions";
import ExportCsvButton from "../ExportCsvButton";
import { getAccessTokenSafely } from "../../../../utils/methods";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  getCSV: jest.fn(() => ({ type: "GET_CSV_MOCK" }))
}));

jest.mock("../../../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(() => Promise.resolve("test-token"))
}));

describe("ExportCsvButton", () => {
  afterEach(() => jest.clearAllMocks());

  it("dispatches getCSV with url, query+access_token, and filename on click", async () => {
    const { store } = renderWithRedux(
      <ExportCsvButton
        url="https://reports-api.test/api/v1/summits/1/reports/purchase-details/csv"
        query={{ "filter[]": ["sponsor_id==17"] }}
        filename="purchase-details.csv"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    await waitFor(() => {
      expect(getCSV).toHaveBeenCalledWith(
        "https://reports-api.test/api/v1/summits/1/reports/purchase-details/csv",
        { "filter[]": ["sponsor_id==17"], access_token: "test-token" },
        "purchase-details.csv"
      );
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  it("is disabled when disabled prop is true", () => {
    renderWithRedux(
      <ExportCsvButton url="u" query={{}} filename="x.csv" disabled />
    );
    expect(screen.getByRole("button", { name: /export/i })).toBeDisabled();
  });

  it("ignores a second click while the first is in flight (synchronous ref guard)", async () => {
    let resolveToken;
    getAccessTokenSafely.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveToken = res;
        })
    );
    renderWithRedux(<ExportCsvButton url="u" query={{}} filename="x.csv" />);
    const btn = screen.getByRole("button", { name: /export/i });
    // Two native click events in the same tick — the synchronous useRef guard
    // must block the second before the first await resolves.
    await act(async () => {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    resolveToken("token");
    await waitFor(() => {
      expect(getCSV).toHaveBeenCalledTimes(1);
    });
  });

  it("uses the label prop when provided, otherwise falls back to i18n key", () => {
    const { rerender } = renderWithRedux(
      <ExportCsvButton url="u" query={{}} filename="x.csv" label="Download" />
    );
    expect(
      screen.getByRole("button", { name: "Download" })
    ).toBeInTheDocument();

    rerender(<ExportCsvButton url="u" query={{}} filename="x.csv" />);
    // With the echo mock, T.translate("sponsor_reports_page.export_csv") → key
    expect(
      screen.getByRole("button", {
        name: "sponsor_reports_page.export_csv"
      })
    ).toBeInTheDocument();
  });
});
