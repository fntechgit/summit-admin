import React from "react";
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { act, screen } from "@testing-library/react";
import { putRequest } from "openstack-uicore-foundation/lib/utils/actions";
import EditBadgeScanPage from "../edit-badge-scan-page";
import { saveBadgeScan } from "../../../actions/sponsor-actions";
import { renderWithRedux } from "../../../utils/test-utils";
import badgeScanReducer, {
  DEFAULT_ENTITY as defaultBadgeScanEntity
} from "../../../reducers/sponsors/badge-scan-reducer";
import * as methods from "../../../utils/methods";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  putRequest: jest.fn()
}));

jest.mock("../../../actions/sponsor-actions", () => ({
  ...jest.requireActual("../../../actions/sponsor-actions"),
  getBadgeScan: jest.fn(() => ({ type: "MOCK_ACTION" })),
  resetBadgeScanForm: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

// ExtraQuestionsForm is a third-party bootstrap form with its own per-type
// rendering; stub it so the test only asserts on the data our page passes
// down, not on how the library renders it.
jest.mock("openstack-uicore-foundation/lib/components/extra-questions", () => {
  const react = require("react");
  return {
    __esModule: true,
    // eslint-disable-next-line no-unused-vars
    default: react.forwardRef(({ userAnswers }, ref) =>
      react.createElement(
        "div",
        { "data-testid": "extra-questions-answers" },
        JSON.stringify(userAnswers)
      )
    )
  };
});

const currentSummitState = (state = { currentSummit: { id: 12 } }) => state;

describe("EditBadgeScanPage", () => {
  const match = {
    params: { badge_scan_id: "21" },
    url: "/app/summits/12/badge-scans/21"
  };

  // Shape matches a real badge-scan API response: extra_questions is an
  // array of extra-question-answer records, each with its own `id`
  // (distinct from `question_id`) and the answer under `value`.
  const savedApiResponse = {
    id: 21,
    notes: "updated notes",
    extra_questions: [{ id: 1449348, question_id: 885, value: "Vegetarian" }]
  };

  const buildStore = () =>
    createStore(
      combineReducers({
        currentSummitState,
        currentBadgeScanState: badgeScanReducer
      }),
      {
        currentBadgeScanState: {
          entity: {
            ...defaultBadgeScanEntity,
            id: 21,
            notes: "original notes",
            extra_questions: [
              { id: 1400001, question_id: 885, value: "old answer" }
            ],
            sponsor_extra_questions: [
              { id: 885, name: "Test", type: "CheckBox", order: 1 }
            ]
          },
          errors: {}
        }
      },
      applyMiddleware(thunk)
    );

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");

    // Mirrors the real API: extra_questions only comes back as answer
    // objects when it's explicitly asked to be expanded. Without the
    // expand, the API returns its unexpanded form — a raw array of the
    // answer records' own ids (e.g. [1449348]), not the
    // { id, question_id, value } objects.
    putRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) =>
        (params = {}) =>
        (dispatch) => {
          const response = params.expand?.includes("extra_questions")
            ? savedApiResponse
            : {
                id: savedApiResponse.id,
                notes: savedApiResponse.notes,
                extra_questions: savedApiResponse.extra_questions.map(
                  (q) => q.id
                )
              };
          dispatch(receiveActionCreator({ response }));
          return Promise.resolve({ response });
        }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("still shows the saved notes and extra question answers when the edit page is re-entered after a save", async () => {
    // Regression guard for the missing-expand bug: saving used to return
    // extra_questions in its unexpanded form (raw answer-record ids, not
    // answer objects), overwriting the answers in the store, so reopening
    // this page showed the badge scan as if it had never been answered
    // until a hard refresh re-fetched it. getBadgeScan is mocked out below
    // so the second render can't mask that by silently re-fetching correct
    // data on its own.
    const store = buildStore();
    const { unmount } = renderWithRedux(<EditBadgeScanPage match={match} />, {
      store
    });

    await act(async () => {
      await store.dispatch(
        saveBadgeScan({
          id: 21,
          notes: "updated notes",
          extra_questions: [{ question_id: 885, answer: "Vegetarian" }]
        })
      );
    });

    // simulate navigating away and back to the same edit page
    unmount();
    renderWithRedux(<EditBadgeScanPage match={match} />, { store });

    expect(screen.getByDisplayValue("updated notes")).toBeInTheDocument();
    expect(screen.getByTestId("extra-questions-answers")).toHaveTextContent(
      JSON.stringify(savedApiResponse.extra_questions)
    );
  });
});
