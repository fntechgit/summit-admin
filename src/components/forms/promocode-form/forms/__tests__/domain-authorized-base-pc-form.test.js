import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import DomainAuthorizedBasePCForm from "../domain-authorized-base-pc-form";

// Mock openstack-uicore TagInput as a native input so we can exercise the
// component's onChange path without pulling in the real TagInput runtime.
// (TagInput's onCreate path is covered by the integration test in Task 12,
// where the mock exposes a programmatic hook.)
jest.mock("openstack-uicore-foundation/lib/components", () => {
  const React = require("react");
  return {
    Input: (props) =>
      React.createElement("input", {
        id: props.id,
        type: props.type ?? "text",
        min: props.min,
        value: props.value ?? "",
        onChange: props.onChange,
        className: props.className
      }),
    TagInput: (props) =>
      React.createElement("input", {
        id: props.id,
        "data-testid": `taginput-${props.id}`,
        value: "",
        onChange: () => {}
      })
  };
});

const noop = () => {};
const baseEntity = {
  allowed_email_domains: [],
  quantity_per_account: 0,
  auto_apply: false
};

describe("DomainAuthorizedBasePCForm", () => {
  it("renders the three new controls", () => {
    const { container } = render(
      <DomainAuthorizedBasePCForm
        entity={baseEntity}
        handleChange={noop}
        hasErrors={() => ""}
      />
    );
    expect(
      container.querySelector("#allowed_email_domains")
    ).toBeInTheDocument();
    expect(
      container.querySelector("#quantity_per_account")
    ).toBeInTheDocument();
    expect(container.querySelector("#auto_apply")).toBeInTheDocument();
  });

  it("shows visible helper text '0 = unlimited' beneath Max Per Account", () => {
    render(
      <DomainAuthorizedBasePCForm
        entity={baseEntity}
        handleChange={noop}
        hasErrors={() => ""}
      />
    );
    expect(screen.getByText(/0 = unlimited/i)).toBeInTheDocument();
  });

  it("does not render the inline domain error on first render", () => {
    render(
      <DomainAuthorizedBasePCForm
        entity={baseEntity}
        handleChange={noop}
        hasErrors={() => ""}
      />
    );
    expect(
      screen.queryByText(/Each entry must be an exact domain/i)
    ).not.toBeInTheDocument();
  });

  it("propagates quantity_per_account changes through props.handleChange", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <DomainAuthorizedBasePCForm
        entity={baseEntity}
        handleChange={handleChange}
        hasErrors={() => ""}
      />
    );
    const input = container.querySelector("#quantity_per_account");
    fireEvent.change(input, {
      target: { id: "quantity_per_account", value: "5" }
    });
    expect(handleChange).toHaveBeenCalled();
    const evt = handleChange.mock.calls[0][0];
    expect(evt.target.id).toBe("quantity_per_account");
    expect(evt.target.value).toBe("5");
  });

  it("propagates auto_apply toggle through props.handleChange", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <DomainAuthorizedBasePCForm
        entity={baseEntity}
        handleChange={handleChange}
        hasErrors={() => ""}
      />
    );
    const checkbox = container.querySelector("#auto_apply");
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
    const evt = handleChange.mock.calls[0][0];
    expect(evt.target.id).toBe("auto_apply");
    expect(evt.target.type).toBe("checkbox");
    expect(evt.target.checked).toBe(true);
  });
});
