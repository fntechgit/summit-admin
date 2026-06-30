import React from "react";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import flushPromises from "flush-promises";
import PaymentProfileListPage from "../payment-profile-list-page";
import { renderWithRedux } from "../../../../utils/test-utils";
import {
  savePaymentProfile,
  getPaymentProfiles,
  savePaymentFeeType,
  getPaymentFeeTypes,
  resetPaymentProfileForm
} from "../../../../actions/ticket-actions";

let capturedDialogProps = null;

jest.mock(
  "../components/payment-profile-dialog",
  () =>
    function MockPaymentProfileDialog(props) {
      capturedDialogProps = props;
      return <div data-testid="payment-profile-dialog" />;
    }
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () => () => null
);
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => () => null
);

jest.mock("../../../../actions/ticket-actions", () => ({
  getPaymentProfiles: jest.fn(() => () => Promise.resolve()),
  getPaymentProfile: jest.fn(() => () => Promise.resolve()),
  savePaymentProfile: jest.fn(() => () => Promise.resolve()),
  deletePaymentProfile: jest.fn(() => () => Promise.resolve()),
  getPaymentFeeTypes: jest.fn(() => () => Promise.resolve()),
  savePaymentFeeType: jest.fn(() => () => Promise.resolve()),
  deletePaymentFeeType: jest.fn(() => () => Promise.resolve()),
  resetPaymentProfileForm: jest.fn(() => () => undefined)
}));

const baseState = {
  currentSummitState: {
    currentSummit: { id: 1, name: "Test Summit" }
  },
  currentPaymentProfileListState: {
    paymentProfiles: [],
    term: "",
    currentPage: 1,
    perPage: 10,
    order: "id",
    orderDir: 1,
    totalPaymentProfiles: 0
  },
  currentPaymentProfileState: {
    entity: { id: 1, application_type: "SponsorServices", provider: "Stripe" }
  },
  currentPaymentFeeListTypeState: {
    paymentFeeTypes: [],
    totalPaymentFeeTypes: 0,
    order: "id",
    orderDir: 1
  }
};

describe("PaymentProfileListPage popup behavior", () => {
  beforeEach(() => {
    capturedDialogProps = null;
    savePaymentProfile.mockReturnValue(() => Promise.resolve());
    getPaymentProfiles.mockReturnValue(() => Promise.resolve());
    savePaymentFeeType.mockReturnValue(() => Promise.resolve());
    getPaymentFeeTypes.mockReturnValue(() => Promise.resolve());
    resetPaymentProfileForm.mockReturnValue(() => undefined);
  });

  const openPopup = async () => {
    const addButton = screen.getByRole("button", {
      name: /add_payment_profile/i
    });
    fireEvent.click(addButton);
    await waitFor(() =>
      expect(screen.getByTestId("payment-profile-dialog")).toBeInTheDocument()
    );
  };

  test("dialog is not shown before Add is clicked, and closes when onClose is called", async () => {
    renderWithRedux(<PaymentProfileListPage />, { initialState: baseState });
    expect(
      screen.queryByTestId("payment-profile-dialog")
    ).not.toBeInTheDocument();

    await openPopup();

    await act(async () => {
      capturedDialogProps.onClose();
    });
    expect(
      screen.queryByTestId("payment-profile-dialog")
    ).not.toBeInTheDocument();
    expect(resetPaymentProfileForm).toHaveBeenCalled();
  });

  test("handleSave calls savePaymentProfile and refreshes the list on success", async () => {
    renderWithRedux(<PaymentProfileListPage />, { initialState: baseState });
    await openPopup();

    await act(async () => {
      await capturedDialogProps.onSave({
        id: 0,
        application_type: "Registration",
        provider: "Stripe"
      });
      await flushPromises();
    });

    expect(savePaymentProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        application_type: "Registration",
        provider: "Stripe"
      })
    );
    expect(getPaymentProfiles).toHaveBeenCalled();
  });

  test("fee type save keeps popup open and refreshes fee types", async () => {
    renderWithRedux(<PaymentProfileListPage />, { initialState: baseState });
    await openPopup();

    await act(async () => {
      await capturedDialogProps.onSaveFeeType({
        id: 0,
        name: "Processing Fee",
        kind: "Rate",
        payment_method: "card",
        value: 250,
        max_cents: 0,
        min_cents: 0
      });
      await flushPromises();
    });

    expect(screen.getByTestId("payment-profile-dialog")).toBeInTheDocument();
    expect(getPaymentFeeTypes).toHaveBeenCalledWith(
      baseState.currentPaymentProfileState.entity.id
    );
  });

  test("onSave rejects when list refresh fails after successful save, keeping dialog open", async () => {
    // savePaymentProfile succeeds but the subsequent getPaymentProfiles call fails.
    // The returned promise from handleSave (onSave prop) must reject so the dialog
    // stays open - preventing a silent duplicate creation if the user retries.
    savePaymentProfile.mockReturnValue(() => Promise.resolve());
    getPaymentProfiles
      .mockReturnValueOnce(() => Promise.resolve()) // initial load on mount
      .mockReturnValueOnce(() => Promise.reject(new Error("refresh failed"))); // after save

    renderWithRedux(<PaymentProfileListPage />, { initialState: baseState });
    await openPopup();

    let saveError;
    await act(async () => {
      saveError = await capturedDialogProps
        .onSave({ id: 0, application_type: "Registration", provider: "Stripe" })
        .catch((e) => e);
      await flushPromises();
    });

    expect(saveError).toBeInstanceOf(Error);
    expect(screen.getByTestId("payment-profile-dialog")).toBeInTheDocument();
  });
});
