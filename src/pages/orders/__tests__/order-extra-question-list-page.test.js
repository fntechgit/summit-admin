import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import {
  deleteOrderExtraQuestion,
  getOrderExtraQuestion,
  getOrderExtraQuestions
} from "../../../actions/order-actions";
import OrderExtraQuestionListPage from "../order-extra-question-list-page";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../components/mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("../../../actions/order-actions", () => ({
  __esModule: true,
  ...jest.requireActual("../../../actions/order-actions"),
  getOrderExtraQuestions: jest.fn(() => ({ type: "TEST_GET" })),
  getOrderExtraQuestion: jest.fn(() => ({ type: "TEST_GET_ONE" })),
  deleteOrderExtraQuestion: jest.fn(() => ({ type: "TEST_DELETE" })),
  updateOrderExtraQuestionOrder: jest.fn(() => ({ type: "TEST_REORDER" }))
}));

jest.mock("../edit-order-extra-question-page", () => ({
  __esModule: true,
  default: () => <div data-testid="inline-editor" />
}));

const SUMMIT_ID = 3;

const QUESTIONS = [
  {
    id: 11,
    name: "tshirt_size",
    label: "<p>What size t-shirt?</p>",
    type: "CheckBoxList",
    order: 1
  },
  {
    id: 12,
    name: "company",
    label: "<p>Company name</p>",
    type: "Text",
    order: 2
  }
];

const renderPage = (orderExtraQuestions = QUESTIONS) => {
  const history = { push: jest.fn() };
  renderWithRedux(<OrderExtraQuestionListPage history={history} />, {
    initialState: {
      currentSummitState: { currentSummit: { id: SUMMIT_ID } },
      currentOrderExtraQuestionListState: {
        orderExtraQuestions,
        totalOrderExtraQuestions: orderExtraQuestions.length
      }
    }
  });
  return history;
};

describe("OrderExtraQuestionListPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should load the questions on mount", () => {
    renderPage();
    expect(getOrderExtraQuestions).toHaveBeenCalled();
  });

  it("should show the question type in words alongside its identifier", () => {
    renderPage();
    expect(screen.getByText(/Check Box List/)).toBeInTheDocument();
    expect(screen.getByText(/tshirt_size/)).toBeInTheDocument();
  });

  it("should expand the clicked question inline and fetch its detail", async () => {
    renderPage();
    expect(screen.queryByTestId("inline-editor")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Company name"));

    expect(getOrderExtraQuestion).toHaveBeenCalledWith(12);
    expect(screen.getByTestId("inline-editor")).toBeInTheDocument();
  });

  it("should collapse the question when it is clicked again", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Company name"));
    expect(screen.getByTestId("inline-editor")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Company name"));
    // Collapse unmounts its child only once the exit transition finishes.
    await waitFor(() =>
      expect(screen.queryByTestId("inline-editor")).not.toBeInTheDocument()
    );
  });

  it("should open a blank question from the add button", async () => {
    const history = renderPage();
    await userEvent.click(
      screen.getByRole("button", {
        name: "order_extra_question_list.add_question"
      })
    );
    expect(history.push).toHaveBeenCalledWith(
      `/app/summits/${SUMMIT_ID}/order-extra-questions/new`
    );
  });

  it("should delete the question once the confirmation is accepted", async () => {
    showConfirmDialog.mockResolvedValue(true);
    renderPage();
    await userEvent.click(
      screen.getAllByRole("button", { name: "general.delete" })[0]
    );
    expect(deleteOrderExtraQuestion).toHaveBeenCalledWith(11);
  });

  it("should leave the question alone when the confirmation is dismissed", async () => {
    showConfirmDialog.mockResolvedValue(false);
    renderPage();
    await userEvent.click(
      screen.getAllByRole("button", { name: "general.delete" })[0]
    );
    expect(deleteOrderExtraQuestion).not.toHaveBeenCalled();
  });

  it("should tell the user when the summit has no questions yet", () => {
    renderPage([]);
    expect(
      screen.getByText("order_extra_question_list.no_order_extra_questions")
    ).toBeInTheDocument();
  });
});
