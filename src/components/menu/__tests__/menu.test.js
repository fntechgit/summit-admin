import React from "react";
import {
  act,
  createEvent,
  render,
  screen,
  fireEvent,
  waitFor
} from "@testing-library/react";
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

// jsdom has no PointerEvent, so pointer fields are set on the event by hand.
// React builds onPointerEnter/onPointerLeave from pointerover/pointerout.
const firePointer = (type, element, fields) => {
  const event = createEvent[type](element);
  Object.entries(fields).forEach(([key, value]) =>
    Object.defineProperty(event, key, { value })
  );
  fireEvent(element, event);
};

const MOUSE_MOVE = {
  pointerType: "mouse",
  buttons: 0,
  movementX: 5,
  movementY: 0
};

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

  test("opens the drawer when the menu button is clicked", () => {
    renderMenu();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "menu.open_menu" }));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  test("closes the drawer after a menu item is clicked", async () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "menu.open_menu" }));
    fireEvent.click(screen.getByText("menu.directory"));
    await waitFor(() =>
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    );
  });

  describe("rail", () => {
    const getRail = () =>
      screen.getByTestId("ChevronRightIcon").closest("button");
    const getDrawer = () => screen.getByRole("navigation").parentElement;
    const isOpen = () => !!screen.queryByRole("navigation");

    const hoverOpen = () => {
      firePointer("pointerOver", getRail(), { pointerType: "mouse" });
      firePointer("pointerMove", getRail(), MOUSE_MOVE);
      act(() => jest.advanceTimersByTime(200));
    };

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test("opens the drawer when a mouse moves onto it", () => {
      renderMenu();
      firePointer("pointerOver", getRail(), { pointerType: "mouse" });
      firePointer("pointerMove", getRail(), MOUSE_MOVE);
      expect(isOpen()).toBe(false);
      act(() => jest.advanceTimersByTime(200));
      expect(isOpen()).toBe(true);
    });

    test("does not open the drawer when a mouse leaves it before the delay", () => {
      renderMenu();
      firePointer("pointerMove", getRail(), MOUSE_MOVE);
      firePointer("pointerOut", getRail(), { pointerType: "mouse" });
      act(() => jest.runOnlyPendingTimers());
      expect(isOpen()).toBe(false);
    });

    test("does not open the drawer when it ends up under a still mouse", () => {
      renderMenu();
      firePointer("pointerOver", getRail(), { pointerType: "mouse" });
      firePointer("pointerMove", getRail(), {
        ...MOUSE_MOVE,
        movementX: 0,
        movementY: 0
      });
      act(() => jest.runOnlyPendingTimers());
      expect(isOpen()).toBe(false);
    });

    test("does not open the drawer when a mouse drags over it", () => {
      renderMenu();
      firePointer("pointerMove", getRail(), { ...MOUSE_MOVE, buttons: 1 });
      act(() => jest.runOnlyPendingTimers());
      expect(isOpen()).toBe(false);
    });

    test.each(["touch", "pen"])(
      "does not open the drawer when a %s pointer passes over it",
      (pointerType) => {
        renderMenu();
        firePointer("pointerOver", getRail(), { pointerType });
        firePointer("pointerMove", getRail(), { ...MOUSE_MOVE, pointerType });
        act(() => jest.runOnlyPendingTimers());
        expect(isOpen()).toBe(false);
      }
    );

    test("opens the drawer when tapped", () => {
      renderMenu();
      fireEvent.click(getRail());
      expect(isOpen()).toBe(true);
    });

    test("opens the drawer again after an item is picked", async () => {
      renderMenu();
      fireEvent.click(getRail());
      fireEvent.click(screen.getByText("menu.directory"));
      await waitFor(() => expect(isOpen()).toBe(false));
      fireEvent.click(getRail());
      expect(isOpen()).toBe(true);
    });

    test("closes the drawer when the mouse leaves it", async () => {
      renderMenu();
      fireEvent.click(getRail());
      firePointer("pointerOut", getDrawer(), { pointerType: "mouse" });
      await waitFor(() => expect(isOpen()).toBe(false));
    });

    test.each(["touch", "pen"])(
      "keeps the drawer open when a %s pointer leaves it",
      (pointerType) => {
        renderMenu();
        fireEvent.click(getRail());
        firePointer("pointerOut", getDrawer(), { pointerType });
        act(() => jest.runOnlyPendingTimers());
        expect(isOpen()).toBe(true);
      }
    );

    test("moves focus into the drawer and locks scroll when tapped", () => {
      renderMenu();
      fireEvent.click(getRail());
      expect(getDrawer().contains(document.activeElement)).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");
    });

    test("leaves focus and page scroll alone when opened by hover", async () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();
      renderMenu();
      hoverOpen();
      expect(isOpen()).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(document.body.style.overflow).not.toBe("hidden");
      firePointer("pointerOut", getDrawer(), { pointerType: "mouse" });
      await waitFor(() => expect(isOpen()).toBe(false));
      expect(document.activeElement).toBe(input);
      input.remove();
    });

    test("clears a pending hover open on unmount", () => {
      const { unmount } = renderMenu();
      firePointer("pointerMove", getRail(), MOUSE_MOVE);
      expect(jest.getTimerCount()).toBe(1);
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
