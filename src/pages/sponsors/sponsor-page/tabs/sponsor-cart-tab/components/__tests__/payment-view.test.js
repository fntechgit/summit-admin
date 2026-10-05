/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../../../../../utils/test-utils";
import PaymentView from "../payment-view";
import { payWithInvoice } from "../../../../../../../actions/sponsor-cart-actions";
import history from "../../../../../../../history";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../../../../history", () => ({
  __esModule: true,
  default: { push: jest.fn() }
}));

jest.mock("../../../../../../../actions/sponsor-cart-actions", () => ({
  getPaymentProfile: jest.fn(() => () => Promise.resolve()),
  updatePaymentIntent: jest.fn(() => () => Promise.resolve()),
  confirmPayment: jest.fn(() => () => Promise.resolve()),
  payWithInvoice: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../../../../../actions/member-actions", () => ({
  getMemberByExternalId: jest.fn(() => () => Promise.resolve())
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ errorMessage: jest.fn() })
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/stripe-payment",
  () => ({
    __esModule: true,
    default: () => <div data-testid="stripe-payment" />
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/order-summary",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/sponsor-order-grid",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock("../client-form", () => ({
  __esModule: true,
  default: () => null
}));

const PAY_WITH_INVOICE_INSTEAD =
  "edit_sponsor.cart_tab.payment_view.pay_with_invoice_instead";

const renderPaymentView = (cartListState = {}) =>
  renderWithRedux(<PaymentView />, {
    initialState: {
      currentSummitState: { currentSummit: { id: 1 } },
      currentSponsorState: { entity: { id: 123, company: { name: "Acme" } } },
      sponsorPageCartListState: {
        cart: { id: 5, owner_id: 9, card_payment_purchase_id: 7 },
        cartOwner: {},
        paymentProfile: { id: 2 },
        paymentIntent: { id: 3, total_amount: 10000 },
        ...cartListState
      }
    }
  });

describe("PaymentView - Pay with invoice instead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is shown beneath the card payment form for a cart being paid by card", () => {
    renderPaymentView();

    const stripeForm = screen.getByTestId("stripe-payment");
    const link = screen.getByRole("button", { name: PAY_WITH_INVOICE_INSTEAD });
    expect(stripeForm.compareDocumentPosition(link)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("is still shown when the card payment could not be created", () => {
    renderPaymentView({ paymentProfile: null, paymentIntent: null });

    expect(screen.queryByTestId("stripe-payment")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: PAY_WITH_INVOICE_INSTEAD })
    ).toBeInTheDocument();
  });

  it("is not shown for a regular cart", () => {
    renderPaymentView({ cart: { id: 5, owner_id: 9 } });

    expect(
      screen.queryByRole("button", { name: PAY_WITH_INVOICE_INSTEAD })
    ).not.toBeInTheDocument();
  });

  it("pays with invoice and lands on the invoice view", async () => {
    renderPaymentView();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: PAY_WITH_INVOICE_INSTEAD })
      );
      await flushPromises();
    });

    expect(payWithInvoice).toHaveBeenCalledTimes(1);
    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/1/sponsors/123/cart/invoice"
    );
  });

  it("stays on the payment screen when paying with invoice fails", async () => {
    payWithInvoice.mockImplementationOnce(
      () => () => Promise.reject(new Error("412"))
    );
    renderPaymentView();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: PAY_WITH_INVOICE_INSTEAD })
      );
      await flushPromises();
    });

    expect(history.push).not.toHaveBeenCalled();
  });
});
