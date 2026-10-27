jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));
jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions")
}));
jest.mock("../../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(),
  escapeFilterValue: jest.fn((v) => v)
}));
jest.mock("../../../history", () => ({}));

const emailFlowEventReducer = require("../email-flows-event-reducer").default;
const {
  RECEIVE_EMAIL_FLOW_EVENT,
  UPDATE_EMAIL_FLOW_EVENT
} = require("../../../actions/email-flows-events-actions");

const loadedState = () =>
  emailFlowEventReducer(undefined, {
    type: RECEIVE_EMAIL_FLOW_EVENT,
    payload: {
      response: {
        id: 12,
        email_template_identifier: "TEMPLATE_A",
        flow_name: "Registration",
        event_type_name: "Order Paid",
        summit_id: 3,
        recipients: ["a@example.com"],
        template_schema: { fields: ["order"] }
      }
    }
  });

describe("UPDATE_EMAIL_FLOW_EVENT", () => {
  // The save payload only carries the editable fields, so a replace here wiped
  // flow_name / event_type_name / template_schema and blanked the title,
  // breadcrumb and variables tree until a reload.
  it("keeps the read-only display fields the save payload omits", () => {
    const next = emailFlowEventReducer(loadedState(), {
      type: UPDATE_EMAIL_FLOW_EVENT,
      payload: {
        id: 12,
        email_template_identifier: "TEMPLATE_B",
        recipients: ["b@example.com"]
      }
    });

    expect(next.entity.flow_name).toBe("Registration");
    expect(next.entity.event_type_name).toBe("Order Paid");
    expect(next.entity.template_schema).toEqual({ fields: ["order"] });
  });

  it("applies the edited fields and clears errors", () => {
    const withErrors = { ...loadedState(), errors: { recipients: "Invalid" } };
    const next = emailFlowEventReducer(withErrors, {
      type: UPDATE_EMAIL_FLOW_EVENT,
      payload: {
        id: 12,
        email_template_identifier: "TEMPLATE_B",
        recipients: ["b@example.com"]
      }
    });

    expect(next.entity.email_template_identifier).toBe("TEMPLATE_B");
    expect(next.entity.recipients).toEqual(["b@example.com"]);
    expect(next.errors).toEqual({});
  });
});
