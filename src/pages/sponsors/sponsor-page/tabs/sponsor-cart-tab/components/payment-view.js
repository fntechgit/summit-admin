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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import OrderSummary from "openstack-uicore-foundation/lib/components/mui/order-summary";
import StripePayment from "openstack-uicore-foundation/lib/components/mui/stripe-payment";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";
import history from "../../../../../../history";
import {
  confirmPayment,
  getPaymentProfile,
  updatePaymentIntent
} from "../../../../../../actions/sponsor-cart-actions";
import { getMemberByExternalId } from "../../../../../../actions/member-actions";
import ClientForm from "./client-form";
import OrderDetailsGrid from "../../../../../../components/mui/OrderDetailsGrid";

const PaymentView = ({
  cart,
  cartOwner,
  currentSummit,
  sponsor,
  paymentIntent,
  paymentProfile,
  getPaymentProfile,
  getMemberByExternalId,
  updatePaymentIntent,
  confirmPayment
}) => {
  const { errorMessage } = useSnackbarMessage();
  const [client, setClient] = useState({});

  useEffect(() => {
    if (cart) {
      getPaymentProfile();
      getMemberByExternalId(cart.owner_id);
    }
  }, [cart]);

  if (!currentSummit || !sponsor?.company || !paymentProfile || !paymentIntent || !cart) return null;

  const redirectUrl = `/app/summits/${currentSummit.id}/sponsors/${sponsor.id}/cart`;

  const handlePaymentSuccess = () =>
    confirmPayment().then(() => {
      history.push(redirectUrl);
    });

  const handlePaymentError = (error) => {
    errorMessage(error);
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Card
          sx={{ borderRadius: "10px", height: "100%" }}
          variant="outlined"
        >
          <CardContent>
            <OrderDetailsGrid
              lines={cart.forms || []}
              notes={cart?.notes || []}
              fees={cart?.fees || []}
              total={cart?.total}
              withDescription
            />
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 3, pb: 6 }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <Card sx={{ borderRadius: "10px" }} variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {T.translate("edit_sponsor.cart_tab.payment_view.billing_info")}
              </Typography>
              <ClientForm initialValues={cartOwner} onChange={setClient} />
            </CardContent>
          </Card>
          <Card
            sx={{ borderRadius: "10px", flex: 1, maxHeight: 170 }}
            variant="outlined"
          >
            <OrderSummary
              amount={paymentIntent?.total_amount}
              dueDate={paymentIntent?.due_date}
              toName={client?.full_name}
              fromName="FNTECH"
            />
          </Card>
        </Box>

        <Card
          sx={{ flex: 1, borderRadius: "10px", height: "100%" }}
          variant="outlined"
        >
          <CardContent>
            <StripePayment
              paymentIntent={paymentIntent}
              paymentProfile={paymentProfile}
              client={client}
              showBilling
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
  getMemberByExternalId,
  updatePaymentIntent,
  confirmPayment
})(PaymentView);
