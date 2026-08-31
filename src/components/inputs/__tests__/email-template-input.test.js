import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EmailTemplateInput from "../email-template-input";
import { queryTemplates } from "../../../actions/email-actions";

jest.mock("../../../actions/email-actions", () => ({
  queryTemplates: jest.fn()
}));

describe("EmailTemplateInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("selects an option and emits the object shape by default", async () => {
    queryTemplates.mockImplementation((input, callback) => {
      callback([{ id: 42, identifier: "welcome_email" }]);
    });
    const onChange = jest.fn();

    render(<EmailTemplateInput id="parent" value={null} onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "welcome");

    expect(queryTemplates).toHaveBeenCalledWith(
      "welcome",
      expect.any(Function)
    );

    const option = await screen.findByText("welcome_email");
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith({
      target: {
        id: "parent",
        value: { id: "42", identifier: "welcome_email" },
        type: "emailtemplateinput"
      }
    });
  });

  it("emits the plain identifier when plainValue is set", async () => {
    queryTemplates.mockImplementation((input, callback) => {
      callback([{ id: 42, identifier: "welcome_email" }]);
    });
    const onChange = jest.fn();

    render(
      <EmailTemplateInput
        id="template_filter"
        value=""
        onChange={onChange}
        plainValue
      />
    );

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "welcome");

    const option = await screen.findByText("welcome_email");
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith({
      target: {
        id: "template_filter",
        value: "welcome_email",
        type: "emailtemplateinput"
      }
    });
  });

  it("excludes the owner from the returned options", async () => {
    queryTemplates.mockImplementation((input, callback) => {
      callback([
        { id: 1, identifier: "self" },
        { id: 2, identifier: "other" }
      ]);
    });

    render(
      <EmailTemplateInput
        id="parent"
        value={null}
        onChange={jest.fn()}
        ownerId={1}
      />
    );

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "e");

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).queryByText("self")).not.toBeInTheDocument();
    expect(within(listbox).getByText("other")).toBeInTheDocument();
  });

  it("clears the value with the object shape when not plainValue", async () => {
    queryTemplates.mockImplementation((input, callback) => callback([]));
    const onChange = jest.fn();

    render(
      <EmailTemplateInput
        id="parent"
        value={{ id: 42, identifier: "welcome_email" }}
        onChange={onChange}
      />
    );

    const clearButton = screen.getByLabelText(/clear/i);
    await userEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith({
      target: {
        id: "parent",
        value: { id: "", identifier: "" },
        type: "emailtemplateinput"
      }
    });
  });

  it("loads default options on mount when defaultOptions is set", () => {
    queryTemplates.mockImplementation((input, callback) => callback([]));

    render(
      <EmailTemplateInput
        id="template_filter"
        value=""
        onChange={jest.fn()}
        plainValue
        defaultOptions
      />
    );

    expect(queryTemplates).toHaveBeenCalledWith("", expect.any(Function));
  });
});
