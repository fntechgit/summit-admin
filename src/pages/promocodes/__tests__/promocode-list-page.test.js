import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import {
  getCSV,
  getRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  JOIN_OPERATORS,
  allFiltersReducer,
  saveFilters
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import PromocodeListPage from "../promocode-list-page";
import promocodeListReducer from "../../../reducers/promocodes/promocode-list-reducer";
import * as methods from "../../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  getCSV: jest.fn(() => ({ type: "MOCK_GET_CSV" }))
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryTags: jest.fn(),
  queryMembers: (input, callback) =>
    callback([
      {
        id: 42,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com"
      }
    ])
}));

// stubs the async member select so the test can pick an option without the real popper
jest.mock("@mui/material/Autocomplete", () => ({
  __esModule: true,
  default: ({ onChange, options }) => (
    <button
      type="button"
      data-testid="select-member-option"
      disabled={!options?.length}
      onClick={() => onChange({}, options[0])}
    >
      select-member-option
    </button>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("acme")}>
        search-acme
      </button>
    )
  })
);

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, columns, canDelete }) => (
    <div>
      <div data-testid="headers">
        {columns.map((col) => (
          <span key={col.columnKey}>{col.header}</span>
        ))}
      </div>
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          {row.code}
          {canDelete(row) && <button type="button">delete</button>}
        </div>
      ))}
    </div>
  )
}));

const FILTER_ID = "promocode_list";
const PROMOCODES_URL = "/api/v1/summits/1/promo-codes";

const buildStore = (listOverrides = {}) =>
  createStore(
    combineReducers({
      allGridFiltersState: allFiltersReducer,
      currentSummitState: (state = { currentSummit: { id: 1, name: "S" } }) =>
        state,
      currentPromocodeListState: promocodeListReducer
    }),
    {
      currentPromocodeListState: {
        ...promocodeListReducer(undefined, {}),
        ...listOverrides
      }
    },
    applyMiddleware(thunk)
  );

const renderPage = (store) =>
  render(
    <Provider store={store}>
      <PromocodeListPage history={{ push: jest.fn() }} />
    </Provider>
  );

// filter[] of the last promo codes list request
const lastListFilter = () => {
  const calls = getRequest.mock.calls.filter(([, , url]) =>
    url.endsWith(PROMOCODES_URL)
  );
  return calls[calls.length - 1].params["filter[]"];
};

describe("PromocodeListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(() => {
      const call = getRequest.mock.calls[getRequest.mock.calls.length - 1];
      return (params) => {
        call.params = params;
        return () => Promise.resolve({ response: { data: [] } });
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("applying a creator filter from the grid filter requests promo codes by creator email", async () => {
    renderPage(buildStore());

    await userEvent.click(
      screen.getByRole("button", { name: "grid_filter.open_filters" })
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getAllByRole("combobox")[0]);
    await userEvent.click(
      await screen.findByRole("option", { name: "promocode_list.creator" })
    );
    const selectMember = await screen.findByTestId("select-member-option");
    await waitFor(() => expect(selectMember).toBeEnabled());
    await userEvent.click(selectMember);
    await userEvent.click(
      within(dialog).getByRole("button", { name: "grid_filter.apply_filters" })
    );

    await waitFor(() =>
      expect(lastListFilter()).toEqual(["creator_email==jane@example.com"])
    );
  });

  test("joining filters by ANY wraps each one in or(), while the search term stays ANDed", async () => {
    const store = buildStore();
    store.dispatch(
      saveFilters(
        FILTER_ID,
        [
          { criteria: "type", operator: "==", value: "X", parsed: ["type==X"] },
          {
            criteria: "class_name",
            operator: "==",
            value: ["A", "B"],
            parsed: ["class_name==A||B"]
          }
        ],
        JOIN_OPERATORS.ANY
      )
    );
    renderPage(store);

    await waitFor(() =>
      expect(lastListFilter()).toEqual(["or(type==X)", "or(class_name==A||B)"])
    );

    await userEvent.click(screen.getByRole("button", { name: "search-acme" }));

    await waitFor(() => {
      const filter = lastListFilter();
      expect(filter.slice(0, 2)).toEqual([
        "or(type==X)",
        "or(class_name==A||B)"
      ]);
      expect(filter[2]).toMatch(/^code=@acme,/);
    });
  });

  test("exports with the applied filters, search term and order", async () => {
    const store = buildStore({ term: "acme", order: "id", orderDir: -1 });
    store.dispatch(
      saveFilters(
        FILTER_ID,
        [{ criteria: "type", operator: "==", value: "X", parsed: ["type==X"] }],
        JOIN_OPERATORS.ALL
      )
    );
    renderPage(store);

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "general.export" })
      );
    });

    await waitFor(() => expect(getCSV).toHaveBeenCalled());
    const [url, params] = getCSV.mock.calls[0];
    expect(url).toBe("/api/v1/summits/1/promo-codes/csv");
    expect(params["filter[]"][0]).toBe("type==X");
    expect(params["filter[]"][1]).toMatch(/^code=@acme,/);
    expect(params.order).toBe("-id");
  });

  test("offers delete only for promo codes that were not redeemed", () => {
    renderPage(
      buildStore({
        promocodes: [
          { id: 1, code: "FREE", redeemed: "No" },
          { id: 2, code: "USED", redeemed: "Yes" }
        ]
      })
    );

    expect(
      within(screen.getByTestId("row-1")).getByRole("button", {
        name: "delete"
      })
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("row-2")).queryByRole("button", {
        name: "delete"
      })
    ).not.toBeInTheDocument();
  });

  test("shows the optional columns remembered from the last visit", () => {
    renderPage(
      buildStore({
        promocodes: [{ id: 1, code: "FREE", redeemed: "No" }],
        extraColumns: ["owner_email"]
      })
    );

    const headers = screen.getByTestId("headers");
    expect(
      within(headers).getByText("promocode_list.owner_email")
    ).toBeInTheDocument();
    expect(
      within(headers).queryByText("promocode_list.creator")
    ).not.toBeInTheDocument();
  });
});
