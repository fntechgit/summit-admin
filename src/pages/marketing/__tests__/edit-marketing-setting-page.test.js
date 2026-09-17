import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import EditMarketingSettingPage from "../edit-marketing-setting-page";
import {
  getMarketingSetting,
  resetSettingForm,
  saveMarketingSetting,
  deleteSetting
} from "../../../actions/marketing-actions";

jest.mock("../../../actions/marketing-actions", () => ({
  getMarketingSetting: jest.fn(),
  resetSettingForm: jest.fn(),
  saveMarketingSetting: jest.fn(),
  deleteSetting: jest.fn()
}));

jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn()
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockSuccessMessage = jest.fn();
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    __esModule: true,
    useSnackbarMessage: () => ({
      successMessage: mockSuccessMessage,
      errorMessage: jest.fn()
    })
  })
);

// Stands in for the real form: exposes plain inputs bound to the same
// formik context the page provides, so tests can drive values/read errors
// without depending on marketing-setting-form.js's own rendering (covered
// by marketing-setting-form.test.js).
jest.mock("../../../components/forms/marketing-setting-form", () => {
  const React = require("react");
  const { useFormikContext } = require("formik");
  return {
    __esModule: true,
    default: function MockMarketingSettingForm() {
      const { values, errors, setFieldValue } = useFormikContext();
      return (
        <div>
          <input
            data-testid="key-input"
            value={values.key}
            onChange={(ev) => setFieldValue("key", ev.target.value)}
          />
          <input
            data-testid="type-input"
            value={values.type}
            onChange={(ev) => setFieldValue("type", ev.target.value)}
          />
          <input
            data-testid="value-input"
            value={values.value}
            onChange={(ev) => setFieldValue("value", ev.target.value)}
          />
          {errors.key && <p data-testid="key-error">{errors.key}</p>}
        </div>
      );
    }
  };
});

const mockHistory = { push: jest.fn() };

const buildEntity = (overrides = {}) => ({
  id: 0,
  key: "",
  type: "",
  value: "",
  file_preview: "",
  file: null,
  selection_plan_id: "",
  ...overrides
});

const buildInitialState = (entityOverrides = {}, errors = {}) => ({
  currentSummitState: { currentSummit: createMockSummit() },
  marketingSettingState: { entity: buildEntity(entityOverrides), errors }
});

const clickSave = () => screen.getByRole("button", { name: "general.save" });

describe("EditMarketingSettingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMarketingSetting.mockReturnValue(() => Promise.resolve());
    resetSettingForm.mockReturnValue(() => Promise.resolve());
    deleteSetting.mockReturnValue(() => Promise.resolve());
  });

  it("loads an existing setting on mount", () => {
    renderWithRedux(
      <EditMarketingSettingPage
        history={mockHistory}
        match={{ params: { setting_id: "5" }, url: "/x" }}
      />,
      { initialState: buildInitialState({ id: 5, key: "existing" }) }
    );

    expect(getMarketingSetting).toHaveBeenCalledWith("5");
    expect(resetSettingForm).not.toHaveBeenCalled();
  });

  it("resets the form for a new setting (\"add\" route, no setting_id)", () => {
    renderWithRedux(
      <EditMarketingSettingPage
        history={mockHistory}
        match={{ params: {}, url: "/x" }}
      />,
      { initialState: buildInitialState() }
    );

    expect(resetSettingForm).toHaveBeenCalled();
    expect(getMarketingSetting).not.toHaveBeenCalled();
  });

  it("resyncs formik values when the loaded entity changes", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);
    const match = { params: { setting_id: "5" }, url: "/x" };

    const storeA = mockStore(
      buildInitialState({ id: 5, key: "entity-a", type: "TEXT" })
    );
    const { rerender } = render(
      <Provider store={storeA}>
        <EditMarketingSettingPage history={mockHistory} match={match} />
      </Provider>
    );

    expect(screen.getByTestId("key-input")).toHaveValue("entity-a");

    const storeB = mockStore(
      buildInitialState({ id: 7, key: "entity-b", type: "TEXT" })
    );
    rerender(
      <Provider store={storeB}>
        <EditMarketingSettingPage history={mockHistory} match={match} />
      </Provider>
    );

    expect(screen.getByTestId("key-input")).toHaveValue("entity-b");
  });

  it("saves an update, shows the update message, and navigates to the list", async () => {
    saveMarketingSetting.mockReturnValue(() => Promise.resolve());
    renderWithRedux(
      <EditMarketingSettingPage
        history={mockHistory}
        match={{ params: { setting_id: "5" }, url: "/x" }}
      />,
      {
        initialState: buildInitialState({
          id: 5,
          key: "existing",
          type: "TEXT",
          value: "hello"
        })
      }
    );

    await act(async () => {
      clickSave().click();
      await flushPromises();
    });

    expect(saveMarketingSetting).toHaveBeenCalled();
    expect(mockSuccessMessage).toHaveBeenCalledWith("marketing.setting_saved");
    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/${createMockSummit().id}/marketing`
    );
  });

  it("saves a new setting, shows the created message, and navigates to the list", async () => {
    saveMarketingSetting.mockReturnValue(() => Promise.resolve());
    renderWithRedux(
      <EditMarketingSettingPage
        history={mockHistory}
        match={{ params: {}, url: "/x" }}
      />,
      { initialState: buildInitialState() }
    );

    fireEvent.change(screen.getByTestId("key-input"), {
      target: { value: "new-key" }
    });
    fireEvent.change(screen.getByTestId("type-input"), {
      target: { value: "TEXT" }
    });
    fireEvent.change(screen.getByTestId("value-input"), {
      target: { value: "hello" }
    });

    await act(async () => {
      clickSave().click();
      await flushPromises();
    });

    expect(saveMarketingSetting).toHaveBeenCalled();
    expect(mockSuccessMessage).toHaveBeenCalledWith(
      "marketing.setting_created"
    );
    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/${createMockSummit().id}/marketing`
    );
  });

  it("does not navigate or show a success message when save fails", async () => {
    saveMarketingSetting.mockReturnValue(() => Promise.reject(new Error()));
    renderWithRedux(
      <EditMarketingSettingPage
        history={mockHistory}
        match={{ params: { setting_id: "5" }, url: "/x" }}
      />,
      {
        initialState: buildInitialState({
          id: 5,
          key: "existing",
          type: "TEXT",
          value: "hello"
        })
      }
    );

    await act(async () => {
      clickSave().click();
      await flushPromises();
    });

    expect(mockSuccessMessage).not.toHaveBeenCalled();
    expect(mockHistory.push).not.toHaveBeenCalled();
  });

  it("surfaces a server-side field validation error without a submit", () => {
    renderWithRedux(
      <EditMarketingSettingPage
        history={mockHistory}
        match={{ params: { setting_id: "5" }, url: "/x" }}
      />,
      {
        initialState: buildInitialState(
          { id: 5, key: "duplicate-key", type: "TEXT", value: "hello" },
          { key: "marketing.key_already_exists" }
        )
      }
    );

    expect(screen.getByTestId("key-error")).toHaveTextContent(
      "marketing.key_already_exists"
    );
  });
});
