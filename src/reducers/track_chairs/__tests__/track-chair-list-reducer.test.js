import trackChairListReducer from "../track-chair-list-reducer";
import { TRACK_CHAIR_ADDED } from "../../../actions/track-chair-actions";

describe("trackChairListReducer", () => {
  test("formats the name with the member's email when a track chair is added, matching the list load format", () => {
    const initialState = {
      trackChairs: [],
      totalTrackChairs: 0
    };

    const result = trackChairListReducer(initialState, {
      type: TRACK_CHAIR_ADDED,
      payload: {
        response: {
          id: 99,
          member: {
            id: 42,
            first_name: "Jane",
            last_name: "Doe",
            email: "jane@example.com"
          },
          categories: [{ id: 1, name: "Track A" }]
        }
      }
    });

    expect(result.trackChairs[0].name).toBe("Jane Doe (jane@example.com)");
  });
});
