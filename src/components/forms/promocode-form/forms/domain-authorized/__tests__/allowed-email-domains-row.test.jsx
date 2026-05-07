import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AllowedEmailDomainsRow from "../AllowedEmailDomainsRow";

const baseEntity = (overrides = {}) => ({
  allowed_email_domains: [],
  ...overrides
});

const typeAndCommit = (container, value) => {
  const input = container.querySelector(
    "[data-testid='allowed_email_domains_input']"
  );
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter" });
};

describe("AllowedEmailDomainsRow", () => {
  it("renders the input and visible caption", () => {
    const { container } = render(
      <AllowedEmailDomainsRow entity={baseEntity()} handleChange={() => {}} />
    );
    expect(
      container.querySelector("#allowed_email_domains")
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-testid='allowed_email_domains_input']")
    ).toBeInTheDocument();
    expect(
      screen.getByText("edit_promocode.captions.allowed_email_domains")
    ).toBeInTheDocument();
  });

  it("renders within a row with data-testid='allowed-email-domains-row'", () => {
    const { container } = render(
      <AllowedEmailDomainsRow entity={baseEntity()} handleChange={() => {}} />
    );
    expect(
      container.querySelector("[data-testid=\"allowed-email-domains-row\"]")
    ).toBeInTheDocument();
  });

  it("does NOT depend on openstack-uicore-foundation TagInput (no async tag-table fetch)", () => {
    // Regression for PR #915: confirm the freeform input renders without
    // the foundation TagInput, which would otherwise hit /allowed-tags.
    const { container } = render(
      <AllowedEmailDomainsRow entity={baseEntity()} handleChange={() => {}} />
    );
    expect(container.querySelector("[data-mocked='TagInput']")).toBeNull();
    // The bare <input> is a real DOM input, not a react-select wrapper.
    const input = container.querySelector(
      "[data-testid='allowed_email_domains_input']"
    );
    expect(input.tagName).toBe("INPUT");
  });

  it("calls handleChange with the new entry when Enter pressed with a valid @domain", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={handleChange}
      />
    );
    typeAndCommit(container, "@valid.com");
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        id: "allowed_email_domains",
        value: ["@valid.com"],
        type: "text"
      }
    });
  });

  it("commits on comma keypress as well as Enter", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={handleChange}
      />
    );
    const input = container.querySelector(
      "[data-testid='allowed_email_domains_input']"
    );
    fireEvent.change(input, { target: { value: "@valid.com" } });
    fireEvent.keyDown(input, { key: "," });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toEqual(["@valid.com"]);
  });

  it("commits on blur when draft is non-empty", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={handleChange}
      />
    );
    const input = container.querySelector(
      "[data-testid='allowed_email_domains_input']"
    );
    fireEvent.change(input, { target: { value: "@valid.com" } });
    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toEqual(["@valid.com"]);
  });

  it("renders an inline error and does NOT call handleChange on a malformed entry", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={handleChange}
      />
    );
    typeAndCommit(container, "invalid");
    expect(handleChange).not.toHaveBeenCalled();
    expect(container.querySelector(".text-danger")?.textContent ?? "").toMatch(
      /allowed_email_domains_format/i
    );
  });

  it("removes the chip and fires handleChange when the chip × button is clicked", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity({
          allowed_email_domains: ["@acme.com", ".edu"]
        })}
        handleChange={handleChange}
      />
    );
    const removeBtn = container.querySelector(
      "[data-testid='domain-chip-remove-@acme.com']"
    );
    fireEvent.click(removeBtn);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        id: "allowed_email_domains",
        value: [".edu"],
        type: "text"
      }
    });
  });

  it("removes the last chip on Backspace when draft is empty", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity({
          allowed_email_domains: ["@acme.com", ".edu"]
        })}
        handleChange={handleChange}
      />
    );
    const input = container.querySelector(
      "[data-testid='allowed_email_domains_input']"
    );
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toEqual(["@acme.com"]);
  });

  it("does NOT remove a chip on Backspace when draft is non-empty", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity({
          allowed_email_domains: ["@acme.com"]
        })}
        handleChange={handleChange}
      />
    );
    const input = container.querySelector(
      "[data-testid='allowed_email_domains_input']"
    );
    fireEvent.change(input, { target: { value: "@partial" } });
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("renders chips for each saved entry in entity.allowed_email_domains", () => {
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity({ allowed_email_domains: ["@acme.com", ".edu"] })}
        handleChange={() => {}}
      />
    );
    expect(
      container.querySelector("[data-testid=\"domain-chip-@acme.com\"]")
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-testid=\"domain-chip-.edu\"]")
    ).toBeInTheDocument();
  });

  it("renders parent-supplied error from hasErrors prop (validate-path)", () => {
    const hasErrors = (field) =>
      field === "allowed_email_domains" ? "boom" : "";
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={() => {}}
        hasErrors={hasErrors}
      />
    );
    expect(container.querySelector(".text-danger")?.textContent).toBe("boom");
  });

  it("prefers parent-supplied error over local commit error when both are set", () => {
    const hasErrors = (field) =>
      field === "allowed_email_domains" ? "parent-wins" : "";
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={() => {}}
        hasErrors={hasErrors}
      />
    );
    typeAndCommit(container, "invalid"); // sets local domainsError
    expect(container.querySelector(".text-danger")?.textContent).toBe(
      "parent-wins"
    );
  });

  it("falls back to local commit error when no hasErrors prop is provided", () => {
    const { container } = render(
      <AllowedEmailDomainsRow entity={baseEntity()} handleChange={jest.fn()} />
    );
    typeAndCommit(container, "invalid");
    expect(container.querySelector(".text-danger")?.textContent ?? "").toMatch(
      /allowed_email_domains_format/i
    );
  });

  describe("parent error clears on plain typing (regression — Codex review)", () => {
    it("fires a no-op fireChange while typing if hasErrors() is truthy, so the parent's state.errors[id] resets via handleChange:114", () => {
      const handleChange = jest.fn();
      const hasErrors = jest.fn((field) =>
        field === "allowed_email_domains" ? "validate-path-error" : ""
      );
      const { container } = render(
        <AllowedEmailDomainsRow
          entity={baseEntity({
            allowed_email_domains: ["@existing.com"]
          })}
          handleChange={handleChange}
          hasErrors={hasErrors}
        />
      );
      const input = container.querySelector(
        "[data-testid='allowed_email_domains_input']"
      );
      fireEvent.change(input, { target: { value: "@" } });
      // Typing fires fireChange with the SAME array — array unchanged,
      // but the parent's handleChange clears errors[id] (index.js:114).
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith({
        target: {
          id: "allowed_email_domains",
          value: ["@existing.com"],
          type: "text"
        }
      });
    });

    it("does NOT fire fireChange while typing when hasErrors() is falsy (no wasted re-renders on the happy path)", () => {
      const handleChange = jest.fn();
      const { container } = render(
        <AllowedEmailDomainsRow
          entity={baseEntity({ allowed_email_domains: ["@existing.com"] })}
          handleChange={handleChange}
        />
      );
      const input = container.querySelector(
        "[data-testid='allowed_email_domains_input']"
      );
      fireEvent.change(input, { target: { value: "@new" } });
      fireEvent.change(input, { target: { value: "@new." } });
      fireEvent.change(input, { target: { value: "@new.com" } });
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  it("clears the local error and the draft after a successful commit", () => {
    const { container } = render(
      <AllowedEmailDomainsRow entity={baseEntity()} handleChange={jest.fn()} />
    );
    typeAndCommit(container, "invalid");
    expect(container.querySelector(".text-danger")?.textContent ?? "").toMatch(
      /allowed_email_domains_format/i
    );
    typeAndCommit(container, "@valid.com");
    expect(container.querySelector(".text-danger")).toBeNull();
    expect(
      container.querySelector("[data-testid='allowed_email_domains_input']")
        .value
    ).toBe("");
  });
});
