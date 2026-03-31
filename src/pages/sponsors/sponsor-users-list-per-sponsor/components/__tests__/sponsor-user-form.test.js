import React from "react";
import { render, screen } from "@testing-library/react";
import SponsorUserForm from "../sponsor-user-form";

// Minimal T mock — returns the key as the translation
jest.mock("i18n-react", () => ({
  translate: (key) => key
}));

const userGroups = [
  { id: 100, name: "admin" },
  { id: 101, name: "viewer" },
  { id: 102, name: "contributor" }
];

// Builds a processed user as produced by UsersTable.userData
const buildProcessedUser = ({
  access_rights_id = [],
  sponsors_str = ["Acme Corp"]
} = {}) => ({
  id: 1,
  first_name: "Alice",
  last_name: "Smith",
  email: "alice@example.com",
  is_active: true,
  sponsors_str,
  access_rights_id,
  // Raw access_rights is kept on the object too (as UsersTable spreads ...u)
  access_rights: []
});

const renderForm = (user, onSubmit = jest.fn()) =>
  render(
    <SponsorUserForm user={user} userGroups={userGroups} onSubmit={onSubmit} />
  );

// Returns only the group checkboxes, excluding the is_active switch
const getGroupCheckboxes = () =>
  screen.getAllByRole("checkbox").filter((cb) => cb.name !== "is_active");

describe("SponsorUserForm — access rights checkboxes", () => {
  // ─── Previous behaviour: empty access_rights_id → no checkboxes checked ───

  describe("previous behaviour: user has no access rights for this sponsor", () => {
    it("renders all checkboxes unchecked when access_rights_id is empty", () => {
      const user = buildProcessedUser({ access_rights_id: [] });
      renderForm(user);

      const checkboxes = getGroupCheckboxes();
      expect(checkboxes).toHaveLength(userGroups.length);
      checkboxes.forEach((cb) => expect(cb.checked).toBe(false));
    });
  });

  // ─── Current behaviour: access_rights_id populated → correct boxes checked ─

  describe("current behaviour: access_rights_id reflects sponsor-specific permissions", () => {
    it("checks only the checkboxes whose ids are in access_rights_id", () => {
      // Simulates the fix in users-table.js correctly populating access_rights_id
      // for users whose access_right had sponsor_id=null but a matching sponsor.id
      const user = buildProcessedUser({ access_rights_id: [100, 101] });
      renderForm(user);

      const checkboxes = screen.getAllByRole("checkbox");
      // Group 100 (admin) → checked
      const adminCheckbox = checkboxes.find((cb) => String(cb.value) === "100");
      expect(adminCheckbox.checked).toBe(true);

      // Group 101 (viewer) → checked
      const viewerCheckbox = checkboxes.find(
        (cb) => String(cb.value) === "101"
      );
      expect(viewerCheckbox.checked).toBe(true);

      // Group 102 (contributor) → NOT checked
      const contributorCheckbox = checkboxes.find(
        (cb) => String(cb.value) === "102"
      );
      expect(contributorCheckbox.checked).toBe(false);
    });

    it("checks all checkboxes when user has all groups", () => {
      const user = buildProcessedUser({ access_rights_id: [100, 101, 102] });
      renderForm(user);

      const checkboxes = getGroupCheckboxes();
      checkboxes.forEach((cb) => expect(cb.checked).toBe(true));
    });

    it("reads initial values from access_rights_id, not from raw access_rights array", () => {
      // The form's initial values come from buildInitialValues which does:
      //   normalized.access_rights = data.access_rights_id
      // So even if raw access_rights is non-empty it's the _ids_ that drive the UI
      const user = {
        ...buildProcessedUser({ access_rights_id: [101] }),
        // raw access_rights objects — intentionally different to confirm IDs win
        access_rights: [
          {
            id: 99,
            sponsor: { id: 42, company_name: "Acme Corp" },
            groups: [
              { id: 100, name: "admin" },
              { id: 102, name: "contributor" }
            ]
          }
        ]
      };
      renderForm(user);

      const checkboxes = screen.getAllByRole("checkbox");

      const adminCheckbox = checkboxes.find((cb) => String(cb.value) === "100");
      const viewerCheckbox = checkboxes.find(
        (cb) => String(cb.value) === "101"
      );
      const contributorCheckbox = checkboxes.find(
        (cb) => String(cb.value) === "102"
      );

      // Only viewer (101) is checked because access_rights_id=[101]
      expect(adminCheckbox.checked).toBe(false);
      expect(viewerCheckbox.checked).toBe(true);
      expect(contributorCheckbox.checked).toBe(false);
    });
  });

  // ─── Form fields ───────────────────────────────────────────────────────────

  describe("static form fields", () => {
    it("displays the first sponsor as the sponsor field value", () => {
      const user = buildProcessedUser({
        access_rights_id: [100],
        sponsors_str: ["Beta Corp"]
      });
      renderForm(user);

      const sponsorInput = screen.getByDisplayValue("Beta Corp");
      expect(sponsorInput).toBeTruthy();
    });

    it("renders a checkbox for each user group option", () => {
      renderForm(buildProcessedUser());

      const checkboxes = getGroupCheckboxes();
      expect(checkboxes).toHaveLength(userGroups.length);
    });
  });
});
