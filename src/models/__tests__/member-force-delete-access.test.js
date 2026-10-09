import Member from "../member";

// The real access-routes data: with the yml transform stub (or a missing key) hasAccess()
// always returns true, which would show the force delete to everybody.
jest.mock("../../access-routes.yml", () => {
  const fs = require("fs");
  const path = require("path");
  const yaml = require("js-yaml");
  return yaml.load(
    fs.readFileSync(path.join(__dirname, "../../access-routes.yml"), "utf8")
  );
});

const memberWithGroups = (...codes) =>
  new Member({ groups: codes.map((code) => ({ code })) });

describe("sponsors-extra-questions-force-delete access", () => {
  const ROUTE = "sponsors-extra-questions-force-delete";

  it.each([
    "super-admins",
    "administrators",
    "summit-front-end-administrators"
  ])("is granted to %s", (group) => {
    expect(memberWithGroups(group).hasAccess(ROUTE)).toBe(true);
  });

  it.each([
    "sponsors",
    "sponsor-external-users",
    "badge-printers",
    "summit-room-administrators"
  ])("is not granted to %s", (group) => {
    expect(memberWithGroups(group).hasAccess(ROUTE)).toBe(false);
  });

  it("is not granted to a member without groups", () => {
    expect(memberWithGroups().hasAccess(ROUTE)).toBe(false);
  });
});
