import React from "react";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import {
  deleteOrderExtraQuestionValue,
  deleteOrderExtraQuestionsSubQuestionsRule
} from "../../../actions/order-actions";
import EditOrderExtraQuestionPage from "../edit-order-extra-question-page";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../components/mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

// The form has its own tests; here we only need the props the page hands it.
let formProps = {};
jest.mock("../order-extra-question-form", () => ({
  __esModule: true,
  default: (props) => {
    formProps = props;
    return <div data-testid="question-form" />;
  }
}));

jest.mock("../../../actions/order-actions", () => ({
  __esModule: true,
  ...jest.requireActual("../../../actions/order-actions"),
  getOrderExtraQuestionMeta: jest.fn(() => ({ type: "TEST_META" })),
  saveOrderExtraQuestionValue: jest.fn(() => ({ type: "TEST_SAVE_VALUE" })),
  deleteOrderExtraQuestionValue: jest.fn(() => ({ type: "TEST_DEL_VALUE" })),
  deleteOrderExtraQuestionsSubQuestionsRule: jest.fn(() => ({
    type: "TEST_DEL_RULE"
  })),
  updateOrderExtraQuestionValueOrder: jest.fn(() => ({ type: "TEST_ORDER" })),
  updateOrderExtraQuestionsSubQuestionsRuleOrder: jest.fn(() => ({
    type: "TEST_RULE_ORDER"
  }))
}));

jest.mock("../../../actions/badge-actions", () => ({
  __esModule: true,
  ...jest.requireActual("../../../actions/badge-actions"),
  getBadgeFeatures: jest.fn(() => ({ type: "TEST_BADGE_FEATURES" }))
}));

const ENTITY = {
  id: 9,
  summit_id: 3,
  type: "CheckBoxList",
  values: [{ id: 1, value: "s", label: "Small", order: 1 }],
  sub_question_rules: [
    { id: 5, order: 1, sub_question: { id: 7, name: "shirt_fit" } }
  ]
};

const renderPage = () =>
  renderWithRedux(<EditOrderExtraQuestionPage />, {
    initialState: {
      currentSummitState: { currentSummit: { id: 3 } },
      currentOrderExtraQuestionState: {
        entity: ENTITY,
        allClasses: [{ type: "CheckBoxList", values: "array" }],
        errors: {}
      }
    }
  });

describe("EditOrderExtraQuestionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formProps = {};
  });

  describe("deleting an option", () => {
    it("should delete only once the confirmation is accepted", async () => {
      showConfirmDialog.mockResolvedValue(true);
      renderPage();
      await formProps.onValueDelete(1);
      expect(deleteOrderExtraQuestionValue).toHaveBeenCalledWith(9, 1);
    });

    it("should leave the option alone when the confirmation is dismissed", async () => {
      showConfirmDialog.mockResolvedValue(false);
      renderPage();
      await formProps.onValueDelete(1);
      expect(deleteOrderExtraQuestionValue).not.toHaveBeenCalled();
    });
  });

  describe("deleting a sub-question rule", () => {
    it("should delete only once the confirmation is accepted", async () => {
      showConfirmDialog.mockResolvedValue(true);
      renderPage();
      await formProps.onRuleDelete(5);
      expect(deleteOrderExtraQuestionsSubQuestionsRule).toHaveBeenCalledWith(
        9,
        5
      );
    });

    it("should leave the rule alone when the confirmation is dismissed", async () => {
      showConfirmDialog.mockResolvedValue(false);
      renderPage();
      await formProps.onRuleDelete(5);
      expect(deleteOrderExtraQuestionsSubQuestionsRule).not.toHaveBeenCalled();
    });
  });
});
