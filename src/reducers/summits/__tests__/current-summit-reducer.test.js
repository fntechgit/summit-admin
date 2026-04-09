import currentSummitReducer, { DEFAULT_STATE } from "../current-summit-reducer";
import { EVENT_TYPE_ADDED } from "../../../actions/event-type-actions";
import { SELECTION_PLAN_EVENT_TYPE_ADDED } from "../../../actions/selection-plan-actions";

describe("CurrentSummitReducer", () => {
  describe("SELECTION_PLAN_EVENT_TYPE_ADDED", () => {
    test("should ignore selection plan event type added action", () => {
      const initialState = {
        ...DEFAULT_STATE,
        currentSummit: {
          ...DEFAULT_STATE.currentSummit,
          event_types: [{ id: 1, name: "Talk" }]
        }
      };

      const result = currentSummitReducer(initialState, {
        type: SELECTION_PLAN_EVENT_TYPE_ADDED,
        payload: { eventType: { id: 2, name: "Workshop" } }
      });

      expect(result).toBe(initialState);
      expect(result.currentSummit.event_types).toStrictEqual([
        { id: 1, name: "Talk" }
      ]);
    });
  });

  describe("EVENT_TYPE_ADDED", () => {
    test("should append event type for summit event type added action", () => {
      const initialState = {
        ...DEFAULT_STATE,
        currentSummit: {
          ...DEFAULT_STATE.currentSummit,
          event_types: [{ id: 1, name: "Talk" }]
        }
      };

      const response = { id: 2, name: "Workshop" };
      const result = currentSummitReducer(initialState, {
        type: EVENT_TYPE_ADDED,
        payload: { response }
      });

      expect(result.currentSummit.event_types).toStrictEqual([
        { id: 1, name: "Talk" },
        { id: 2, name: "Workshop" }
      ]);
    });
  });
});
