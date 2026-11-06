import React from "react";
import { render, screen, within, waitFor, act } from "@testing-library/react";
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

  it("does not duplicate the selected template in the options", async () => {
    mockTemplates([
      { id: 42, identifier: "welcome_email" },
      { id: 43, identifier: "welcome_email_2" }
    ]);

    const Harness = () => {
      const [value, setValue] = React.useState("");
      return (
        <EmailTemplateInput
          id="tpl"
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          plainValue
        />
      );
    };
    render(<Harness />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "welcome");
    await userEvent.click(
      await screen.findByRole("option", { name: "welcome_email" })
    );

    // reopen the listbox with the value selected
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");

    const labels = (await screen.findAllByRole("option")).map(
      (option) => option.textContent
    );
    expect(labels).toEqual(["welcome_email", "welcome_email_2"]);
  });

  it("clears the loading state when the search input is emptied", async () => {
    queryTemplates.mockImplementation(() => {});
    render(<EmailTemplateInput id="parent" value={null} onChange={() => {}} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "w");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    await userEvent.clear(input);
    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    );
  });

  it("ignores an older search response that lands after a newer one", async () => {
    const callbacks = {};
    queryTemplates.mockImplementation((input, callback) => {
      callbacks[input] = callback;
    });
    render(<EmailTemplateInput id="parent" value={null} onChange={() => {}} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "ab");

    act(() => callbacks.ab([{ id: 2, identifier: "abc_newer" }]));
    act(() => callbacks.a([{ id: 1, identifier: "a_older" }]));

    expect(
      await screen.findByRole("option", { name: "abc_newer" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "a_older" })
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      mode: "object",
      plainValue: false,
      value: { id: 42, identifier: "welcome_email" }
    },
    { mode: "plainValue", plainValue: true, value: "welcome_email" }
  ])(
    "keeps the typed search when a template is already selected ($mode)",
    async ({ plainValue, value }) => {
      queryTemplates.mockImplementation((input, callback) => {
        setTimeout(() => callback([{ id: 7, identifier: "newsletter" }]), 10);
      });
      render(
        <EmailTemplateInput
          id="parent"
          value={value}
          onChange={() => {}}
          plainValue={plainValue}
        />
      );

      const input = screen.getByRole("combobox");
      await userEvent.click(input);
      await userEvent.clear(input);
      await userEvent.type(input, "news");

      expect(
        await screen.findByRole("option", { name: "newsletter" })
      ).toBeInTheDocument();
      expect(input).toHaveValue("news");
    }
  );
});
