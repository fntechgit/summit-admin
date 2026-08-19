import React from "react";
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import userEvent from "@testing-library/user-event";
import { act, screen, waitFor, within } from "@testing-library/react";
import { GlobalConfirmDialog } from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import { deleteRequest } from "openstack-uicore-foundation/lib/utils/actions";
import SponsorFormsTab from "../index";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import * as methods from "../../../../../../utils/methods";
import sponsorPageFormsListReducer, {
  DEFAULT_STATE as sponsorFormsDefaultState
} from "../../../../../../reducers/sponsors/sponsor-page-forms-list-reducer";
import {
  RECEIVE_SPONSOR_MANAGED_FORMS,
  getSponsorManagedForms,
  getSponsorCustomizedForms,
  deleteSponsorCustomizedForm
} from "../../../../../../actions/sponsor-forms-actions";

// Mocks

jest.mock(
  "../components/add-sponsor-form-template-popup",
  () =>
    function MockAddSponsorFormTemplatePopup({ onClose, onSubmit }) {
      return (
        <div data-testid="add-sponsor-form-template-popup">
          <button onClick={onClose}>Close</button>
          <button onClick={() => onSubmit({ id: 1, name: "Test" })}>
            Submit
          </button>
        </div>
      );
    }
);

jest.mock(
  "../components/customized-form/customized-form-popup",
  () =>
    function MockCustomizedFormPopup({ onClose }) {
      return (
        <div data-testid="customized-form-popup">
          <button onClick={onClose}>Close</button>
        </div>
      );
    }
);

// deleteSponsorManagedForm is intentionally left un-mocked (falls through to
// jest.requireActual below): the delete-confirm test exercises the real thunk
// against a real store + reducer, with only the uicore HTTP layer mocked, so
// the SPONSOR_MANAGED_FORM_DELETED reducer case actually runs.
jest.mock("../../../../../../actions/sponsor-forms-actions", () => ({
  ...jest.requireActual("../../../../../../actions/sponsor-forms-actions"),
  getSponsorManagedForms: jest.fn(() => () => Promise.resolve()),
  getSponsorCustomizedForms: jest.fn(() => () => Promise.resolve()),
  saveSponsorManagedForm: jest.fn(() => () => Promise.resolve()),
  overrideSponsorManagedForm: jest.fn(() => () => Promise.resolve()),
  archiveSponsorCustomizedForm: jest.fn(() => () => Promise.resolve()),
  unarchiveSponsorCustomizedForm: jest.fn(() => () => Promise.resolve()),
  deleteSponsorCustomizedForm: jest.fn(() => () => Promise.resolve())
}));

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  deleteRequest: jest.fn()
}));

// Helpers

const createSponsor = (overrides = {}) => ({
  id: 1,
  ...overrides
});

const createManagedForm = (id, overrides = {}) => ({
  id,
  code: `MANAGED-${id}`,
  name: `Managed Form ${id}`,
  items_count: 0,
  allowed_add_ons: [],
  assignment_type: "Explicit",
  ...overrides
});

const createCustomizedForm = (id, overrides = {}) => ({
  id,
  code: `CODE-${id}`,
  name: `Form ${id}`,
  items_count: 0,
  allowed_add_ons: [],
  is_archived: false,
  ...overrides
});

const defaultState = {
  sponsorPageFormsListState: {
    ...sponsorFormsDefaultState,
    managedForms: {
      ...sponsorFormsDefaultState.managedForms,
      forms: [],
      totalCount: 0
    },
    customizedForms: {
      ...sponsorFormsDefaultState.customizedForms,
      forms: [],
      totalCount: 0
    },
    showArchived: false,
    term: ""
  },
  currentSummitState: {
    currentSummit: {
      id: 1,
      time_zone: { name: "UTC" }
    }
  },
  currentSponsorState: {
    entity: { id: 1 },
    errors: {}
  }
};

const renderWithConfirmDialog = (ui, options) =>
  renderWithRedux(
    <>
      <GlobalConfirmDialog />
      {ui}
    </>,
    options
  );

