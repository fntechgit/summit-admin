import React from "react";
import { render, screen } from "@testing-library/react";
import { Router, Switch } from "react-router-dom";
import { createMemoryHistory } from "history";
import "@testing-library/jest-dom";
import AuthorizedRoute from "../authorized-route";

const ProbeComponent = () => <div data-testid="probe" />;

const renderRoute = (isLoggedUser) => {
  const history = createMemoryHistory({ initialEntries: ["/app"] });
  const view = render(
    <Router history={history}>
      <Switch>
        <AuthorizedRoute
          isLoggedUser={isLoggedUser}
          path="/app"
          component={ProbeComponent}
        />
      </Switch>
    </Router>
  );
  return { ...view, history };
};

describe("AuthorizedRoute", () => {
  test("renders the component when logged in", () => {
    renderRoute(true);

    expect(screen.getByTestId("probe")).toBeInTheDocument();
  });

  test("redirects instead of rendering the component when logged out", () => {
    const { history } = renderRoute(false);

    expect(screen.queryByTestId("probe")).not.toBeInTheDocument();
    // authorized-route builds the query into the pathname field itself.
    expect(history.location.pathname).toBe("/?BackUrl=%2Fapp");
  });
});
