import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Menu from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("react-router-dom", () => ({
  withRouter: (component) => component
}));

jest.mock("../../../models/member", () => jest.fn().mockImplementation(() => ({
    hasAccess: () => true
  })));

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
});
