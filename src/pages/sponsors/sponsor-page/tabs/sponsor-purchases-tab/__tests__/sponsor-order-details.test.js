import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import SponsorOrderDetails from "../sponsor-order-details";
import { refundSponsorOrder } from "../../../../../../actions/sponsor-purchases-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../../../routes/restrict", () => ({
  __esModule: true,
  default: (Component) => Component
}));

jest.mock("../../../../../../actions/sponsor-purchases-actions", () => ({
  __esModule: true,
  getSponsorOrder: jest.fn(() => () => {}),
  clearSponsorOrder: jest.fn(() => () => {}),
  refundSponsorOrder: jest.fn(() => () => Promise.resolve()),
  cancelSponsorForm: jest.fn(() => () => {}),
  undoCancelSponsorForm: jest.fn(() => () => {}),
  updateClientAddress: jest.fn(() => () => {}),
  updateClientInfo: jest.fn(() => () => {})
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/cards", () => ({
  __esModule: true,
  ListCard: () => null
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/sponsor-order-grid",
  () => ({ __esModule: true, default: () => null })
);

jest.mock("../../../../../../components/mui/ClientCard", () => ({
  __esModule: true,
  default: () => null
}));

const renderPage = (type) => {
  const order = {
    id: 135,
    number: "ORD-135",
    type,
    payment_method: type,
    status: "Paid",
    created: 1700000000,
    purchased_by_full_name: "Jane Doe",
    purchased_by_email: "jane@example.com",
    client: {},
    address: {}
  };

  return renderWithRedux(
    <SponsorOrderDetails match={{ params: { order_id: "135" } }} />,
    {
      initialState: {
        sponsorPagePurchaseListState: { currentOrder: order },
        currentSummitState: { currentSummit: { id: 73, name: "Summit" } },
        currentSponsorState: {
          entity: { id: 680, company: { name: "Acme" }, sponsorships: [] }
        }
      }
    }
  );
};

describe("SponsorOrderDetails refund form", () => {
  beforeEach(() => {
    refundSponsorOrder.mockClear();
  });

  it.each(["Offline", "Online"])(
    "renders an enabled refund form for %s orders",
    (type) => {
      renderPage(type);

      expect(
        screen.getByRole("button", { name: /refund_form\.queue_refund/i })
      ).toBeEnabled();
      expect(
        screen.queryByText("refund_form.only_online_payments")
      ).not.toBeInTheDocument();
    }
  );

  it("submits a refund for an offline order with the amount in cents", async () => {
    renderPage("Offline");

    await act(async () => {
      await userEvent.type(
        screen.getByLabelText(/refund_form\.reason/i),
        "Duplicate invoice"
      );
      await userEvent.type(screen.getByLabelText(/refund_form\.amount/i), "10");
      await userEvent.click(
        screen.getByRole("button", { name: /refund_form\.queue_refund/i })
      );
    });

    expect(refundSponsorOrder).toHaveBeenCalledWith(
      135,
      1000,
      "Duplicate invoice"
    );
  });
});
