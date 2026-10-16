import { addMenuLinks } from "../menu-path";

const SUMMIT = "/app/summits/1";

const items = [
  {
    name: "program_management",
    subItems: [
      {
        name: "events",
        isGroup: true,
        subItems: [{ name: "event_list", linkUrl: "summits/1/events" }]
      },
      { name: "schedule", linkUrl: "summits/1/events/schedule" }
    ]
  },
  { name: "dashboard", linkUrl: "summits/1/dashboard" }
];

describe("addMenuLinks", () => {
  const map = addMenuLinks(items, SUMMIT, new Map());

  test("keys each link by its crumb pathname with its folders and anchor", () => {
    expect(map.get("/app/summits/1/events")).toEqual({
      folders: ["program_management", "events"],
      anchor: SUMMIT
    });
  });

  test("a link's folders do not include sibling folders visited before it", () => {
    expect(map.get("/app/summits/1/events/schedule").folders).toEqual([
      "program_management"
    ]);
  });

  test("a top-level link has no folders", () => {
    expect(map.get("/app/summits/1/dashboard").folders).toEqual([]);
  });

  test("adds to an existing map so global and summit links share one lookup", () => {
    const shared = addMenuLinks(
      [{ name: "inventory", linkUrl: "inventory" }],
      "/app",
      new Map()
    );
    addMenuLinks(items, SUMMIT, shared);
    expect(shared.get("/app/inventory").anchor).toBe("/app");
    expect(shared.get("/app/summits/1/events").anchor).toBe(SUMMIT);
  });
});
