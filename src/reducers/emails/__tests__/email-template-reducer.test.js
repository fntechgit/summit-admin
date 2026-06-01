import emailTemplateReducer from "../email-template-reducer";
import {
  REQUEST_TEMPLATE_RENDER,
  TEMPLATE_RENDER_RECEIVED,
  VALIDATE_RENDER
} from "../../../actions/email-actions";

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
