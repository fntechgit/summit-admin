import badgeScanReducer, { DEFAULT_ENTITY } from "../badge-scan-reducer";
import { BADGE_SCAN_UPDATED } from "../../../actions/sponsor-actions";

describe("badgeScanReducer", () => {
  describe("BADGE_SCAN_UPDATED", () => {
    it("replaces notes and extra_questions with the values from the save response", () => {
      // Regression guard: the edit page showed the badge scan as if the
      // answers were never entered right after saving, because without
      // `expand=extra_questions` the save response returned extra_questions
      // in its unexpanded form — a raw array of the answer records' own ids
      // (e.g. [1449348]) instead of the answer objects — and this case
      // wrote that over the real answers.
      const initialState = {
        entity: {
          ...DEFAULT_ENTITY,
          id: 21,
          notes: "old notes",
          extra_questions: [
            { id: 1449348, question_id: 885, value: "old answer" }
          ],
          attendee_full_name: "Jane Doe"
        },
        errors: {}
      };

      const newState = badgeScanReducer(initialState, {
        type: BADGE_SCAN_UPDATED,
        payload: {
          response: {
            id: 21,
            notes: "updated notes",
            extra_questions: [
              { id: 1449348, question_id: 885, value: "new answer" }
            ]
          }
        }
      });

      expect(newState.entity.notes).toBe("updated notes");
      expect(newState.entity.extra_questions).toEqual([
        { id: 1449348, question_id: 885, value: "new answer" }
      ]);
      // fields the update response doesn't return must survive the merge
      expect(newState.entity.attendee_full_name).toBe("Jane Doe");
    });

    it("clobbers extra_questions with the unexpanded answer-id array when the response isn't expanded", () => {
      // Documents the failure mode this PR fixes at the source (the action
      // not asking the API to expand extra_questions on save): without the
      // expand, the API returns extra_questions as a raw array of the
      // extra-question-answer records' own ids (not question ids, and not
      // answer objects) — this reducer has no way to tell that apart from
      // real data, so it commits it as-is. If a future change drops that
      // expand again, this reducer will still silently clobber the answers
      // exactly like it did before.
      const initialState = {
        entity: {
          ...DEFAULT_ENTITY,
          id: 21,
          notes: "old notes",
          extra_questions: [
            { id: 1449348, question_id: 885, value: "old answer" }
          ]
        },
        errors: {}
      };

      const newState = badgeScanReducer(initialState, {
        type: BADGE_SCAN_UPDATED,
        payload: {
          response: {
            id: 21,
            notes: "updated notes",
            extra_questions: [1449348]
          }
        }
      });

      expect(newState.entity.extra_questions).toEqual([1449348]);
    });
  });
});
