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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Card, CardContent } from "@mui/material";
import {
  MuiTable,
  MuiNotesRow,
  MuiOrderSummary,
  MuiStripePayment,
  MuiTotalRow
} from "openstack-uicore-foundation/lib/components";
import history from "../../../../../../history";
import {
  confirmPayment,
  getPaymentProfile,
  updatePaymentIntent
} from "../../../../../../actions/sponsor-cart-actions";
import { mapCartData } from "../helpers";
import { useSnackbarMessage } from "../../../../../../components/mui/SnackbarNotification/Context";

const PaymentView = ({
  cart,
  currentSummit,
  sponsor,
  paymentIntent,
  paymentProfile,
  getPaymentProfile,
  updatePaymentIntent,
  confirmPayment
}) => {
  const { errorMessage } = useSnackbarMessage();

  useEffect(() => {
    if (cart) {
      getPaymentProfile(cart.id);
    }
  }, [cart]);

  if (!currentSummit || !sponsor?.company || !cart) return null;

  const redirectUrl = `/app/summits/${currentSummit.id}/sponsors/${sponsor.id}/cart`;

  const cartData = mapCartData(cart, true);

  const cartColumns = [
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.cart_tab.payment_view.code")
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.cart_tab.payment_view.contents")
    },
    { columnKey: "item_name", header: "" },
    {
      columnKey: "addon_name",
      header: T.translate("edit_sponsor.cart_tab.payment_view.addon")
    },
    {
      columnKey: "discount",
      header: T.translate("edit_sponsor.cart_tab.payment_view.discount")
    },
    {
      columnKey: "amount",
      header: T.translate("edit_sponsor.cart_tab.payment_view.amount")
    }
  ];

  const handlePaymentSuccess = (paymentData) =>
    confirmPayment(paymentData.id).then(() => {
      history.push(redirectUrl);
    });

  const handlePaymentError = (error) => {
    errorMessage(error);
  };

  return (
    <>
      <MuiTable data={cartData} columns={cartColumns}>
        {cart?.notes?.map((note) => (
          <MuiNotesRow
            key={`note-${note.id}`}
            note={note.content}
            colCount={cartColumns.length}
          />
        ))}
        <MuiTotalRow
          columns={cartColumns}
          total={cart?.total}
          targetCol="amount"
        />
      </MuiTable>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 4,
          gap: "10px"
        }}
      />

      <Box
        sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 3, pb: 6 }}
      >
        <Card
          sx={{ flex: 1, borderRadius: "10px", height: "100%" }}
          variant="outlined"
        >
          <MuiOrderSummary
            amount={paymentIntent?.total_amount}
            // dueDate="2023-05-24"
            toName={sponsor.company.name}
            fromName="FNTECH"
          />
        </Card>
        <Card
          sx={{ flex: 1, borderRadius: "10px", height: "100%" }}
          variant="outlined"
        >
          <CardContent>
            <MuiStripePayment
              paymentIntent={paymentIntent}
              paymentProfile={paymentProfile}
              client={{}}
              redirectUrl={redirectUrl}
              stripeFormTitle={false}
              updatePaymentIntent={updatePaymentIntent}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSponsorState,
  sponsorPageCartListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  sponsor: currentSponsorState.entity,
  ...sponsorPageCartListState
});

export default connect(mapStateToProps, {
  getPaymentProfile,
  updatePaymentIntent,
  confirmPayment
})(PaymentView);
