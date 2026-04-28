import selectionPlanReducer from "../selection-plan-reducer";
import {
  RESET_SELECTION_PLAN_FORM,
  SELECTION_PLAN_EVENT_TYPE_ADDED
} from "../../../actions/selection-plan-actions";

describe("SelectionPlanReducer", () => {
  describe("RESET_SELECTION_PLAN_FORM", () => {
    test("should reset hidden flag to false", () => {
      const initialState = {
        entity: {
          id: 1,
          is_hidden: true,
          event_types: [],
          track_groups: [],
          extra_questions: [],
          allowed_presentation_action_types: [],
          track_chair_rating_types: [],
          marketing_settings: {}
        },
        allowedMembers: { data: [], currentPage: 1, lastPage: 1 },
        errors: {}
      };

      const result = selectionPlanReducer(initialState, {
        type: RESET_SELECTION_PLAN_FORM,
        payload: {}
      });

      expect(result.entity.id).toBe(0);
      expect(result.entity.is_hidden).toBe(false);
    });
  });

  describe("SELECTION_PLAN_EVENT_TYPE_ADDED", () => {
    test("should append event type for selection plan event type added action", () => {
      const initialState = {
        entity: {
          id: 1,
          event_types: [{ id: 1, name: "Talk" }],
          track_groups: [],
          extra_questions: [],
          allowed_presentation_action_types: [],
          track_chair_rating_types: [],
          marketing_settings: {}
        },
        allowedMembers: { data: [], currentPage: 1, lastPage: 1 },
        errors: {}
      };

      const eventType = { id: 2, name: "Workshop" };
      const result = selectionPlanReducer(initialState, {
        type: SELECTION_PLAN_EVENT_TYPE_ADDED,
        payload: { eventType }
      });

      expect(result.entity.event_types).toStrictEqual([
        { id: 1, name: "Talk" },
        { id: 2, name: "Workshop" }
      ]);
    });
  });
});
