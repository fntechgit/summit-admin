import React from "react";
import { render, screen } from "@testing-library/react";
import UsersTable from "../users-table";

// Capture the data passed to MuiTable so we can assert on processed userData
jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => {
  const MockMuiTable = ({ data }) => (
    <div data-testid="mui-table">
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          <span data-testid={`access-rights-str-${row.id}`}>
            {JSON.stringify(row.access_rights_str)}
          </span>
          <span data-testid={`access-rights-${row.id}`}>
            {JSON.stringify(row.access_rights)}
          </span>
        </div>
      ))}
    </div>
  );
  return MockMuiTable;
});

jest.mock("../../../../../components/mui/chip-list", () => {
  const MockChipList = ({ chips }) => (
    <span>{chips ? chips.join(", ") : ""}</span>
  );
  return MockChipList;
});

const defaultUsers = {
  items: [],
  order: "id",
  orderDir: 1,
  currentPage: 1,
  perPage: 10,
  totalCount: 0
};

const defaultProps = {
  users: defaultUsers,
  term: "",
  onEdit: jest.fn(),
  getUsers: jest.fn(),
  deleteSponsorUser: jest.fn()
};

// Old API shape: sponsor_id is a flat field; sponsor object carries only company_name
const userWithFlatSponsorId = (sponsorId) => ({
  id: 1,
  first_name: "Alice",
  email: "alice@example.com",
  is_active: true,
  access_rights: [
    {
      id: 10,
      sponsor_id: sponsorId,
      sponsor: { company_name: "Acme Corp" }, // no sponsor.id — old shape
      groups: [{ id: 100, name: "admin" }]
    }
  ]
});

// New API shape: sponsor_id is absent; id lives only inside the nested sponsor object
const userWithNestedSponsorId = (sponsorId) => ({
  id: 2,
  first_name: "Bob",
  email: "bob@example.com",
  is_active: true,
  access_rights: [
    {
      id: 20,
      // sponsor_id intentionally absent (undefined) — new shape
      sponsor: { id: sponsorId, company_name: "Beta Inc" },
      groups: [{ id: 101, name: "viewer" }]
    }
  ]
});

// Multiple access_rights using the old flat shape (two different sponsors)
const userWithMultipleSponsorAccessRights = () => ({
  id: 3,
  first_name: "Carol",
  email: "carol@example.com",
  is_active: true,
  access_rights: [
    {
      id: 30,
      sponsor_id: 42,
      sponsor: { company_name: "Acme Corp" },
      groups: [{ id: 100, name: "admin" }]
    },
    {
      id: 31,
      sponsor_id: 99,
      sponsor: { company_name: "Other Corp" },
      groups: [{ id: 102, name: "contributor" }]
    }
  ]
});

const renderUsersTable = (sponsorId, items) =>
  render(
    <UsersTable
      {...defaultProps}
      sponsorId={sponsorId}
      users={{ ...defaultUsers, items, totalCount: items.length }}
    />
  );

describe("UsersTable — access rights filtering", () => {
  // ─── No sponsorId filter ───────────────────────────────────────────────────

  describe("when no sponsorId is provided", () => {
    it("shows all access_rights regardless of sponsor shape", () => {
      const items = [userWithFlatSponsorId(42), userWithNestedSponsorId(99)];
      renderUsersTable(null, items);

      // Both rows appear in the table
      expect(screen.getByTestId("row-1")).toBeTruthy();
      expect(screen.getByTestId("row-2")).toBeTruthy();

      // Each row exposes its access right groups
      const row1Rights = JSON.parse(
        screen.getByTestId("access-rights-str-1").textContent
      );
      expect(row1Rights).toEqual(["Admin"]);

      const row2Rights = JSON.parse(
        screen.getByTestId("access-rights-str-2").textContent
      );
      expect(row2Rights).toEqual(["Viewer"]);
    });
  });

  // ─── Previous behaviour (flat sponsor_id) — still works ───────────────────

  describe("previous behaviour: flat sponsor_id is still respected", () => {
    it("includes an access_right whose sponsor_id matches the filter", () => {
      renderUsersTable(42, [userWithFlatSponsorId(42)]);

      const rights = JSON.parse(
        screen.getByTestId("access-rights-str-1").textContent
      );
      expect(rights).toEqual(["Admin"]);
    });

    it("excludes an access_right whose sponsor_id does not match the filter", () => {
      renderUsersTable(42, [userWithFlatSponsorId(99)]);

      // The row still renders, but access_rights_str is empty because no AR matched
      const rights = JSON.parse(
        screen.getByTestId("access-rights-str-1").textContent
      );
      expect(rights).toEqual([]);
    });

    it("only shows access_rights for the matching sponsor when user has multiple sponsors", () => {
      renderUsersTable(42, [userWithMultipleSponsorAccessRights()]);

      const rights = JSON.parse(
        screen.getByTestId("access-rights-str-3").textContent
      );
      // Only the "admin" group from sponsor 42 should appear, not "contributor" from 99
      expect(rights).toEqual(["Admin"]);
      expect(rights).not.toContain("Contributor");
    });
  });

  // ─── Bug fix: nested sponsor.id (was broken before PR #846) ───────────────

  describe("current behaviour: falls back to sponsor.id when sponsor_id is absent/nullish", () => {
    it("includes an access_right with missing sponsor_id and matching sponsor.id", () => {
      // PREVIOUS BEHAVIOUR: `ar.sponsor_id === sponsorId` → `null === 99` → false → no match
      // CURRENT BEHAVIOUR:  `(ar.sponsor_id ?? ar.sponsor?.id) === sponsorId`
      //                     → `(null ?? 99) === 99` → true → match
      renderUsersTable(99, [userWithNestedSponsorId(99)]);

      const rights = JSON.parse(
        screen.getByTestId("access-rights-str-2").textContent
      );
      expect(rights).toEqual(["Viewer"]);
    });

    it("excludes an access_right with sponsor_id=null and non-matching sponsor.id", () => {
      // sponsor.id (99) does not match sponsorId (42) — should be filtered out
      renderUsersTable(42, [userWithNestedSponsorId(99)]);

      const rights = JSON.parse(
        screen.getByTestId("access-rights-str-2").textContent
      );
      expect(rights).toEqual([]);
    });

    it("falls back correctly when sponsor_id is undefined and sponsor.id matches", () => {
      const userWithUndefinedSponsorId = {
        id: 4,
        first_name: "Dan",
        email: "dan@example.com",
        is_active: true,
        access_rights: [
          {
            id: 40,
            sponsor: { id: 55, company_name: "Gamma Ltd" },
            groups: [{ id: 103, name: "editor" }]
          }
        ]
      };

      renderUsersTable(55, [userWithUndefinedSponsorId]);

      const rights = JSON.parse(
        screen.getByTestId("access-rights-str-4").textContent
      );
      expect(rights).toEqual(["Editor"]);
    });
  });
});
