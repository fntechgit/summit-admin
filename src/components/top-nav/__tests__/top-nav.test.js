import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TopNav from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));
jest.mock("openstack-uicore-foundation/lib/security/methods", () => ({
  initLogOut: jest.fn(),
  getIdToken: () => null
}));
jest.mock("react-breadcrumbs", () => ({
  Breadcrumbs: () => <span>crumbs</span>
}));
// Stands in for the app menu: a navigation item that dismisses the drawer.
jest.mock("../../menu", () => ({ onNavigate }) => (
  <button type="button" onClick={onNavigate}>
    drawer contents
  </button>
));

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

const DRAWER_TEXT = "drawer contents";

const renderNav = (props = {}) => render(<TopNav {...props} />);

const burger = () =>
  screen.getByRole("button", { name: "menu.toggle_navigation" });

// keepMounted leaves the drawer in the DOM when closed, so presence proves
// nothing — visibility is the signal.
const drawer = () => screen.getByText(DRAWER_TEXT);

// The Drawer's Slide has a 225ms exit transition, so an element being closed
// still reports visible for a while. Fake timers let each assertion run after
// the transition has actually settled.
const settle = () =>
  act(() => {
    jest.advanceTimersByTime(500);
  });

describe("TopNav", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("fine pointer (hover available)", () => {
    beforeEach(() => setCanHover(true));

    test("hover alone opens the drawer", () => {
      renderNav();
      fireEvent.mouseOver(burger());
      settle();
      expect(drawer()).toBeVisible();
    });

    test("a click arriving during a hover-open is ignored", () => {
      renderNav();
      // Held across the open: once the Modal mounts it marks the rest of the
      // app aria-hidden, so the burger is no longer reachable by role.
      const button = burger();
      expect(drawer()).not.toBeVisible();

      // React 16 derives onMouseEnter from the top-level mouseover event. No
      // settle() here: advancing the clock would take us past the grace
      // window, which is exactly the condition under test.
      fireEvent.mouseOver(button);
      expect(drawer()).toBeVisible();

      fireEvent.click(button);
      settle();
      expect(drawer()).toBeVisible();
    });

    test("a click after the grace window still closes the drawer", () => {
      renderNav();
      const button = burger();

      fireEvent.mouseOver(button);
      expect(drawer()).toBeVisible();

      act(() => {
        jest.advanceTimersByTime(400);
      });
      fireEvent.click(button);
      settle();
      expect(drawer()).not.toBeVisible();
    });

    test("leaving the burger closes the drawer after the grace delay", () => {
      renderNav();
      const button = burger();

      fireEvent.mouseOver(button);
      expect(drawer()).toBeVisible();

      fireEvent.mouseOut(button);
      settle();
      expect(drawer()).not.toBeVisible();
    });
  });

  describe("coarse pointer (no hover)", () => {
    beforeEach(() => setCanHover(false));

    test("hover does not open the drawer", () => {
      renderNav();
      fireEvent.mouseOver(burger());
      settle();
      expect(drawer()).not.toBeVisible();
    });

    test("a single click opens the drawer", () => {
      renderNav();
      fireEvent.click(burger());
      settle();
      expect(drawer()).toBeVisible();
    });

    test("navigating from the menu closes the drawer", () => {
      renderNav();

      fireEvent.click(burger());
      settle();
      expect(drawer()).toBeVisible();

      fireEvent.click(drawer());
      settle();
      expect(drawer()).not.toBeVisible();
    });
  });

  describe("composition", () => {
    beforeEach(() => setCanHover(false));

    test("renders title, summit name, sign out and breadcrumbs", () => {
      renderNav({ currentSummit: { id: 1, name: "Summit 2026" } });

      expect(screen.getByText("landing.os_summit_admin")).toBeInTheDocument();
      expect(screen.getByText("Summit 2026")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "landing.sign_out" })
      ).toBeInTheDocument();
      expect(screen.getByText("crumbs")).toBeInTheDocument();
    });

    test("isLoggedUser={false} suppresses sign out, breadcrumbs and drawer", () => {
      renderNav({ isLoggedUser: false });

      expect(
        screen.queryByRole("button", { name: "menu.toggle_navigation" })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(DRAWER_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText("crumbs")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "landing.sign_out" })
      ).not.toBeInTheDocument();
      // The title still renders; it is the only thing left on the bar.
      expect(screen.getByText("landing.os_summit_admin")).toBeInTheDocument();
    });
  });
});
