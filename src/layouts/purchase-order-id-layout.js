/**
 * Copyright 2017 OpenStack Foundation
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
import { Switch, Route } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Restrict from "../routes/restrict";
import EditPurchaseOrderPage from "../pages/orders/edit-purchase-order-page";
import NoMatchPage from "../pages/no-match-page";
import EditTicketPage from "../pages/orders/edit-ticket-page";

import {
  resetPurchaseOrderForm,
  getPurchaseOrder,
  getPurchaseOrderRefunds
} from "../actions/order-actions";

const PurchaseOrderIdLayout = ({ currentPurchaseOrder, match, ...props }) => {
  const orderId = match.params.purchase_order_id;
  const [loading, setLoading] = useState(!!orderId);
  const last20chars = -20;
  const breadcrumb = currentPurchaseOrder.id
    ? `...${currentPurchaseOrder.number.slice(last20chars)}`
    : T.translate("general.new");

  useEffect(() => {
    if (!orderId) {
      props.resetPurchaseOrderForm();
    } else {
      props
        .getPurchaseOrder(orderId)
        .then(() =>
          props.getPurchaseOrderRefunds(orderId).then(() => setLoading(false))
        );
    }
  }, [orderId]);

  if ((orderId && !currentPurchaseOrder.id) || loading) return null;

  return (
    <div>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Switch>
        <Route
          strict
          exact
          path={`${match.url}/tickets/:ticket_id(\\d+)`}
          render={(props) => (
            <div>
              <Breadcrumb
                data={{
                  title: T.translate("purchase_order_list.tickets"),
                  pathname: match.url
                }}
              />
              <EditTicketPage {...props} />
            </div>
          )}
        />
        <Route
          strict
          exact
          path={match.url}
          component={EditPurchaseOrderPage}
        />
        <Route component={NoMatchPage} />
      </Switch>
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentPurchaseOrderState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  currentPurchaseOrder: currentPurchaseOrderState.entity
});

export default Restrict(
  connect(mapStateToProps, {
    getPurchaseOrder,
    resetPurchaseOrderForm,
    getPurchaseOrderRefunds
  })(PurchaseOrderIdLayout),
  "orders"
);
