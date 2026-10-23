import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TopNav, { addMenuLinks, insertMenuFolders } from "../index";

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

  describe("drawer", () => {
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

describe("insertMenuFolders", () => {
  const SUMMIT = "/app/summits/1";
  const HOME = { id: "home", title: "home", pathname: "/app" };
  const SUMMIT_CRUMB = { id: "summit", title: "Summit", pathname: SUMMIT };
  // the i18n mock returns keys, so the section crumb reads like its menu folder
  const ACTIVITIES = {
    id: "activities",
    title: "menu.events",
    pathname: `${SUMMIT}/events`
  };
  const SCHEDULE = {
    id: "schedule",
    title: "Schedule",
    pathname: `${SUMMIT}/events/schedule`
  };
  const INVENTORY = {
    id: "inv",
    title: "Inventory",
    pathname: "/app/inventory"
  };

  const menuMap = new Map([
    [`${SUMMIT}/events`, ["program_management", "events"]],
    [`${SUMMIT}/events/schedule`, ["program_management"]],
    ["/app/inventory", ["sponsors_services"]]
  ]);
  const setCrumbs = insertMenuFolders(menuMap, 1);

  const titles = (crumbs) =>
    crumbs.map((c) =>
      typeof c.title === "string" ? c.title : c.title.props.children
    );

  test("list page: folders after Summit, skipping the one that repeats the section", () => {
    expect(titles(setCrumbs([HOME, SUMMIT_CRUMB, ACTIVITIES]))).toEqual([
      "home",
      "Summit",
      "menu.program_management",
      "menu.events"
    ]);
  });

  test("detail page: matches the section crumb and keeps the detail crumb", () => {
    const talk = {
      id: "talk",
      title: "Talk X",
      pathname: `${SUMMIT}/events/42`
    };
    expect(titles(setCrumbs([HOME, SUMMIT_CRUMB, ACTIVITIES, talk]))).toEqual([
      "home",
      "Summit",
      "menu.program_management",
      "menu.events",
      "Talk X"
    ]);
  });

  test("nested link: deepest match wins and route crumbs above it are kept", () => {
    expect(
      titles(setCrumbs([HOME, SUMMIT_CRUMB, ACTIVITIES, SCHEDULE]))
    ).toEqual([
      "home",
      "Summit",
      "menu.program_management",
      "menu.events",
      "Schedule"
    ]);
  });

  test("skips a folder that repeats any route crumb, not only the matched one", () => {
    const sponsors = {
      id: "sponsors",
      title: "menu.sponsors",
      pathname: `${SUMMIT}/sponsors`
    };
    const forms = {
      id: "forms",
      title: "Forms",
      pathname: `${SUMMIT}/sponsors/forms`
    };
    const setSponsorCrumbs = insertMenuFolders(
      new Map([[forms.pathname, ["sponsors"]]]),
      1
    );
    expect(
      titles(setSponsorCrumbs([HOME, SUMMIT_CRUMB, sponsors, forms]))
    ).toEqual(["home", "Summit", "menu.sponsors", "Forms"]);
  });

  test("global page: folders after Home", () => {
    expect(titles(setCrumbs([HOME, INVENTORY]))).toEqual([
      "home",
      "menu.sponsors_services",
      "Inventory"
    ]);
  });

  test("folder crumbs link to the anchor, not the current page", () => {
    const crumbs = setCrumbs([HOME, SUMMIT_CRUMB, ACTIVITIES]);
    expect(crumbs[2].pathname).toBe(SUMMIT);
  });

  test("unchanged when the page is not in the menu", () => {
    const notInMenu = [
      HOME,
      SUMMIT_CRUMB,
      { id: "x", title: "X", pathname: `${SUMMIT}/x` }
    ];
    expect(setCrumbs(notInMenu)).toBe(notInMenu);
  });
});

describe("addMenuLinks", () => {
  const items = [
    {
      name: "program_management",
      subItems: [
        {
          name: "events",
          subItems: [{ name: "event_list", linkUrl: "summits/1/events" }]
        },
        { name: "schedule", linkUrl: "summits/1/events/schedule" }
      ]
    },
    { name: "dashboard", linkUrl: "summits/1/dashboard" }
  ];
  const map = addMenuLinks(items);

  test("keys each link by its crumb pathname with its folders", () => {
    expect(map.get("/app/summits/1/events")).toEqual([
      "program_management",
      "events"
    ]);
  });

  test("a link's folders do not include sibling folders visited before it", () => {
    expect(map.get("/app/summits/1/events/schedule")).toEqual([
      "program_management"
    ]);
  });

  test("a top-level link has no folders", () => {
    expect(map.get("/app/summits/1/dashboard")).toEqual([]);
  });

  test("global and summit links share one lookup", () => {
    const shared = addMenuLinks([
      { name: "inventory", linkUrl: "inventory" },
      ...items
    ]);
    expect(shared.has("/app/inventory")).toBe(true);
    expect(shared.has("/app/summits/1/events")).toBe(true);
  });
});
