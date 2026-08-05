import React from "react";
import userEvent from "@testing-library/user-event";
import { act, screen, waitFor } from "@testing-library/react";
import { GlobalConfirmDialog } from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import SponsorFormsTab from "../index";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import { DEFAULT_STATE as sponsorFormsDefaultState } from "../../../../../../reducers/sponsors/sponsor-page-forms-list-reducer";
import {
  getSponsorManagedForms,
  getSponsorCustomizedForms,
  deleteSponsorManagedForm,
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

jest.mock("../../../../../../actions/sponsor-forms-actions", () => ({
  ...jest.requireActual("../../../../../../actions/sponsor-forms-actions"),
  getSponsorManagedForms: jest.fn(() => () => Promise.resolve()),
  getSponsorCustomizedForms: jest.fn(() => () => Promise.resolve()),
  saveSponsorManagedForm: jest.fn(() => () => Promise.resolve()),
  overrideSponsorManagedForm: jest.fn(() => () => Promise.resolve()),
  archiveSponsorCustomizedForm: jest.fn(() => () => Promise.resolve()),
  unarchiveSponsorCustomizedForm: jest.fn(() => () => Promise.resolve()),
  deleteSponsorCustomizedForm: jest.fn(() => () => Promise.resolve()),
  deleteSponsorManagedForm: jest.fn(() => () => Promise.resolve())
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

describe("SponsorFormsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      expect(screen.getAllByTestId("DeleteIcon")).toHaveLength(1);
    });

    it("calls deleteSponsorManagedForm and refreshes both lists when delete is confirmed", async () => {
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
          await screen.findByRole("button", {
            name: /general\.yes_delete|confirm/i
          })
        );
      });

      await waitFor(() => {
        expect(deleteSponsorManagedForm).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(getSponsorManagedForms).toHaveBeenCalledTimes(2); // mount + after delete
        expect(getSponsorCustomizedForms).toHaveBeenCalledTimes(2);
      });
    });

    it("does not call deleteSponsorManagedForm when delete is cancelled", async () => {
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

      expect(deleteSponsorManagedForm).not.toHaveBeenCalled();
      expect(getSponsorManagedForms).toHaveBeenCalledTimes(1);
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
