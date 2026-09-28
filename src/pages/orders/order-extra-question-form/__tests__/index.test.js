import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import OrderExtraQuestionForm from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Stand in for the Jodit editor so the card can render in jsdom.
jest.mock("../../../../components/inputs/formik-text-editor", () => ({
  __esModule: true,
  default: ({ name }) => <textarea aria-label={name} />
}));

const ALL_CLASSES = [
  { type: "Text" },
  { type: "TextArea" },
  { type: "CheckBox" },
  { type: "CheckBoxList", values: "array" }
];

const SUMMIT = {
  id: 3,
  ticket_types: [
    { id: 41, name: "VIP" },
    { id: 42, name: "Standard" }
  ],
  badge_features: [{ id: 7, name: "Lunch" }]
};

const VALUE = {
  id: 1,
  value: "S",
  label: "Small",
  order: 1,
  is_default: false
};

// Shape the API returns for an expanded sub_question_rule.
const SUB_RULE = {
  id: 5,
  visibility: "Visible",
  visibility_condition: "Equal",
  answer_values: ["1"],
  answer_values_operator: "And",
  order: 1,
  sub_question: { id: 7, name: "shirt_fit" }
};

const baseEntity = (overrides = {}) => ({
  id: 0,
  summit_id: SUMMIT.id,
  name: "",
  label: "",
  type: "",
  usage: "Ticket",
  mandatory: false,
  printable: false,
  placeholder: "",
  max_selected_values: 0,
  values: [],
  sub_question_rules: [],
  allowed_ticket_types: [],
  allowed_badge_features_types: [],
  ...overrides
});

const valueHandlers = () => ({
  onValueSave: jest.fn(),
  onValueDelete: jest.fn(),
  updateQuestionValueOrder: jest.fn()
});

const renderForm = (
  entity = baseEntity(),
  onSubmit = jest.fn(),
  handlers = valueHandlers()
) => {
  render(
    <OrderExtraQuestionForm
      currentSummit={SUMMIT}
      entity={entity}
      allClasses={ALL_CLASSES}
      onSubmit={onSubmit}
      onRuleDelete={jest.fn()}
      updateSubQuestionRuleOrder={jest.fn()}
      {...handlers}
    />
  );
  return onSubmit;
};

