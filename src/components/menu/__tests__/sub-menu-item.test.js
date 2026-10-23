import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SubMenuItem from "../sub-menu-item";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// folder > schedule > rooms is three levels deep to exercise the recursion
const subItems = [
  { name: "event_list", linkUrl: "events", accessRoute: "events" },
  {
    name: "schedule",
    subItems: [
      {
        name: "schedule_settings",
        linkUrl: "schedule/settings",
        accessRoute: "schedule"
      },
      {
        name: "rooms",
        subItems: [
          { name: "room_list", linkUrl: "rooms", accessRoute: "rooms" }
        ]
      }
    ]
  },
  {
    name: "track_chairs",
    subItems: [
      {
        name: "track_chair_list",
        linkUrl: "track-chairs",
        accessRoute: "track-chairs"
      }
    ]
  }
];

const ALL_ROUTES = ["events", "schedule", "rooms", "track-chairs"];

const memberWith = (routes) => ({
  hasAccess: (route) => routes.includes(route)
});

const renderSubMenu = (props = {}) =>
  render(
    <SubMenuItem
      name="summit_events"
      subItems={subItems}
      memberObj={memberWith(ALL_ROUTES)}
      currentPath="/app/elsewhere"
      onItemClick={jest.fn()}
      {...props}
    />
  );

describe("SubMenuItem", () => {
  test("hides the folder when none of its children are accessible", () => {
    const { container } = renderSubMenu({ memberObj: memberWith([]) });

    expect(container).toBeEmptyDOMElement();
  });

  test("hides a nested group when none of its children are accessible", () => {
    renderSubMenu({
      memberObj: memberWith(["events", "schedule", "rooms"]),
      currentPath: "/app/events"
    });

    expect(screen.getByText("menu.schedule")).toBeInTheDocument();
    expect(screen.queryByText("menu.track_chairs")).not.toBeInTheDocument();
  });

  test("opens every group down to the current route and leaves siblings closed", () => {
    renderSubMenu({ currentPath: "/app/rooms" });

    expect(screen.getByText("menu.room_list")).toBeInTheDocument();
    expect(screen.getByText("menu.track_chairs")).toBeInTheDocument();
    expect(screen.queryByText("menu.track_chair_list")).not.toBeInTheDocument();
  });

  test("renders nested groups recursively and navigates from the deepest leaf", async () => {
    const onItemClick = jest.fn();
    renderSubMenu({ onItemClick });

    expect(screen.queryByText("menu.room_list")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("menu.summit_events"));
    await userEvent.click(screen.getByText("menu.schedule"));
    await userEvent.click(screen.getByText("menu.rooms"));
    await userEvent.click(screen.getByText("menu.room_list"));

    expect(onItemClick).toHaveBeenCalledWith(expect.anything(), "rooms");
  });
});
