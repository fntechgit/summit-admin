import emailTemplateReducer from "../email-template-reducer";
import {
  REQUEST_TEMPLATE_RENDER,
  TEMPLATE_RENDER_RECEIVED,
  VALIDATE_RENDER,
  RECEIVE_TEMPLATE,
  RESET_TEMPLATE_FORM,
  TEMPLATE_ADDED,
  TEMPLATE_UPDATED
} from "../../../actions/email-actions";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";

// ─── Test 1: REQUEST_TEMPLATE_RENDER sets latestRenderId + templateLoading ───

describe("REQUEST_TEMPLATE_RENDER", () => {
  it("sets latestRenderId from payload and templateLoading=true", () => {
    const state = emailTemplateReducer(undefined, {
      type: REQUEST_TEMPLATE_RENDER,
      payload: { requestId: 1 }
    });
    expect(state.latestRenderId).toBe(1);
    expect(state.templateLoading).toBe(true);
  });
});

// ─── Test 2: out-of-order race — TEMPLATE_RENDER_RECEIVED ────────────────────

describe("TEMPLATE_RENDER_RECEIVED out-of-order guard", () => {
  const stateWithId2 = emailTemplateReducer(undefined, {
    type: REQUEST_TEMPLATE_RENDER,
    payload: { requestId: 2 }
  });

  it("IGNORES a stale response (requestId:1 when latestRenderId:2)", () => {
    const state = emailTemplateReducer(stateWithId2, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "STALE" }, requestId: 1 }
    });
    // preview was null in DEFAULT_STATE; must remain unchanged
    expect(state.preview).toBe(stateWithId2.preview);
    expect(state.preview).not.toBe("STALE");
  });

  it("APPLIES the current response (requestId:2 when latestRenderId:2)", () => {
    const state = emailTemplateReducer(stateWithId2, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "FRESH" }, requestId: 2 }
    });
    expect(state.preview).toBe("FRESH");
    expect(state.render_errors).toEqual([]);
    expect(state.templateLoading).toBe(false);
  });

  it("stale response does NOT wipe a prior fresh preview already on screen", () => {
    // Step 1: id2 is latest, and a fresh preview has already been applied
    const stateAfterFresh = emailTemplateReducer(stateWithId2, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "FRESH" }, requestId: 2 }
    });
    expect(stateAfterFresh.preview).toBe("FRESH"); // precondition

    // Step 2: a stale response for id1 arrives — must not overwrite "FRESH"
    const stateAfterStale = emailTemplateReducer(stateAfterFresh, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "STALE" }, requestId: 1 }
    });
    expect(stateAfterStale.preview).toBe("FRESH");
    expect(stateAfterStale.preview).not.toBe("STALE");
  });
});

// ─── Test 3: VALIDATE_RENDER out-of-order guard ───────────────────────────────

describe("VALIDATE_RENDER out-of-order guard", () => {
  const stateWithId2 = emailTemplateReducer(undefined, {
    type: REQUEST_TEMPLATE_RENDER,
    payload: { requestId: 2 }
  });

  it("IGNORES a stale error (requestId:1 when latestRenderId:2)", () => {
    const state = emailTemplateReducer(stateWithId2, {
      type: VALIDATE_RENDER,
      payload: { errors: ["stale error"], requestId: 1 }
    });
    // render_errors should remain [] (DEFAULT_STATE value)
    expect(state.render_errors).toEqual(stateWithId2.render_errors);
    expect(state.render_errors).not.toContain("stale error");
  });

  it("APPLIES the current error (requestId:2 when latestRenderId:2)", () => {
    const state = emailTemplateReducer(stateWithId2, {
      type: VALIDATE_RENDER,
      payload: { errors: ["render failed"], requestId: 2 }
    });
    expect(state.render_errors).toEqual(["render failed"]);
    expect(state.templateLoading).toBe(false);
  });

  it("stale error does NOT wipe a prior fresh render_errors already on screen", () => {
    // Step 1: id2 is latest, and a fresh error list has already been applied
    const stateAfterFreshError = emailTemplateReducer(stateWithId2, {
      type: VALIDATE_RENDER,
      payload: { errors: ["render failed"], requestId: 2 }
    });
    expect(stateAfterFreshError.render_errors).toEqual(["render failed"]); // precondition

    // Step 2: a stale VALIDATE_RENDER for id1 arrives — must not overwrite fresh errors
    const stateAfterStaleError = emailTemplateReducer(stateAfterFreshError, {
      type: VALIDATE_RENDER,
      payload: { errors: ["stale error"], requestId: 1 }
    });
    expect(stateAfterStaleError.render_errors).toEqual(["render failed"]);
    expect(stateAfterStaleError.render_errors).not.toContain("stale error");
  });
});

// ─── Test 4: backward-compat — no requestId in payload → always apply ─────────

describe("TEMPLATE_RENDER_RECEIVED backward compatibility (no requestId)", () => {
  it("applies the response even when no requestId is present", () => {
    const state = emailTemplateReducer(undefined, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "NO_ID_CONTENT" } }
    });
    expect(state.preview).toBe("NO_ID_CONTENT");
    expect(state.render_errors).toEqual([]);
  });
});

// ─── Test 5: entity-change branches reset render sequencing state ─────────────

