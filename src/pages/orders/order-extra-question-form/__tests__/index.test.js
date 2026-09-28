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

const renderForm = (entity = baseEntity(), onSubmit = jest.fn()) => {
  render(
    <OrderExtraQuestionForm
      currentSummit={SUMMIT}
      entity={entity}
      allClasses={ALL_CLASSES}
      onSubmit={onSubmit}
      onRuleDelete={jest.fn()}
      updateSubQuestionRuleOrder={jest.fn()}
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
});
