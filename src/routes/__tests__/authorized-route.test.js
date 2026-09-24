import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router, Switch } from "react-router-dom";
import { createMemoryHistory } from "history";
import "@testing-library/jest-dom";
import AuthorizedRoute from "../authorized-route";

// Renders whatever props it receives so the test can assert on forwarding
// rather than on any particular page's markup.
const ProbeComponent = ({ menuOpen, openedByHover, toggleMenu }) => (
  <div>
    <span data-testid="menu-open">{String(menuOpen)}</span>
    <span data-testid="opened-by-hover">{String(openedByHover)}</span>
    <button type="button" onClick={toggleMenu}>
      toggle
    </button>
  </div>
);

const renderRoute = (isLoggedUser, componentProps) => {
  const history = createMemoryHistory({ initialEntries: ["/app"] });
  const view = render(
    <Router history={history}>
      <Switch>
        <AuthorizedRoute
          isLoggedUser={isLoggedUser}
          path="/app"
          component={ProbeComponent}
          componentProps={componentProps}
        />
      </Switch>
    </Router>
  );
  return { ...view, history };
};

describe("AuthorizedRoute", () => {
  test("forwards componentProps to the rendered component when logged in", () => {
    const toggleMenu = jest.fn();
    renderRoute(true, { menuOpen: true, openedByHover: true, toggleMenu });

    expect(screen.getByTestId("menu-open")).toHaveTextContent("true");
    expect(screen.getByTestId("opened-by-hover")).toHaveTextContent("true");
  });

  test("forwarded callbacks stay callable", async () => {
    const toggleMenu = jest.fn();
    renderRoute(true, { menuOpen: false, openedByHover: false, toggleMenu });

    await userEvent.click(screen.getByRole("button", { name: "toggle" }));

    expect(toggleMenu).toHaveBeenCalledTimes(1);
  });

  test("redirects instead of rendering the component when logged out", () => {
    const { history } = renderRoute(false, { menuOpen: true });

    expect(screen.queryByTestId("menu-open")).not.toBeInTheDocument();
    // authorized-route builds the query into the pathname field itself.
    expect(history.location.pathname).toBe("/?BackUrl=%2Fapp");
  });
});