// Template A's editor session: a finished render (preview + errors on screen)
// plus a new request (id 5) still in flight.
const buildTemplateASessionState = () => {
  let state = emailTemplateReducer(undefined, {
    type: REQUEST_TEMPLATE_RENDER,
    payload: { requestId: 4 }
  });
  state = emailTemplateReducer(state, {
    type: TEMPLATE_RENDER_RECEIVED,
    payload: { response: { html_content: "A_PREVIEW" }, requestId: 4 }
  });
  state = emailTemplateReducer(state, {
    type: VALIDATE_RENDER,
    payload: { errors: ["A render error"], requestId: 4 }
  });
  return emailTemplateReducer(state, {
    type: REQUEST_TEMPLATE_RENDER,
    payload: { requestId: 5 }
  });
};

const expectRenderStateCleared = (state) => {
  expect(state.preview).toBeNull();
  expect(state.render_errors).toEqual([]);
  expect(state.templateLoading).toBe(false);
  expect(state.latestRenderId).toBe(0);
};

describe("render sequencing state reset on entity change", () => {
  it("RESET_TEMPLATE_FORM clears preview, render_errors, templateLoading and latestRenderId", () => {
    const state = emailTemplateReducer(buildTemplateASessionState(), {
      type: RESET_TEMPLATE_FORM,
      payload: {}
    });
    expectRenderStateCleared(state);
  });

  it("SET_CURRENT_SUMMIT clears preview, render_errors, templateLoading and latestRenderId", () => {
    const state = emailTemplateReducer(buildTemplateASessionState(), {
      type: SET_CURRENT_SUMMIT,
      payload: {}
    });
    expectRenderStateCleared(state);
  });

  it("RECEIVE_TEMPLATE clears preview, render_errors, templateLoading and latestRenderId", () => {
    const state = emailTemplateReducer(buildTemplateASessionState(), {
      type: RECEIVE_TEMPLATE,
      payload: {
        response: { id: 2, mjml_content: "<mjml/>", html_content: "" }
      }
    });
    expectRenderStateCleared(state);
    expect(state.entity.id).toBe(2);
  });

  it("TEMPLATE_ADDED clears preview, render_errors, templateLoading and latestRenderId", () => {
    const state = emailTemplateReducer(buildTemplateASessionState(), {
      type: TEMPLATE_ADDED,
      payload: {
        response: { id: 3, mjml_content: "<mjml/>", html_content: "" }
      }
    });
    expectRenderStateCleared(state);
  });

  it("TEMPLATE_UPDATED clears preview, render_errors, templateLoading and latestRenderId", () => {
    const state = emailTemplateReducer(buildTemplateASessionState(), {
      type: TEMPLATE_UPDATED,
      payload: {
        response: { id: 2, mjml_content: "<mjml/>", html_content: "" }
      }
    });
    expectRenderStateCleared(state);
  });

  it("a late response from the previous template is IGNORED after RECEIVE_TEMPLATE", () => {
    // template B loads while A's request 5 is still in flight
    const stateB = emailTemplateReducer(buildTemplateASessionState(), {
      type: RECEIVE_TEMPLATE,
      payload: {
        response: { id: 2, mjml_content: "<mjml/>", html_content: "" }
      }
    });

    // A's late success response arrives — must not repopulate B's preview
    const afterStaleResponse = emailTemplateReducer(stateB, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "STALE_A_PREVIEW" }, requestId: 5 }
    });
    expect(afterStaleResponse.preview).not.toBe("STALE_A_PREVIEW");

    // A's late error response arrives — must not repopulate B's render_errors
    const afterStaleError = emailTemplateReducer(stateB, {
      type: VALIDATE_RENDER,
      payload: { errors: ["stale A error"], requestId: 5 }
    });
    expect(afterStaleError.render_errors).not.toContain("stale A error");
  });

  it("documents the navigation window: a late response BEFORE RECEIVE_TEMPLATE is accepted (entity is still A's), then wiped when the new template arrives", () => {
    // Route changed A -> B, but B's GET has not resolved yet: no reducer action
    // has fired, so entity (and latestRenderId) still belong to template A.
    const stateAInFlight = buildTemplateASessionState();

    // A's late response arrives in this window — accepted, since the displayed
    // entity is still A's this pairing is consistent, not a contamination
    const afterLateResponse = emailTemplateReducer(stateAInFlight, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "A_LATE_PREVIEW" }, requestId: 5 }
    });
    expect(afterLateResponse.preview).toBe("A_LATE_PREVIEW");

    // B's GET resolves — RECEIVE_TEMPLATE wipes everything from A's session
    const stateB = emailTemplateReducer(afterLateResponse, {
      type: RECEIVE_TEMPLATE,
      payload: {
        response: { id: 2, mjml_content: "<mjml/>", html_content: "" }
      }
    });
    expectRenderStateCleared(stateB);
    expect(stateB.entity.id).toBe(2);

    // any further response from A's request is now dropped by the guard
    const afterStaleResponse = emailTemplateReducer(stateB, {
      type: TEMPLATE_RENDER_RECEIVED,
      payload: { response: { html_content: "A_LATE_PREVIEW" }, requestId: 5 }
    });
    expect(afterStaleResponse.preview).not.toBe("A_LATE_PREVIEW");
  });
});
