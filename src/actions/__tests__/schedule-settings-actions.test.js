/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  postRequest,
  putRequest,
  snackbarErrorHandler,
  snackbarSuccessHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import { saveScheduleSettings } from "../schedule-settings-actions";
import * as methods from "../../utils/methods";
import history from "../../history";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  putRequest: jest.fn(),
  snackbarSuccessHandler: jest.fn(() => ({ type: "SNACKBAR_SUCCESS" }))
}));

jest.mock("../../history", () => ({ push: jest.fn() }));

const mockStore = configureStore([thunk]);
const storeState = { currentSummitState: { currentSummit: { id: 1 } } };

const entity = { key: "schedule_1", filters: [], pre_filters: [] };

const resolvingRequest = (response) => () => () => () =>
  Promise.resolve({ response });

describe("saveScheduleSettings", () => {
  beforeEach(() => {
    window.API_BASE_URL = "https://api.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    putRequest.mockImplementation(resolvingRequest({ id: 7 }));
    postRequest.mockImplementation(resolvingRequest({ id: 9 }));
  });

  afterEach(() => {
    delete window.API_BASE_URL;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("shows a success snackbar and goes back to the list when updating", async () => {
    const store = mockStore(storeState);
    await store.dispatch(saveScheduleSettings({ ...entity, id: 7 }));

    expect(putRequest.mock.calls[0][4]).toBe(snackbarErrorHandler);
    expect(snackbarSuccessHandler).toHaveBeenCalledWith({
      title: "general.success",
      html: "edit_schedule_settings.saved"
    });
    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/1/schedule-settings"
    );
    expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
  });

  it("shows a success snackbar and goes back to the list when creating", async () => {
    const store = mockStore(storeState);
    await store.dispatch(saveScheduleSettings(entity));

    expect(postRequest.mock.calls[0][4]).toBe(snackbarErrorHandler);
    expect(snackbarSuccessHandler).toHaveBeenCalledWith({
      title: "general.success",
      html: "edit_schedule_settings.created"
    });
    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/1/schedule-settings"
    );
  });

  it("does not redirect when creating fails", async () => {
    postRequest.mockImplementation(() => () => () => Promise.reject());
    const store = mockStore(storeState);
    await store.dispatch(saveScheduleSettings(entity));

    expect(snackbarSuccessHandler).not.toHaveBeenCalled();
    expect(history.push).not.toHaveBeenCalled();
    expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
  });
});
