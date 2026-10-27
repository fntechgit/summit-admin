import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import EditEmailFlowEventPage from "../edit-email-flow-event-page";
import {
  getEmailFlowEvent,
  resetEmailFlowEventForm,
  saveEmailFlowEvent
} from "../../../actions/email-flows-events-actions";

jest.mock("../../../actions/email-flows-events-actions", () => ({
  getEmailFlowEvent: jest.fn(),
  resetEmailFlowEventForm: jest.fn(),
  saveEmailFlowEvent: jest.fn()
}));

jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn()
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

// Stands in for EmailFlowEventForm: exposes formik values, errors and touched so
// the page's resync / server-error wiring can be asserted without the MUI inputs.
jest.mock("../../../components/forms/email-flow-event-form", () => {
  const React = require("react");
  const { useFormikContext } = require("formik");
  return {
    __esModule: true,
    default: function MockEmailFlowEventForm() {
      const { values, errors, touched, setFieldValue } = useFormikContext();
      return (
        <div>
          <input
            data-testid="recipients-input"
            value={values.recipients}
            onChange={(ev) => setFieldValue("recipients", ev.target.value)}
          />
          <span data-testid="template-value">
            {values.email_template_identifier}
          </span>
          {touched.recipients && errors.recipients && (
            <p data-testid="recipients-error">{errors.recipients}</p>
          )}
        </div>
      );
    }
  };
});

const buildEntity = (overrides = {}) => ({
  id: 12,
  email_template_identifier: "TEMPLATE_A",
  flow_name: "Registration",
  event_type_name: "Order Paid",
  summit_id: 3,
  recipients: ["a@example.com"],
  template_schema: null,
  ...overrides
});

const buildInitialState = (entityOverrides = {}, errors = {}) => ({
  currentSummitState: { currentSummit: createMockSummit() },
  emailFLowEventState: { entity: buildEntity(entityOverrides), errors },
  baseState: { loading: false }
});

const match = { params: { event_id: "12" }, url: "/x" };

describe("EditEmailFlowEventPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEmailFlowEvent.mockReturnValue(() => Promise.resolve());
    resetEmailFlowEventForm.mockReturnValue(() => Promise.resolve());
    saveEmailFlowEvent.mockReturnValue(() => Promise.resolve());
  });

  it("loads the event on mount", () => {
    renderWithRedux(<EditEmailFlowEventPage match={match} />, {
      initialState: buildInitialState()
    });

    expect(getEmailFlowEvent).toHaveBeenCalledWith("12");
    expect(resetEmailFlowEventForm).not.toHaveBeenCalled();
  });

  it("resets the form when there is no event id", () => {
    renderWithRedux(
      <EditEmailFlowEventPage match={{ params: {}, url: "/x" }} />,
      { initialState: buildInitialState() }
    );

    expect(resetEmailFlowEventForm).toHaveBeenCalled();
    expect(getEmailFlowEvent).not.toHaveBeenCalled();
  });

  // Regression: keying the resync on entity.id meant a refetch of the SAME event
  // never reached the form, so a stale (or server-rejected) copy stayed editable
  // and could be saved back over the server's values.
  it("resyncs formik values when the same event is re-fetched", () => {
    const mockStore = configureStore([thunk]);

    const staleStore = mockStore(
      buildInitialState({ recipients: ["stale@example.com"] })
    );
    const { rerender } = render(
      <Provider store={staleStore}>
        <EditEmailFlowEventPage match={match} />
      </Provider>
    );

    expect(screen.getByTestId("recipients-input")).toHaveValue(
      "stale@example.com"
    );

    const freshStore = mockStore(
      buildInitialState({ recipients: ["server@example.com"] })
    );
    rerender(
      <Provider store={freshStore}>
        <EditEmailFlowEventPage match={match} />
      </Provider>
    );

    expect(screen.getByTestId("recipients-input")).toHaveValue(
      "server@example.com"
    );
  });

  it("joins stored recipients into the text field and splits them back on submit", async () => {
    renderWithRedux(<EditEmailFlowEventPage match={match} />, {
      initialState: buildInitialState({
        recipients: ["a@example.com", "b@example.com"]
      })
    });

    expect(screen.getByTestId("recipients-input")).toHaveValue(
      "a@example.com,b@example.com"
    );

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(saveEmailFlowEvent).toHaveBeenCalledWith({
      id: 12,
      email_template_identifier: "TEMPLATE_A",
      recipients: ["a@example.com", "b@example.com"]
    });
  });

  it("sends an empty recipients array when the field is cleared", async () => {
    renderWithRedux(<EditEmailFlowEventPage match={match} />, {
      initialState: buildInitialState({ recipients: [] })
    });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(saveEmailFlowEvent).toHaveBeenCalledWith({
      id: 12,
      email_template_identifier: "TEMPLATE_A",
      recipients: []
    });
  });

  it("marks server-error fields touched so the inputs render them", () => {
    renderWithRedux(<EditEmailFlowEventPage match={match} />, {
      initialState: buildInitialState(
        {},
        {
          recipients: "recipients should be an array of valid emails"
        }
      )
    });

    expect(screen.getByTestId("recipients-error")).toHaveTextContent(
      "recipients should be an array of valid emails"
    );
  });
});
