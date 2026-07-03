import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import eventTypeReducer from "../event-type-reducer";
import { RECEIVE_EVENT_TYPE } from "../../../actions/event-type-actions";

describe("eventTypeReducer", () => {
  it("clears stale errors from a previous failed save when a new entity is received", () => {
    const stateWithStaleErrors = eventTypeReducer(undefined, {
      type: VALIDATE,
      payload: { errors: { name: "Name already in use" } }
    });
    expect(stateWithStaleErrors.errors).toEqual({
      name: "Name already in use"
    });

    const nextState = eventTypeReducer(stateWithStaleErrors, {
      type: RECEIVE_EVENT_TYPE,
      payload: {
        response: {
          id: 42,
          name: "Keynote",
          class_name: "PresentationType",
          allowed_media_upload_types: []
        }
      }
    });

    expect(nextState.errors).toEqual({});
    expect(nextState.entity.id).toBe(42);
  });
});
