import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TopNav from "../index";

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

const renderNav = (props = {}) =>
  render(
    <TopNav
      title="Admin"
      menuButtonLabel="Toggle navigation menu"
      renderDrawer={() => <div>{DRAWER_TEXT}</div>}
      {...props}
    />
  );

const burger = () =>
  screen.getByRole("button", { name: "Toggle navigation menu" });

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

    test("hoverToOpen={false} leaves hover inert", () => {
      renderNav({ hoverToOpen: false });
      fireEvent.mouseOver(burger());
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

    test("closeDrawer handed to renderDrawer closes the drawer", () => {
      renderNav({
        renderDrawer: ({ closeDrawer }) => (
          <button type="button" onClick={closeDrawer}>
            {DRAWER_TEXT}
          </button>
        )
      });

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

    test("renders no burger and no drawer without renderDrawer", () => {
      renderNav({ renderDrawer: null });

      expect(
        screen.queryByRole("button", { name: "Toggle navigation menu" })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(DRAWER_TEXT)).not.toBeInTheDocument();
    });

    test("renders title, context label, actions and sub bar", () => {
      renderNav({
        contextLabel: "Summit 2026",
        actions: <button type="button">sign out</button>,
        subBar: <span>crumbs</span>
      });

      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Summit 2026")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "sign out" })
      ).toBeInTheDocument();
      expect(screen.getByText("crumbs")).toBeInTheDocument();
    });

    test("omits the sub bar when none is supplied", () => {
      renderNav();
      expect(screen.queryByText("crumbs")).not.toBeInTheDocument();
    });
  });
});
