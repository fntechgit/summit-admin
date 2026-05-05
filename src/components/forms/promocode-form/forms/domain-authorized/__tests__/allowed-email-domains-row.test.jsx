import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AllowedEmailDomainsRow from "../AllowedEmailDomainsRow";

// TagInput mock exposes programmatic onCreate / onChange hooks via data-testid
// buttons so we can drive both code paths without the real TagInput runtime.
jest.mock("openstack-uicore-foundation/lib/components", () => {
  const React = require("react");
  return {
    TagInput: (props) => {
      const draftRef = React.useRef("");
      return React.createElement(
        "div",
        { id: props.id, "data-mocked": "TagInput", "data-field": props.id },
        React.createElement("input", {
          "data-testid": `taginput-draft-${props.id}`,
          onChange: (e) => {
            draftRef.current = e.target.value;
          }
        }),
        React.createElement(
          "button",
          {
            type: "button",
            "data-testid": `taginput-onCreate-${props.id}`,
            onClick: () => props.onCreate && props.onCreate(draftRef.current)
          },
          "add"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            "data-testid": `taginput-onChange-${props.id}`,
            onClick: () =>
              props.onChange &&
              props.onChange({
                target: { value: [{ tag: "@acme.com" }] }
              })
          },
          "change"
        )
      );
    }
  };
});

const baseEntity = (overrides = {}) => ({
  allowed_email_domains: [],
  ...overrides
});

const typeAndAdd = (container, value) => {
  const draft = container.querySelector(
    "[data-testid=\"taginput-draft-allowed_email_domains\"]"
  );
  const addBtn = container.querySelector(
    "[data-testid=\"taginput-onCreate-allowed_email_domains\"]"
  );
  fireEvent.change(draft, { target: { value } });
  fireEvent.click(addBtn);
};

describe("AllowedEmailDomainsRow", () => {
  it("renders the TagInput and visible caption", () => {
    const { container } = render(
      <AllowedEmailDomainsRow entity={baseEntity()} handleChange={() => {}} />
    );
    expect(
      container.querySelector("#allowed_email_domains")
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

  it("calls handleChange with the new entry when onCreate fires with a valid @domain", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={handleChange}
      />
    );
    typeAndAdd(container, "@valid.com");
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        id: "allowed_email_domains",
        value: ["@valid.com"],
        type: "text"
      }
    });
  });

  it("renders an inline error and does NOT call handleChange when onCreate fires with a malformed entry", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity()}
        handleChange={handleChange}
      />
    );
    typeAndAdd(container, "invalid");
    expect(handleChange).not.toHaveBeenCalled();
    expect(container.querySelector(".text-danger")?.textContent ?? "").toMatch(
      /allowed_email_domains_format/i
    );
  });

  it("calls handleChange with normalized string array when onChange fires (TagInput payload shape)", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AllowedEmailDomainsRow
        entity={baseEntity({ allowed_email_domains: ["@acme.com"] })}
        handleChange={handleChange}
      />
    );
    const changeBtn = container.querySelector(
      "[data-testid=\"taginput-onChange-allowed_email_domains\"]"
    );
    fireEvent.click(changeBtn);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target).toMatchObject({
      id: "allowed_email_domains",
      value: ["@acme.com"]
    });
  });
});
