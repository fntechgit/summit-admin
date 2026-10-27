jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));
jest.mock("../../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(),
  escapeFilterValue: jest.fn((v) => v)
}));
jest.mock("../../../history", () => ({}));

const emailFlowEventsListReducer =
  require("../email-flow-events-list-reducer").default;
const {
  REQUEST_EMAIL_FLOW_EVENTS
} = require("../../../actions/email-flows-events-actions");

// The page feeds perPage from redux into every later fetch, so a REQUEST that
// drops it snapped the page size back to the default after one load.
describe("REQUEST_EMAIL_FLOW_EVENTS", () => {
  it("stores the requested perPage", () => {
    const next = emailFlowEventsListReducer(undefined, {
      type: REQUEST_EMAIL_FLOW_EVENTS,
      payload: {
        order: "flow_name",
        orderDir: -1,
        term: "welcome",
        perPage: 50
      }
    });

    expect(next.perPage).toBe(50);
    expect(next.order).toBe("flow_name");
    expect(next.orderDir).toBe(-1);
    expect(next.term).toBe("welcome");
  });
});
