import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { useFormikContext } from "formik";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import {
  getRequest,
  postRequest,
  putRequest,
  START_LOADING,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import EditPromocodePage from "../edit-promocode-page";
import promocodeReducer from "../../../reducers/promocodes/promocode-reducer";
import {
  RECEIVE_PROMOCODE,
  RECEIVE_PROMOCODE_META
} from "../../../actions/promocode-actions";
import * as methods from "../../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  putRequest: jest.fn()
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("react-breadcrumbs", () => ({ Breadcrumb: () => null }));

// the form itself is covered by its own tests, only the page's save flow matters here
const mockPromocodeForm = jest.fn(() => null);
jest.mock("../../../components/forms/promocode-form", () => ({
  __esModule: true,
  ...jest.requireActual("../../../components/forms/promocode-form"),
  default: (props) => mockPromocodeForm(props)
}));

const SAVED = {
  id: 12,
  code: "SAVED12",
  class_name: "SUMMIT_PROMO_CODE",
  tags: [],
  ticket_types_rules: [],
  allowed_ticket_types: []
};

// uicore request helpers: dispatch the success action and resolve with the payload
const respondWith = (response) => (_req, success) => () => (dispatch) => {
  const payload = { response };
  dispatch(typeof success === "function" ? success(payload) : success);
  return Promise.resolve(payload);
};

const buildStore = () =>
  createStore(
    combineReducers({
      currentSummitState: (
        state = {
          currentSummit: {
            id: 1,
            time_zone_id: "UTC",
            badge_features: [],
            badge_types: []
          }
        }
      ) => state,
      currentPromocodeState: promocodeReducer,
      // the global overlay flag, as base-reducer keeps it
      loading: (state = 0, { type }) => {
        if (type === START_LOADING) return 1;
        if (type === STOP_LOADING) return 0;
        return state;
      }
    }),
    applyMiddleware(thunk)
  );

const renderPage = (url, promocodeId, store = buildStore()) => {
  const history = { push: jest.fn() };
  render(
    <Provider store={store}>
      <EditPromocodePage
        match={{ url, params: { promocode_id: promocodeId } }}
        history={history}
      />
    </Provider>
  );
  return history;
};

describe("EditPromocodePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation((req, success, url) =>
      respondWith(
        url.endsWith("/metadata")
          ? [{ class_name: "SUMMIT_PROMO_CODE", type: [] }]
          : SAVED
      )(req, success)
    );
    postRequest.mockImplementation(respondWith(SAVED));
    putRequest.mockImplementation(respondWith(SAVED));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("a new promo code goes to its edit page after it is created", async () => {
    const store = buildStore();
    const history = renderPage(
      "/app/summits/1/promocodes/new",
      undefined,
      store
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "general.save" })
    );

    await waitFor(() =>
      expect(history.push).toHaveBeenCalledWith("/app/summits/1/promocodes/12")
    );
    expect(postRequest).toHaveBeenCalled();
    expect(store.getState().loading).toBe(0);
  });

  test("an edited sponsor promo code goes back to the sponsor promo codes list", async () => {
    const history = renderPage("/app/summits/1/sponsors/promocodes/12", "12");

    await userEvent.click(
      await screen.findByRole("button", { name: "general.save" })
    );

    await waitFor(() =>
      expect(history.push).toHaveBeenCalledWith(
        "/app/summits/1/sponsors/promocodes"
      )
    );
    expect(putRequest).toHaveBeenCalled();
  });

  test("a new promo code never mounts the form with the code edited before it", async () => {
    // the store still holds the speakers code saved on the previous page, and the classes the list loaded
    const store = buildStore();
    store.dispatch({
      type: RECEIVE_PROMOCODE_META,
      payload: { response: [{ class_name: "SPEAKERS_PROMO_CODE", type: [] }] }
    });
    store.dispatch({
      type: RECEIVE_PROMOCODE,
      payload: { response: { ...SAVED, class_name: "SPEAKERS_PROMO_CODE" } }
    });

    renderPage("/app/summits/1/promocodes/new", undefined, store);

    expect(
      await screen.findByText("general.add edit_promocode.promocode")
    ).toBeInTheDocument();
    expect(mockPromocodeForm).toHaveBeenCalled();
    mockPromocodeForm.mock.calls.forEach(([props]) =>
      expect(props.entity.id).toBe(0)
    );
  });

  test("a failed create does not leave its draft in redux", async () => {
    // like uicore: dispatch the request action with its payload, then reject
    postRequest.mockImplementation(
      (req, _success, _url, _body, _errorHandler, reqPayload) =>
        () =>
        (dispatch) => {
          if (typeof req === "function") dispatch(req(reqPayload));
          return Promise.reject();
        }
    );
    mockPromocodeForm.mockImplementation(() => {
      const { setFieldValue } = useFormikContext();
      React.useEffect(() => {
        setFieldValue("code", "DRAFT");
      }, []);
      return null;
    });
    const store = buildStore();
    renderPage("/app/summits/1/promocodes/new", undefined, store);
    const save = await screen.findByRole("button", { name: "general.save" });

    await userEvent.click(save);

    await waitFor(() => expect(postRequest).toHaveBeenCalled());
    await waitFor(() => expect(save).toBeEnabled());
    // reopening /new seeds the form from redux, so the draft must not be there
    expect(store.getState().currentPromocodeState.entity.code).toBe("");
    expect(store.getState().loading).toBe(0);
  });

  test("a failed save stays on the page", async () => {
    putRequest.mockImplementation(() => () => () => Promise.reject());
    const history = renderPage("/app/summits/1/promocodes/12", "12");
    const save = await screen.findByRole("button", { name: "general.save" });

    await userEvent.click(save);

    await waitFor(() => expect(save).toBeEnabled());
    expect(history.push).not.toHaveBeenCalled();
  });
});
