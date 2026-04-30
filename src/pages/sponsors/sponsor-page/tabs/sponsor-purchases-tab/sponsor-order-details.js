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
import { Box, Card, CardContent, Grid2, Typography } from "@mui/material";
import { ListCard } from "openstack-uicore-foundation/lib/components/mui/cards";
import OrderDetailsGrid from "../../../../../components/mui/OrderDetailsGrid";
import {
  getSponsorOrder,
  undoCancelSponsorForm,
  updateClientAddress,
  updateClientInfo,
  cancelSponsorForm,
  refundSponsorOrder
} from "../../../../../actions/sponsor-purchases-actions";
import { ACCESS_ROUTES, DATE_FORMAT } from "../../../../../utils/constants";
import Restrict from "../../../../../routes/restrict";
import { formatDate } from "../../../../../utils/methods";
import RefundForm from "../../../../../components/mui/RefundForm";
import ClientCard from "../../../../../components/mui/ClientCard";

const SponsorOrderDetails = ({
  match,
  currentOrder,
  currentSummit,
  currentSponsor,
  getSponsorOrder,
  updateClientInfo,
  updateClientAddress,
  cancelSponsorForm,
  undoCancelSponsorForm,
  refundSponsorOrder
}) => {
  const orderId = match.params.order_id;

  useEffect(() => {
    getSponsorOrder(orderId);
  }, []);

  if (!currentOrder) return null;

  const { client, address } = currentOrder;

  const dashInfoRows = [
    {
      label: T.translate(
        "edit_sponsor.purchase_tab.order_details.purchase_date"
      ),
      value: formatDate(currentOrder.created, "LOC", DATE_FORMAT)
    },
    {
      label: T.translate(
        "edit_sponsor.purchase_tab.order_details.purchased_by"
      ),
      value: `${currentOrder.purchased_by_full_name} - ${currentOrder.purchased_by_email}`
    },
    {
      label: T.translate("edit_sponsor.purchase_tab.order_details.show"),
      value: currentSummit.name
    },
    {
      label: T.translate("edit_sponsor.purchase_tab.order_details.sponsor"),
      value: currentSponsor.company_name
    },
    {
      label: T.translate("edit_sponsor.purchase_tab.order_details.tier"),
      value: currentSponsor.sponsorships.map((s) => s.type_name).join(", ")
    }
  ];

  const paymentInfoRows = [
    {
      label: T.translate("edit_sponsor.purchase_tab.order_details.order"),
      value: currentOrder.number
    },
    {
      label: T.translate(
        "edit_sponsor.purchase_tab.order_details.payment_type"
      ),
      value: currentOrder.payment_method
    },
    {
      label: T.translate(
        "edit_sponsor.purchase_tab.order_details.payment_status"
      ),
      value: currentOrder.status
    },
    {
      label: T.translate(
        "edit_sponsor.purchase_tab.order_details.payment_date"
      ),
      value: formatDate(currentOrder.created, "LOC", DATE_FORMAT)
    }
  ];

  const handleClientSave = (values) => {
    updateClientInfo(currentOrder.id, values);
  };

  const handleAddressSave = (values) => {
    updateClientAddress(currentOrder.id, values);
  };

  const handleCancelForm = (item) => {
    cancelSponsorForm(currentOrder.id, item.id);
  };

  const handleUndoCancelForm = (item) => {
    undoCancelSponsorForm(currentOrder.id, item.id);
  };

  const handleOrderRefund = (values) => {
    refundSponsorOrder(currentOrder.id, values.amount, values.reason);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, mt: 4 }}>
        {T.translate("edit_sponsor.purchase_tab.order_details.order")}{" "}
        {currentOrder.number}
      </Typography>
      <Grid2 container spacing={2} size={12} sx={{ mb: 4 }}>
        <Grid2 size={6}>
          <ListCard
            title={T.translate(
              "edit_sponsor.purchase_tab.order_details.general_info"
            )}
            rows={dashInfoRows}
          />
        </Grid2>
        <Grid2 size={6}>
          <ListCard
            title={T.translate(
              "edit_sponsor.purchase_tab.order_details.payment_info"
            )}
            rows={paymentInfoRows}
          />
        </Grid2>
        <Grid2 size={12}>
          <ClientCard
            client={client}
            address={address}
            onAddressSubmit={handleAddressSave}
            onClientSubmit={handleClientSave}
          />
        </Grid2>
        <Grid2 size={12}>
          <Card
            sx={{ minWidth: 275, borderRadius: "10px", height: "100%" }}
            variant="outlined"
          >
            <CardContent>
              <OrderDetailsGrid
                lines={currentOrder?.forms || []}
                notes={currentOrder?.notes || []}
                payments={currentOrder?.payments || []}
                refunds={currentOrder?.refunds || []}
                fees={currentOrder?.fees || []}
                amountDue={currentOrder?.amount_due}
                withDescription
                onCancelForm={handleCancelForm}
                onUndoCancelForm={handleUndoCancelForm}
              />
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 size={12}>
          <Card
            sx={{ minWidth: 275, borderRadius: "10px", height: "100%" }}
            variant="outlined"
          >
            <CardContent>
              <Typography gutterBottom variant="h6">
                {T.translate(
                  "edit_sponsor.purchase_tab.order_details.issue_refund"
                )}
              </Typography>
              <RefundForm onSubmit={handleOrderRefund} />
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
};

const mapStateToProps = ({
  sponsorPagePurchaseListState,
  currentSummitState,
  currentSponsorState
}) => ({
  currentOrder: sponsorPagePurchaseListState.currentOrder,
  currentSummit: currentSummitState.currentSummit,
  currentSponsor: currentSponsorState.entity
});

export default Restrict(
  connect(mapStateToProps, {
    getSponsorOrder,
    updateClientInfo,
    updateClientAddress,
    cancelSponsorForm,
    undoCancelSponsorForm,
    refundSponsorOrder
  })(SponsorOrderDetails),
  ACCESS_ROUTES.ADMIN_SPONSORS
);
