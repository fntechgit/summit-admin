import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Formik } from "formik";
import AllowedEmailDomainsRow from "../AllowedEmailDomainsRow";

jest.mock("../ManageAllowedEmailDomainsModal", () => ({
  __esModule: true,
  default: ({ show, onApply, existing }) =>
    show ? (
      <div data-testid="manage-modal-mock">
        <div data-testid="manage-modal-existing">
          {JSON.stringify(existing)}
        </div>
        <button
          type="button"
          data-testid="manage-modal-mock-apply"
          onClick={() => onApply(["@bulk1.com", "@bulk2.com"])}
        >
          mock apply
        </button>
      </div>
    ) : null
}));

// renders the row inside formik and exposes the current domains as JSON
const renderRow = (domains = [], { error } = {}) =>
  render(
    <Formik
      initialValues={{ allowed_email_domains: domains }}
      initialErrors={error ? { allowed_email_domains: error } : {}}
      initialTouched={error ? { allowed_email_domains: true } : {}}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <>
          <AllowedEmailDomainsRow />
          <div data-testid="domains-value">
            {JSON.stringify(values.allowed_email_domains)}
          </div>
        </>
      )}
    </Formik>
  );

const domainsValue = () =>
  JSON.parse(screen.getByTestId("domains-value").textContent);

const input = () => screen.getByTestId("allowed_email_domains_input");

const typeAndCommit = (value, key = "Enter") => {
  fireEvent.change(input(), { target: { value } });
  fireEvent.keyDown(input(), { key });
};

const range = (n) => Array.from({ length: n }, (_, i) => `@e${i}.com`);

describe("AllowedEmailDomainsRow", () => {
  it("adds a valid entry on Enter, comma or blur", () => {
    renderRow();
    typeAndCommit("@a.com");
    typeAndCommit(".edu", ",");
    fireEvent.change(input(), { target: { value: "user@b.com" } });
    fireEvent.blur(input());

    expect(domainsValue()).toEqual(["@a.com", ".edu", "user@b.com"]);
    expect(input()).toHaveValue("");
  });

  it("rejects a malformed entry inline and keeps it in the draft", () => {
    renderRow(["@a.com"]);
    typeAndCommit("invalid");

    expect(domainsValue()).toEqual(["@a.com"]);
    expect(
      screen.getByText("edit_promocode.errors.allowed_email_domains_format")
    ).toBeInTheDocument();
    expect(input()).toHaveValue("invalid");
  });

  it("ignores an entry already in the list regardless of casing", () => {
    renderRow(["@acme.com"]);
    typeAndCommit("@ACME.COM");

    expect(domainsValue()).toEqual(["@acme.com"]);
  });

  it("removes a chip with its remove button, and the last one with Backspace on an empty draft", () => {
    renderRow(["@a.com", "@b.com", "@c.com"]);
    fireEvent.click(screen.getByTestId("domain-chip-remove-@a.com"));
    expect(domainsValue()).toEqual(["@b.com", "@c.com"]);

    fireEvent.change(input(), { target: { value: "x" } });
    fireEvent.keyDown(input(), { key: "Backspace" });
    expect(domainsValue()).toEqual(["@b.com", "@c.com"]);

    fireEvent.change(input(), { target: { value: "" } });
    fireEvent.keyDown(input(), { key: "Backspace" });
    expect(domainsValue()).toEqual(["@b.com"]);
  });

  it("shows the form validation error for a saved malformed entry", () => {
    renderRow(["bad"], { error: "invalid list" });

    expect(screen.getByText("invalid list")).toBeInTheDocument();
  });

  it("shows chips up to 50 entries and a compact summary above that, with the add input in both", () => {
    const { unmount } = renderRow(range(50));
    expect(screen.getByTestId("domain-chip-@e0.com")).toBeInTheDocument();
    expect(screen.queryByTestId("compact-summary-count")).toBeNull();
    expect(input()).toBeInTheDocument();
    unmount();

    renderRow(range(51));
    expect(screen.queryByTestId("domain-chip-@e0.com")).toBeNull();
    expect(screen.getByTestId("compact-summary-count")).toBeInTheDocument();
    typeAndCommit("@new.com");
    expect(domainsValue()).toHaveLength(52);
  });

  it("opens the manage list with the current domains and replaces them on apply", () => {
    renderRow(["@a.com"]);
    fireEvent.click(screen.getByTestId("manage-list-button"));
    expect(screen.getByTestId("manage-modal-existing")).toHaveTextContent(
      JSON.stringify(["@a.com"])
    );

    fireEvent.click(screen.getByTestId("manage-modal-mock-apply"));
    expect(domainsValue()).toEqual(["@bulk1.com", "@bulk2.com"]);
  });
});
