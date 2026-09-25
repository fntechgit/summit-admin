import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Menu from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("react-router-dom", () => ({
  withRouter: (component) => component
}));

jest.mock("../../../models/member", () =>
  jest.fn().mockImplementation(() => ({
    hasAccess: () => true
  }))
);

jest.mock("../menu-definition", () => ({
  getGlobalItems: () => [{ name: "directory", linkUrl: "directory" }],
  getSummitItems: () => [{ name: "summit_dashboard", linkUrl: "dashboard" }]
}));

const mockHistory = {
  push: jest.fn(),
  location: { pathname: "/app/directory" }
};

const renderMenu = (props = {}) =>
  render(<Menu member={{}} history={mockHistory} {...props} />);

describe("Menu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the general section", () => {
    renderMenu();
    expect(screen.getByText("menu.general")).toBeInTheDocument();
  });

  test("does not render summit section when currentSummit is not provided", () => {
    renderMenu();
    expect(screen.queryByText("Test Summit")).not.toBeInTheDocument();
  });

  test("renders summit section when currentSummit has a valid id", () => {
    renderMenu({ currentSummit: { id: 1, name: "Test Summit" } });
    expect(screen.getByText("Test Summit")).toBeInTheDocument();
  });

  test("does not render summit section when currentSummit.id is 0", () => {
    renderMenu({ currentSummit: { id: 0, name: "Test Summit" } });
    expect(screen.queryByText("Test Summit")).not.toBeInTheDocument();
  });

  test("navigates when a menu item is clicked", () => {
    renderMenu();
    const link = screen.getByText("menu.directory");
    fireEvent.click(link);
    expect(mockHistory.push).toHaveBeenCalledWith("/app/directory");
  });

  // The onClose path has no "already closed" case to assert: MUI's Modal only
  // attaches its backdrop/Escape handlers while open, so onClose cannot fire at
  // all when menuOpen is false. The menu-item click below is the path that can
  // reach closeMenu in either state, so that is where the guard is pinned.
  describe("closeMenu is gated on menuOpen", () => {
    test("Drawer onClose (backdrop click) calls toggleMenu when open", async () => {
      const toggleMenu = jest.fn();
      const { baseElement } = renderMenu({ menuOpen: true, toggleMenu });

      await userEvent.click(baseElement.querySelector(".MuiBackdrop-root"));

      expect(toggleMenu).toHaveBeenCalledTimes(1);
    });

    test("Drawer onClose (Escape) calls toggleMenu when open", async () => {
      const toggleMenu = jest.fn();
      renderMenu({ menuOpen: true, toggleMenu });

      await userEvent.keyboard("{Escape}");

      expect(toggleMenu).toHaveBeenCalledTimes(1);
    });

    test("a menu item click calls toggleMenu when the menu is open", async () => {
      const toggleMenu = jest.fn();
      renderMenu({ menuOpen: true, toggleMenu });

      await userEvent.click(screen.getByText("menu.directory"));

      expect(toggleMenu).toHaveBeenCalledTimes(1);
      expect(mockHistory.push).toHaveBeenCalledWith("/app/directory");
    });

    test("a menu item click does not call toggleMenu when already closed", async () => {
      const toggleMenu = jest.fn();
      renderMenu({ menuOpen: false, toggleMenu });

      await userEvent.click(screen.getByText("menu.directory"));

      // Navigation still happens; only the close is suppressed.
      expect(toggleMenu).not.toHaveBeenCalled();
      expect(mockHistory.push).toHaveBeenCalledWith("/app/directory");
    });
  });
});
