/**
 * Copyright 2019 OpenStack Foundation
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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { getSummitById } from "../../actions/summit-actions";
import {
  savePurchaseOrder,
  addTicketsToOrder,
  deletePurchaseOrder,
  reSendOrderEmail
} from "../../actions/order-actions";
import PurchaseOrderForm from "../../components/forms/purchase-order-form";

import "../../styles/edit-purchase-order-page.less";

class EditPurchaseOrderPage extends React.Component {
  constructor(props) {
    super(props);
    this.handleDeleteOrder = this.handleDeleteOrder.bind(this);
    this.handleResendEmail = this.handleResendEmail.bind(this);
  }

  handleResendEmail(order) {
    this.props.reSendOrderEmail(order.id);
  }

  handleDeleteOrder(order) {
    const { deletePurchaseOrder } = this.props;
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_purchase_order.remove_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deletePurchaseOrder(order.id);
      }
    });
  }

  render() {
    const { currentSummit, entity, errors } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");

    return (
      <div className="container">
        <h3>
          {title} {T.translate("edit_purchase_order.purchase_order")}
          {entity.id !== 0 && (
            <div className="pull-right form-inline">
              <button
                className="btn btn-sm btn-danger"
                onClick={this.handleDeleteOrder.bind(this, entity)}
              >
                {T.translate("edit_purchase_order.delete_order")}
              </button>
              {entity.status === "Paid" && (
                <button
                  className="btn btn-sm btn-primary left-space"
                  onClick={this.handleResendEmail.bind(this, entity)}
                >
                  {T.translate("edit_purchase_order.resend_order_email")}
                </button>
              )}
              <a href="new" className="btn btn-default pull-right">
                Add new
              </a>
            </div>
          )}
        </h3>
        <hr />

        <PurchaseOrderForm
          history={this.props.history}
          currentSummit={currentSummit}
          entity={entity}
          errors={errors}
          onSubmit={this.props.savePurchaseOrder}
          addTickets={this.props.addTicketsToOrder}
        />
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentPurchaseOrderState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPurchaseOrderState
});

export default connect(mapStateToProps, {
  getSummitById,
  savePurchaseOrder,
  addTicketsToOrder,
  deletePurchaseOrder,
  reSendOrderEmail
})(EditPurchaseOrderPage);
