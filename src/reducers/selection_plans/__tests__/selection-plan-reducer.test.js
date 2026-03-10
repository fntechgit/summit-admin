import selectionPlanReducer from "../selection-plan-reducer";
import { SELECTION_PLAN_EVENT_TYPE_ADDED } from "../../../actions/selection-plan-actions";

describe("SelectionPlanReducer", () => {
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
