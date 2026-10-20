import React from "react";
import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import PromocodeListPage from "../promocode-list-page";
import {
  getPromocodes,
  deletePromocode
} from "../../../actions/promocode-actions";

jest.mock("../../../actions/promocode-actions", () => ({
  getPromocodes: jest.fn(() => ({ type: "GET_PROMOCODES" })),
  getPromocodeMeta: jest.fn(() => ({ type: "GET_META" })),
  deletePromocode: jest.fn(() => ({ type: "DELETE_PROMOCODE" })),
  exportPromocodes: jest.fn(() => ({ type: "EXPORT" })),
  importPromoCodesCSV: jest.fn(() => ({ type: "IMPORT" }))
}));
jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn(() => ({ type: "GET_SUMMIT" }))
}));

// the table and search capture their props so tests can drive them
let tableProps;
let searchProps;
jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: (props) => {
    tableProps = props;
    return null;
  }
}));
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: (props) => {
      searchProps = props;
      return null;
    }
  })
);
jest.mock("../../../components/filters/or-and-filter", () => () => null);
jest.mock("../../../components/import-promocodes", () => () => null);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/dropdown",
  () => () => null
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/member-input",
  () => () => null
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/tag-input",
  () => () => null
);
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ successMessage: jest.fn() })
  })
);
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const PROMOCODES = [
  { id: 11, code: "FREE-1", redeemed: "No", owner: "", owner_email: "" },
  { id: 12, code: "FREE-2", redeemed: "Yes", owner: "", owner_email: "" }
];

const listState = {
  promocodes: PROMOCODES,
  term: "abc",
  filters: { typeFilter: null, classNamesFilter: [], tagsFilter: [] },
  order: "code",
  orderDir: 1,
  currentPage: 3,
  perPage: 10,
  totalPromocodes: 2,
  allTypes: ["ALL"],
  allClasses: [],
  extraColumns: []
};

const renderPage = (history = { push: jest.fn() }) => {
  const store = createStore(
    combineReducers({
      currentSummitState: (state = { currentSummit: { id: 1 } }) => state,
      currentPromocodeListState: (state = listState) => state
    })
  );
  render(
    <Provider store={store}>
      <PromocodeListPage history={history} />
    </Provider>
  );
  return history;
};

describe("PromocodeListPage", () => {
  beforeEach(() => jest.clearAllMocks());

  test("loads the current page on mount", () => {
    renderPage();
    expect(getPromocodes).toHaveBeenCalledWith(
      "abc",
      3,
      10,
      "code",
      1,
      listState.filters,
      []
    );
  });

  test("sorting reloads from the first page with the new order", () => {
    renderPage();
    act(() => tableProps.onSort("redeemed", -1));
    expect(getPromocodes).toHaveBeenLastCalledWith(
      "abc",
      1,
      10,
      "redeemed",
      -1,
      listState.filters,
      []
    );
  });

  test("changing rows per page reloads from the first page", () => {
    renderPage();
    act(() => tableProps.onPerPageChange(50));
    expect(getPromocodes).toHaveBeenLastCalledWith(
      "abc",
      1,
      50,
      "code",
      1,
      listState.filters,
      []
    );
  });

  test("changing page keeps the other list params", () => {
    renderPage();
    act(() => tableProps.onPageChange(2));
    expect(getPromocodes).toHaveBeenLastCalledWith(
      "abc",
      2,
      10,
      "code",
      1,
      listState.filters,
      []
    );
  });

  test("searching reloads from the first page with the new term", () => {
    renderPage();
    act(() => searchProps.onSearch("xyz"));
    expect(getPromocodes).toHaveBeenLastCalledWith(
      "xyz",
      1,
      10,
      "code",
      1,
      listState.filters,
      []
    );
  });

  test("editing a row navigates to that promo code", () => {
    const history = renderPage();
    tableProps.onEdit(PROMOCODES[0]);
    expect(history.push).toHaveBeenCalledWith("/app/summits/1/promocodes/11");
  });

  test("only unredeemed codes can be deleted", () => {
    renderPage();
    expect(tableProps.canDelete(PROMOCODES[0])).toBe(true);
    expect(tableProps.canDelete(PROMOCODES[1])).toBe(false);
  });

  test("the delete confirmation names the code and deletes by id", () => {
    renderPage();
    const name = tableProps.getName(PROMOCODES[0]);
    expect(tableProps.deleteDialogBody(name)).toBe(
      "promocode_list.remove_promocode_warning FREE-1"
    );
    tableProps.onDelete(11);
    expect(deletePromocode).toHaveBeenCalledWith(11);
  });
});