// Passthrough reducer for state slices the delete flow doesn't mutate.
const staticReducer =
  (initialState) =>
  (state = initialState) =>
    state;

// Real store + real reducer, seeded via the actual RECEIVE_SPONSOR_MANAGED_FORMS
// action, so the SPONSOR_MANAGED_FORM_DELETED case genuinely runs and the table
// re-renders from real state instead of a static mock.
const createRealStore = (managedFormsData) => {
  const store = createStore(
    combineReducers({
      sponsorPageFormsListState: sponsorPageFormsListReducer,
      currentSummitState: staticReducer(defaultState.currentSummitState),
      currentSponsorState: staticReducer(defaultState.currentSponsorState)
    }),
    applyMiddleware(thunk)
  );

  store.dispatch({
    type: RECEIVE_SPONSOR_MANAGED_FORMS,
    payload: {
      response: {
        current_page: 1,
        last_page: 1,
        total: managedFormsData.length,
        data: managedFormsData
      }
    }
  });

  return store;
};

describe("SponsorFormsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // clearAllMocks()/restoreAllMocks() do not reset a plain jest.fn()'s
    // mockImplementation, so a test that sets one on `deleteRequest` would
    // otherwise leak it into whichever test runs next in this file.
    deleteRequest.mockReset();
  });

  describe("managed forms delete", () => {
    it("shows the delete action only for EXPLICIT managed forms", () => {
      renderWithConfirmDialog(<SponsorFormsTab sponsor={createSponsor()} />, {
        initialState: {
          ...defaultState,
          sponsorPageFormsListState: {
            ...defaultState.sponsorPageFormsListState,
            managedForms: {
              ...defaultState.sponsorPageFormsListState.managedForms,
              forms: [
                createManagedForm(1, { assignment_type: "Explicit" }),
                createManagedForm(2, { assignment_type: "Implicit" })
              ],
              totalCount: 2
            }
          }
        }
      });

      const explicitRow = screen.getByText("Managed Form 1").closest("tr");
      const implicitRow = screen.getByText("Managed Form 2").closest("tr");

      expect(within(explicitRow).getByTestId("DeleteIcon")).toBeInTheDocument();
      expect(
        within(implicitRow).queryByTestId("DeleteIcon")
      ).not.toBeInTheDocument();
    });

    it("calls the delete request with the correct form id and removes the row from the table when confirmed", async () => {
      deleteRequest.mockImplementation(
        (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
          dispatch(
            typeof receiveActionCreator === "function"
              ? receiveActionCreator({ response: {} })
              : receiveActionCreator
          );
          return Promise.resolve({ response: {} });
        }
      );

      const store = createRealStore([
        createManagedForm(1, { assignment_type: "Explicit" }),
        createManagedForm(2, { assignment_type: "Explicit" })
      ]);

      renderWithConfirmDialog(<SponsorFormsTab sponsor={createSponsor()} />, {
        store
      });

      expect(screen.getByText("Managed Form 1")).toBeInTheDocument();
      expect(screen.getByText("Managed Form 2")).toBeInTheDocument();

      const deleteButtons = screen.getAllByTestId("DeleteIcon");
      const secondDeleteButton = deleteButtons[1].closest("button");
      await act(async () => {
        await userEvent.click(secondDeleteButton);
      });

      expect(
        await screen.findByText("general.are_you_sure")
      ).toBeInTheDocument();

      await act(async () => {
        await userEvent.click(
          await screen.findByRole("button", {
            name: /general\.yes_delete|confirm/i
          })
        );
      });

      // Verifies the real thunk was invoked with the id of the row that was
      // actually clicked (form 2), all the way down to the HTTP boundary.
      await waitFor(() => {
        expect(deleteRequest).toHaveBeenCalledWith(
          null,
          expect.objectContaining({ payload: { formId: 2 } }),
          expect.stringContaining("/managed-forms/2"),
          null,
          expect.any(Function)
        );
      });

      // Verifies the real reducer removed the row: form 2 is gone, form 1 stays.
      await waitFor(() => {
        expect(screen.queryByText("Managed Form 2")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Managed Form 1")).toBeInTheDocument();

      await waitFor(() => {
        expect(getSponsorManagedForms).toHaveBeenCalledTimes(2); // mount + after delete
        expect(getSponsorCustomizedForms).toHaveBeenCalledTimes(2);
      });
    });

    it("does not call the delete request and keeps the row when delete is cancelled", async () => {
      renderWithConfirmDialog(<SponsorFormsTab sponsor={createSponsor()} />, {
        initialState: {
          ...defaultState,
          sponsorPageFormsListState: {
            ...defaultState.sponsorPageFormsListState,
            managedForms: {
              ...defaultState.sponsorPageFormsListState.managedForms,
              forms: [createManagedForm(1, { assignment_type: "Explicit" })],
              totalCount: 1
            }
          }
        }
      });

      const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
      await act(async () => {
        await userEvent.click(deleteButton);
      });

      expect(
        await screen.findByText("general.are_you_sure")
      ).toBeInTheDocument();

      await act(async () => {
        await userEvent.click(
          await screen.findByRole("button", { name: /cancel|general\.cancel/i })
        );
      });

      expect(deleteRequest).not.toHaveBeenCalled();
      expect(getSponsorManagedForms).toHaveBeenCalledTimes(1); // mount only
      expect(screen.getByText("Managed Form 1")).toBeInTheDocument();
    });

    it("keeps the row and does not refresh the lists when the delete request fails", async () => {
      deleteRequest.mockImplementation(
        () => () => () => Promise.reject(new Error("delete failed"))
      );

      const store = createRealStore([
        createManagedForm(1, { assignment_type: "Explicit" })
      ]);

      renderWithConfirmDialog(<SponsorFormsTab sponsor={createSponsor()} />, {
        store
      });

      const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
      await act(async () => {
        await userEvent.click(deleteButton);
      });

      expect(
        await screen.findByText("general.are_you_sure")
      ).toBeInTheDocument();

      await act(async () => {
        await userEvent.click(
          await screen.findByRole("button", {
            name: /general\.yes_delete|confirm/i
          })
        );
      });

      // Lets the rejected promise chain (deleteSponsorManagedForm's own
      // .finally() plus handleManagedDelete's .catch()) settle. If the
      // .catch() were removed, this would surface as an unhandled rejection
      // and fail the test.
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.getByText("Managed Form 1")).toBeInTheDocument();
      expect(getSponsorManagedForms).toHaveBeenCalledTimes(1); // mount only, no refresh on failure
      expect(getSponsorCustomizedForms).toHaveBeenCalledTimes(1);
    });
  });

  describe("customized forms delete", () => {
    it("calls deleteSponsorCustomizedForm and refreshes both lists when delete is confirmed", async () => {
      renderWithConfirmDialog(<SponsorFormsTab sponsor={createSponsor()} />, {
        initialState: {
          ...defaultState,
          sponsorPageFormsListState: {
            ...defaultState.sponsorPageFormsListState,
            customizedForms: {
              ...defaultState.sponsorPageFormsListState.customizedForms,
              forms: [createCustomizedForm(1)],
              totalCount: 1
            }
          }
        }
      });

      const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
      await act(async () => {
        await userEvent.click(deleteButton);
      });

      expect(
        await screen.findByText("general.are_you_sure")
      ).toBeInTheDocument();

      await act(async () => {
        await userEvent.click(
          await screen.findByRole("button", {
            name: /general\.yes_delete|confirm/i
          })
        );
      });

      await waitFor(() => {
        expect(deleteSponsorCustomizedForm).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(getSponsorCustomizedForms).toHaveBeenCalledTimes(2); // mount + after delete
        expect(getSponsorManagedForms).toHaveBeenCalledTimes(2);
      });
    });
  });
});
