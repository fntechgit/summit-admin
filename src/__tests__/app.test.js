import React from "react";
import { screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../utils/test-utils";
import App from "../app";

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

// PrimaryLayout's real body is a tree of lazy route layouts we don't need. Swap
// it for the real Menu so the Drawer under test is genuine and receives the
// same componentProps AuthorizedRoute forwards in production.
jest.mock("../layouts/primary-layout", () => {
  const RealMenu = require("../components/menu").default;
  return { __esModule: true, default: (props) => <RealMenu {...props} /> };
});
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

const setCanHover = (matches) => {
  window.matchMedia = (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
};

const renderApp = () =>
  renderWithRedux(<App />, {
    initialState: {
      loggedUserState: { isLoggedUser: true, backUrl: null, member: {} },
      baseState: { loading: false }
    }
  });

const burger = () =>
  screen.getByRole("button", { name: "menu.toggle_navigation" });

// keepMounted leaves the drawer in the DOM when closed, so presence proves
// nothing — visibility is the signal.
const drawerIsOpen = () => screen.getByText("menu.general");

// The Drawer's Slide has a 225ms exit transition, so an element that is being
// closed still reports visible for a while. Fake timers let each assertion run
// after the transition has actually settled.
const settle = () =>
  act(() => {
    jest.advanceTimersByTime(500);
  });

describe("App burger wiring", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("fine pointer (hover available)", () => {
    beforeEach(() => setCanHover(true));

    test("a click arriving during a hover-open is ignored", () => {
      renderApp();
      // Held across the open: once the Modal mounts it marks the rest of the
      // app aria-hidden, so the burger is no longer reachable by role.
      const button = burger();
      expect(drawerIsOpen()).not.toBeVisible();

      // React 16 derives onMouseEnter from the top-level mouseover event.
      // No settle() here: advancing the clock would take us past the grace
      // window, which is exactly the condition under test.
      fireEvent.mouseOver(button);
      expect(drawerIsOpen()).toBeVisible();

      // Without the grace window this click toggles the drawer shut again.
      fireEvent.click(button);
      settle();
      expect(drawerIsOpen()).toBeVisible();
    });

    test("a click after the grace window still closes the drawer", () => {
      renderApp();
      const button = burger();

      fireEvent.mouseOver(button);
      expect(drawerIsOpen()).toBeVisible();

      // Past HOVER_OPEN_CLICK_GRACE_MS, so the click is no longer suppressed.
      act(() => {
        jest.advanceTimersByTime(400);
      });
      fireEvent.click(button);
      settle();
      expect(drawerIsOpen()).not.toBeVisible();
    });

    test("hover alone opens the drawer", () => {
      renderApp();
      fireEvent.mouseOver(burger());
      settle();
      expect(drawerIsOpen()).toBeVisible();
    });
  });

  describe("coarse pointer (no hover)", () => {
    beforeEach(() => setCanHover(false));

    test("hover does not open the drawer", () => {
      renderApp();
      fireEvent.mouseOver(burger());
      settle();
      expect(drawerIsOpen()).not.toBeVisible();
    });

    test("a single click opens the drawer", () => {
      renderApp();
      fireEvent.click(burger());
      settle();
      expect(drawerIsOpen()).toBeVisible();
    });
  });
});
