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
import { renderWithRedux } from "../../../../../../../utils/test-utils";
import CartView from "../cart-view";
import {
  checkoutCart,
  payWithInvoice
} from "../../../../../../../actions/sponsor-cart-actions";
import history from "../../../../../../../history";
import { SPONSOR_CART_STATUS } from "../../../../../../../utils/constants";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../../../../components/mui/showConfirmDialog", () =>
  jest.fn()
);

jest.mock("../../../../../../../history", () => ({
  __esModule: true,
  default: { push: jest.fn() }
}));

jest.mock("../../../../../../../actions/sponsor-cart-actions", () => ({
  getSponsorCart: jest.fn(() => () => Promise.resolve()),
  deleteSponsorCartForm: jest.fn(() => () => Promise.resolve()),
  lockSponsorCartForm: jest.fn(() => () => Promise.resolve()),
  unlockSponsorCartForm: jest.fn(() => () => Promise.resolve()),
  saveSponsorCartNote: jest.fn(() => () => Promise.resolve()),
  deleteSponsorCartNote: jest.fn(() => () => Promise.resolve()),
  checkoutCart: jest.fn(() => () => Promise.resolve()),
  reopenCart: jest.fn(() => () => Promise.resolve()),
  payWithInvoice: jest.fn(() => () => Promise.resolve())
}));

const createCart = (overrides = {}) => ({
  id: 1,
  status: SPONSOR_CART_STATUS.OPEN,
  net_amount: 10000,
  total: 10000,
  notes: [],
  forms: [
    {
      id: 10,
      code: "F-01",
      name: "Booth",
      addon_name: "",
      item_count: 1,
      discount: "0%",
      amount: "$100.00",
      is_locked: false
    }
  ],
  ...overrides
});

const renderCartView = (cart) =>
  renderWithRedux(<CartView onAddForm={jest.fn()} />, {
    initialState: { sponsorPageCartListState: { cart, term: "" } }
  });

const clickButton = async (name) => {
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name }));
  });
};

describe("CartView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Pay buttons", () => {
    it("pays by credit card without checking out again a CheckedOut cart", async () => {
      renderCartView(createCart({ status: SPONSOR_CART_STATUS.CHECKED_OUT }));

      await clickButton("edit_sponsor.cart_tab.pay_cc");

      expect(checkoutCart).not.toHaveBeenCalled();
      expect(history.push).toHaveBeenCalledWith("cart/payment");
    });

    it("pays by invoice without checking out again a CheckedOut cart", async () => {
      renderCartView(createCart({ status: SPONSOR_CART_STATUS.CHECKED_OUT }));

      await clickButton("edit_sponsor.cart_tab.pay_invoice");

      expect(checkoutCart).not.toHaveBeenCalled();
      expect(payWithInvoice).toHaveBeenCalledTimes(1);
      expect(history.push).toHaveBeenCalledWith("cart/invoice");
    });

    it("checks out an Open cart before paying by credit card", async () => {
      renderCartView(createCart());

      await clickButton("edit_sponsor.cart_tab.pay_cc");

      expect(checkoutCart).toHaveBeenCalledTimes(1);
      expect(history.push).toHaveBeenCalledWith("cart/payment");
    });

    it("checks out an Open cart before paying by invoice", async () => {
      renderCartView(createCart());

      await clickButton("edit_sponsor.cart_tab.pay_invoice");

      expect(checkoutCart).toHaveBeenCalledTimes(1);
      expect(payWithInvoice).toHaveBeenCalledTimes(1);
    });

    it("disables only the Pay CC button when the cart total is 0", () => {
      renderCartView(createCart({ net_amount: 0 }));

      expect(
        screen.getByRole("button", { name: "edit_sponsor.cart_tab.pay_cc" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", {
          name: "edit_sponsor.cart_tab.pay_invoice"
        })
      ).toBeEnabled();
    });
  });

  describe("Cart being paid by card", () => {
    const cardPaymentCart = () =>
      createCart({
        status: SPONSOR_CART_STATUS.CHECKED_OUT,
        card_payment_purchase_id: 7
      });

    it("hides Cancel and shows the card payment note", () => {
      renderCartView(cardPaymentCart());

      expect(
        screen.queryByRole("button", { name: "general.cancel" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.card_payment_cart_note")
      ).toBeInTheDocument();
    });

    it("keeps Cancel and no note on a CheckedOut cart that is not paid by card", () => {
      renderCartView(createCart({ status: SPONSOR_CART_STATUS.CHECKED_OUT }));

      expect(
        screen.getByRole("button", { name: "general.cancel" })
      ).toBeInTheDocument();
      expect(
        screen.queryByText("edit_sponsor.cart_tab.card_payment_cart_note")
      ).not.toBeInTheDocument();
    });
  });

  describe("Editable controls", () => {
    it("hides add form, form edit/delete and the notes when the cart is not New or Open", () => {
      renderCartView(
        createCart({ status: SPONSOR_CART_STATUS.PENDING_PAYMENT })
      );

      expect(
        screen.queryByRole("button", { name: "edit_sponsor.cart_tab.add_form" })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("action-edit")).not.toBeInTheDocument();
      expect(screen.queryByTestId("action-delete")).not.toBeInTheDocument();
      expect(
        screen.queryByText("edit_sponsor.cart_tab.sponsor_note.title")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("edit_sponsor.cart_tab.order_note.title")
      ).not.toBeInTheDocument();
    });

    it("shows them on an Open cart", () => {
      renderCartView(createCart());

      expect(
        screen.getByRole("button", { name: "edit_sponsor.cart_tab.add_form" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("action-edit")).toBeInTheDocument();
      expect(screen.getByTestId("action-delete")).toBeInTheDocument();
      expect(
        screen.getByText("edit_sponsor.cart_tab.sponsor_note.title")
      ).toBeInTheDocument();
    });

    it("shows them on a New cart", () => {
      renderCartView(createCart({ status: SPONSOR_CART_STATUS.NEW }));

      expect(
        screen.getByRole("button", { name: "edit_sponsor.cart_tab.add_form" })
      ).toBeInTheDocument();
    });
  });
});