describe("OrderExtraQuestionForm", () => {
  describe("question type", () => {
    it("should be editable while the question is new", () => {
      renderForm();
      expect(screen.getByLabelText(/question_type/i)).not.toHaveClass(
        "Mui-disabled"
      );
    });

    // The API rejects a type change after create, which is why the legacy form
    // disabled this too.
    it("should be locked once the question exists", () => {
      renderForm(baseEntity({ id: 9, type: "Text" }));
      expect(screen.getByLabelText(/question_type/i).parentElement).toHaveClass(
        "Mui-disabled"
      );
    });
  });

  describe("conditional fields", () => {
    it.each(["Text", "TextArea"])(
      "should offer the placeholder hint for %s",
      (type) => {
        renderForm(baseEntity({ type }));
        expect(screen.getByLabelText("question_form.hint")).toBeInTheDocument();
      }
    );

    it("should hide the placeholder hint for a type the API rejects it on", () => {
      renderForm(baseEntity({ type: "CheckBoxList" }));
      expect(screen.queryByLabelText("question_form.hint")).toBeNull();
    });

    it("should offer max selections only for CheckBoxList", () => {
      renderForm(baseEntity({ type: "CheckBoxList" }));
      expect(
        screen.getByLabelText("question_form.max_selected_values")
      ).toBeInTheDocument();
    });

    it("should hide max selections for a single-answer type", () => {
      renderForm(baseEntity({ type: "Text" }));
      expect(
        screen.queryByLabelText("question_form.max_selected_values")
      ).toBeNull();
    });
  });

  describe("allowed ticket types", () => {
    // The entity arrives with ticket types expanded to objects, but the select
    // is keyed by id. Without the conversion nothing appears selected.
    it("should show the names of already-selected ticket types", () => {
      renderForm(
        baseEntity({
          id: 9,
          type: "Text",
          allowed_ticket_types: [{ id: 41, name: "VIP" }]
        })
      );
      expect(screen.getByText("VIP")).toBeInTheDocument();
    });
  });

  describe("saving", () => {
    // The card edits scalar fields only; everything else has to survive.
    it("should keep the fields it does not edit when submitting", async () => {
      const entity = baseEntity({
        id: 9,
        type: "CheckBoxList",
        name: "tshirt",
        values: [VALUE],
        sub_question_rules: [SUB_RULE],
        external_id: "eb-123"
      });
      const onSubmit = renderForm(entity);

      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 9,
          summit_id: SUMMIT.id,
          values: [VALUE],
          sub_question_rules: [SUB_RULE],
          external_id: "eb-123"
        })
      );
    });

    it("should submit edits made in the card", async () => {
      const onSubmit = renderForm(baseEntity({ id: 9, type: "Text" }));

      await userEvent.type(
        screen.getByLabelText("question_form.hint"),
        "Your size"
      );
      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ placeholder: "Your size" })
      );
    });
  });

  describe("conditional sub-questions", () => {
    it("should stay hidden until the question has been saved", () => {
      renderForm(baseEntity({ type: "CheckBoxList" }));
      expect(
        screen.queryByText("question_form.sub_questions_rules")
      ).toBeNull();
    });

    it("should appear for a saved choice question", () => {
      renderForm(baseEntity({ id: 9, type: "CheckBoxList" }));
      expect(
        screen.getByText("question_form.sub_questions_rules")
      ).toBeInTheDocument();
    });

    it("should stay hidden for a type that cannot own rules", () => {
      renderForm(baseEntity({ id: 9, type: "Text" }));
      expect(
        screen.queryByText("question_form.sub_questions_rules")
      ).toBeNull();
    });
  });

  describe("options", () => {
    const OPTIONS = [
      { id: 1, value: "s", label: "Small", order: 1, is_default: false },
      { id: 2, value: "m", label: "Medium", order: 2, is_default: true }
    ];

    const withOptions = (overrides = {}) =>
      baseEntity({
        id: 9,
        type: "CheckBoxList",
        values: OPTIONS,
        ...overrides
      });

    // DOM order: one field per saved option, then the add row's field last.
    const labelFields = () =>
      screen.getAllByLabelText("question_form.visible_option");

    it("should stay hidden for a type the API returns no values for", () => {
      renderForm(baseEntity({ id: 9, type: "Text" }));
      expect(
        screen.queryByLabelText("question_form.visible_option")
      ).toBeNull();
    });

    // Options post to /{id}/values, so they cannot exist before the question does.
    it("should explain that the question must be saved before adding options", () => {
      renderForm(baseEntity({ type: "CheckBoxList" }));
      expect(
        screen.getByText("question_form.save_to_add_values")
      ).toBeInTheDocument();
    });

    it("should list the saved options in their stored order", () => {
      renderForm(withOptions({ values: [OPTIONS[1], OPTIONS[0]] }));
      const fields = labelFields();
      expect(fields[0]).toHaveValue("Small");
      expect(fields[1]).toHaveValue("Medium");
    });

    it("should save an option once the edit is committed", async () => {
      const handlers = valueHandlers();
      renderForm(withOptions(), jest.fn(), handlers);

      await userEvent.clear(labelFields()[0]);
      await userEvent.type(labelFields()[0], "Tiny");
      await userEvent.tab();

      expect(handlers.onValueSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, label: "Tiny", value: "s" })
      );
    });

    // Without the guard every focus-and-leave would PUT the option again.
    it("should not save an option that was not edited", async () => {
      const handlers = valueHandlers();
      renderForm(withOptions(), jest.fn(), handlers);

      await userEvent.click(labelFields()[0]);
      await userEvent.tab();

      expect(handlers.onValueSave).not.toHaveBeenCalled();
    });

    it("should save the option when its default flag is toggled", async () => {
      const handlers = valueHandlers();
      renderForm(withOptions(), jest.fn(), handlers);

      await userEvent.click(
        screen.getAllByRole("button", {
          name: "question_form.is_default"
        })[0]
      );

      expect(handlers.onValueSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, is_default: true })
      );
    });

    it("should delete the option that was clicked", async () => {
      const handlers = valueHandlers();
      renderForm(withOptions(), jest.fn(), handlers);

      await userEvent.click(
        screen.getAllByRole("button", { name: "general.delete" })[1]
      );

      expect(handlers.onValueDelete).toHaveBeenCalledWith(2);
    });

    // The API rejects a value-less option, so the control stays inert until typed in.
    it("should not allow adding an option with no stored value", () => {
      renderForm(withOptions());
      expect(
        screen.getByRole("button", { name: "question_form.add_option" })
      ).toBeDisabled();
    });

    it("should add a new option and clear the row for the next one", async () => {
      const handlers = valueHandlers();
      renderForm(withOptions(), jest.fn(), handlers);

      const fields = labelFields();
      const addLabel = fields[fields.length - 1];
      const addValue = screen.getAllByLabelText("question_form.value").pop();

      await userEvent.type(addLabel, "Large");
      await userEvent.type(addValue, "l");
      await userEvent.click(
        screen.getByRole("button", { name: "question_form.add_option" })
      );

      expect(handlers.onValueSave).toHaveBeenCalledWith({
        value: "l",
        label: "Large"
      });
      expect(addLabel).toHaveValue("");
    });
  });
});
