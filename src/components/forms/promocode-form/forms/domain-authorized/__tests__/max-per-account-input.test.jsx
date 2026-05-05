import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import MaxPerAccountInput from "../MaxPerAccountInput";

// Mocks the direct import path used by MaxPerAccountInput (post-bundle-size
// rewrite — see master commit cd8b5b98).
jest.mock("openstack-uicore-foundation/lib/components/inputs/text-input", () => {
  const React = require("react");
  const InputMock = (props) =>
    React.createElement("input", {
      id: props.id,
      type: props.type ?? "text",
      min: props.min,
      value: props.value ?? "",
      onChange: props.onChange,
      className: props.className
    });
  return { __esModule: true, default: InputMock };
});

const baseEntity = (overrides = {}) => ({
  quantity_per_account: 0,
  ...overrides
});

describe("MaxPerAccountInput", () => {
  it("reflects entity.quantity_per_account on the input value", () => {
    const { container } = render(
      <MaxPerAccountInput
        entity={baseEntity({ quantity_per_account: 7 })}
        handleChange={() => {}}
      />
    );
    expect(container.querySelector("#quantity_per_account").value).toBe("7");
  });

  it("calls handleChange with number-event shape on change", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <MaxPerAccountInput entity={baseEntity()} handleChange={handleChange} />
    );
    fireEvent.change(container.querySelector("#quantity_per_account"), {
      target: { value: "5" }
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      target: { id: "quantity_per_account", type: "number", value: "5" }
    });
  });

  it("renders the visible '0 = unlimited' caption", () => {
    render(
      <MaxPerAccountInput entity={baseEntity()} handleChange={() => {}} />
    );
    expect(
      screen.getByText("edit_promocode.captions.quantity_per_account_unlimited")
    ).toBeInTheDocument();
  });

  it("renders inside a col-md-4 container", () => {
    const { container } = render(
      <MaxPerAccountInput entity={baseEntity()} handleChange={() => {}} />
    );
    const col = container.querySelector(".col-md-4");
    expect(col).toBeInTheDocument();
    expect(col.querySelector("#quantity_per_account")).toBeInTheDocument();
  });
});
