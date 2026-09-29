import React from "react";
import { screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../utils/test-utils";
import App from "../app";
import history from "../history";

// --- i18n: app.js and menu/index.js import different entry points ---
jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// --- uicore boundaries: keep the real module graph out of the test ---
jest.mock("openstack-uicore-foundation/lib/i18n", () => ({
  setAppTexts: jest.fn()
}));
jest.mock("openstack-uicore-foundation/lib/components/ajaxloader", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  getBackURL: () => "/app"
}));
jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  resetLoading: () => () => {}
}));
jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  doLogout: () => () => {},
  onUserAuth: () => () => {},
  getUserInfo: () => () => {}
}));
// getIdToken returns null so render skips the IdTokenVerifier branch entirely.
jest.mock("openstack-uicore-foundation/lib/security/methods", () => ({
  initLogOut: jest.fn(),
  doLoginBasicLogin: jest.fn(),
  getIdToken: () => null
}));

jest.mock("@sentry/react", () => ({
  ErrorBoundary: ({ children }) => children,
  init: jest.fn()
}));
jest.mock("../components/SentryErrorComponent", () => ({
  SentryFallbackFunction: () => () => null
}));
jest.mock("react-breadcrumbs", () => ({
  Breadcrumbs: () => null,
  Breadcrumb: () => null
}));
jest.mock("../actions/base-actions", () => ({
  getTimezones: () => () => {}
}));

// Route the app at /app so AuthorizedRoute renders the (mocked) PrimaryLayout.
jest.mock("../history", () => {
  const { createMemoryHistory } = require("history");
  return {
    __esModule: true,
    default: createMemoryHistory({ initialEntries: ["/app"] })
  };
});


jest.mock("../layouts/primary-layout", () => ({
  __esModule: true,
  default: () => <div data-testid="page" />
}));
jest.mock("../components/menu/menu-definition", () => ({
  getGlobalItems: () => [{ name: "directory", linkUrl: "directory" }],
  getSummitItems: () => []
}));
jest.mock("../models/member", () =>
  jest.fn().mockImplementation(() => ({ hasAccess: () => true }))
);

// Routes that are never matched at /app, but are imported at module load.
jest.mock("../routes/authorization-callback-route", () => () => null);
jest.mock("../routes/logout-callback-route", () => () => null);
jest.mock("../routes/default-route", () => () => null);
jest.mock("../pages/custom-error-page", () => () => null);

const renderApp = () =>
  renderWithRedux(<App />, {
    initialState: {
      loggedUserState: { isLoggedUser: true, backUrl: null, member: {} },
      baseState: { loading: false },
      currentSummitState: { currentSummit: null }
    }
  });

const burger = () =>
  screen.getByRole("button", { name: "menu.toggle_navigation" });

// keepMounted leaves the drawer in the DOM when closed, so presence proves
// nothing — visibility is the signal.
const drawer = () => screen.getByText("menu.general");

const settle = () =>
  act(() => {
    jest.advanceTimersByTime(500);
  });

// TopNav's open/close behaviour is covered in its own spec. What is only
// observable here is that App hands it the right pieces: the burger opens a
// drawer containing the real Menu, and a menu item navigates and dismisses it.
describe("App nav wiring", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("the burger opens a drawer holding the app menu", () => {
    renderApp();
    expect(drawer()).not.toBeVisible();

    fireEvent.click(burger());
    settle();

    expect(drawer()).toBeVisible();
    expect(screen.getByText("menu.directory")).toBeVisible();
  });

  test("choosing a menu item navigates and closes the drawer", () => {
    renderApp();
    fireEvent.click(burger());
    settle();

    fireEvent.click(screen.getByText("menu.directory"));
    settle();

    expect(history.location.pathname).toBe("/app/directory");
    expect(drawer()).not.toBeVisible();
  });
});
