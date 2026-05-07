import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import AutoApplyCheckbox from "../auto-apply-checkbox";

const baseEntity = (overrides = {}) => ({
  auto_apply: false,
  ...overrides
});

describe("AutoApplyCheckbox", () => {
  it("renders unchecked when entity.auto_apply is false", () => {
    const { container } = render(
      <AutoApplyCheckbox entity={baseEntity()} handleChange={() => {}} />
    );
    const cb = container.querySelector("#auto_apply");
    expect(cb).toBeInTheDocument();
    expect(cb.checked).toBe(false);
  });

  it("renders checked when entity.auto_apply is true", () => {
    const { container } = render(
      <AutoApplyCheckbox
        entity={baseEntity({ auto_apply: true })}
        handleChange={() => {}}
      />
    );
    expect(container.querySelector("#auto_apply").checked).toBe(true);
  });

  it("calls handleChange with checkbox event shape on toggle", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <AutoApplyCheckbox entity={baseEntity()} handleChange={handleChange} />
    );
    fireEvent.click(container.querySelector("#auto_apply"));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      target: {
        id: "auto_apply",
        type: "checkbox",
        value: true,
        checked: true
      }
    });
  });

  it("does not render the caption by default (member/speaker fragment shape)", () => {
    render(<AutoApplyCheckbox entity={baseEntity()} handleChange={() => {}} />);
    expect(
      screen.queryByText("edit_promocode.captions.auto_apply")
    ).not.toBeInTheDocument();
  });

  it("renders the caption when withCaption is set (DomainAuthorized leaf shape)", () => {
    render(
      <AutoApplyCheckbox
        entity={baseEntity()}
        handleChange={() => {}}
        withCaption
      />
    );
    expect(
      screen.getByText("edit_promocode.captions.auto_apply")
    ).toBeInTheDocument();
  });

  it("applies marginTop:10px when marginTop is set", () => {
    const { container } = render(
      <AutoApplyCheckbox
        entity={baseEntity()}
        handleChange={() => {}}
        marginTop
      />
    );
    expect(container.firstChild).toHaveStyle({ marginTop: "10px" });
  });
});
