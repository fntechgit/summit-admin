import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import ReportListPage from "../report-list-page";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../access-routes.yml", () => ({
  reports: [
    "super-admins",
    "administrators",
    "summit-front-end-administrators",
    "summit-registration-administrators",
    "summit-room-administrators"
  ]
}));

const mockStore = configureStore([]);

const renderPage = (groups) => {
  const store = mockStore({
    currentSummitState: { currentSummit: { id: 1, event_types: [] } },
    loggedUserState: { member: { groups: groups.map((code) => ({ code })) } }
  });
  return render(
    <Provider store={store}>
      <ReportListPage history={{ push: jest.fn() }} />
    </Provider>
  );
};

describe("ReportListPage", () => {
  it("shows only the four room reports to summit-room-administrators", () => {
    renderPage(["summit-room-administrators"]);

    expect(screen.getAllByRole("button")).toHaveLength(4);
    [
      "reports.presentation_report",
      "reports.speaker_report",
      "reports.room_manifest_report",
      "reports.presentation_video_report"
    ].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it("shows every report to summit-front-end-administrators", () => {
    renderPage(["summit-front-end-administrators"]);
    expect(screen.getAllByRole("button")).toHaveLength(10);
  });

  it("shows every report when room admin also has another reports group", () => {
    renderPage([
      "summit-room-administrators",
      "summit-registration-administrators"
    ]);
    expect(screen.getAllByRole("button")).toHaveLength(10);
  });
});
