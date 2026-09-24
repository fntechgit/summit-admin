import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EmailTemplateInput from "../email-template-input";
import { queryTemplates } from "../../../actions/email-actions";

jest.mock("../../../actions/email-actions", () => ({
  queryTemplates: jest.fn()
}));

const mockTemplates = (templates) =>
  queryTemplates.mockImplementation((input, callback) => callback(templates));

describe("EmailTemplateInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      mode: "object",
      plainValue: false,
      selected: { id: "42", identifier: "welcome_email" },
      cleared: { id: "", identifier: "" }
    },
    {
      mode: "plainValue",
      plainValue: true,
      selected: "welcome_email",
      cleared: ""
    }
  ])(
    "emits the $mode shape on select and clear",
    async ({ plainValue, selected, cleared }) => {
      mockTemplates([{ id: 42, identifier: "welcome_email" }]);
      const onChange = jest.fn();

      const { rerender } = render(
        <EmailTemplateInput
          id="tpl"
          value={null}
          onChange={onChange}
          plainValue={plainValue}
          isClearable
        />
      );

      await userEvent.type(screen.getByRole("combobox"), "welcome");
      expect(queryTemplates).toHaveBeenLastCalledWith(
        "welcome",
        expect.any(Function)
      );

      const callsBeforeSelect = queryTemplates.mock.calls.length;
      await userEvent.click(await screen.findByText("welcome_email"));

      expect(onChange).toHaveBeenLastCalledWith({
        target: { id: "tpl", value: selected, type: "emailtemplateinput" }
      });
      // selecting fills the input with the label, which must not re-search
      expect(queryTemplates).toHaveBeenCalledTimes(callsBeforeSelect);

      rerender(
        <EmailTemplateInput
          id="tpl"
          value={
            plainValue ? selected : { id: 42, identifier: "welcome_email" }
          }
          onChange={onChange}
          plainValue={plainValue}
          isClearable
        />
      );
      await userEvent.click(screen.getByLabelText(/clear/i));

      expect(onChange).toHaveBeenLastCalledWith({
        target: { id: "tpl", value: cleared, type: "emailtemplateinput" }
      });
    }
  );

  it("excludes the owner template from the options", async () => {
    mockTemplates([
      { id: 1, identifier: "self" },
      { id: 2, identifier: "other" }
    ]);

    render(
      <EmailTemplateInput
        id="tpl"
        value={null}
        onChange={jest.fn()}
        ownerId={1}
      />
    );

    await userEvent.type(screen.getByRole("combobox"), "e");

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).queryByText("self")).not.toBeInTheDocument();
    expect(within(listbox).getByText("other")).toBeInTheDocument();
  });

  it("loads default options on mount and reuses cached results", async () => {
    mockTemplates([{ id: 42, identifier: "welcome_email" }]);

    render(
      <EmailTemplateInput
        id="tpl"
        value=""
        onChange={jest.fn()}
        plainValue
        defaultOptions
        cacheOptions
      />
    );

    expect(queryTemplates).toHaveBeenCalledWith("", expect.any(Function));

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "w");
    await userEvent.type(input, "{Backspace}");

    expect(queryTemplates.mock.calls.map(([term]) => term)).toEqual(["", "w"]);
  });

  it("does not duplicate the selected template in the options", async () => {
    mockTemplates([
      { id: 42, identifier: "welcome_email" },
      { id: 43, identifier: "welcome_email_2" }
    ]);

    render(
      <EmailTemplateInput
        id="tpl"
        value="welcome_email"
        onChange={jest.fn()}
        plainValue
        defaultOptions
      />
    );

    await userEvent.click(screen.getByRole("combobox"));

    const labels = (await screen.findAllByRole("option")).map(
      (option) => option.textContent
    );
    expect(labels).toEqual(["welcome_email", "welcome_email_2"]);
  });
});
