/**
 * Copyright 2018 OpenStack Foundation
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
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import PaymentFeeTypeForm from "../../components/forms/payment-fee-type-form";
import {
  getPaymentFeeType,
  resetPaymentFeeTypeForm,
  savePaymentFeeType
} from "../../actions/ticket-actions";
import AddNewButton from "../../components/buttons/add-new-button";

const EditPaymentFeeType = ({
  currentSummit,
  entity,
  errors,
  match,
  getPaymentFeeType,
  resetPaymentFeeTypeForm,
  savePaymentFeeType
}) => {
  useEffect(() => {
    const { params } = match;
    if (params.payment_fee_type_id) {
      getPaymentFeeType(params.payment_fee_type_id);
    } else {
      resetPaymentFeeTypeForm();
    }
  }, [match.params.payment_fee_type_id]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_payment_fee_type.payment_fee_type")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <PaymentFeeTypeForm
          entity={entity}
          errors={errors}
          currentSummit={currentSummit}
          onSubmit={savePaymentFeeType}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentPaymentFeeTypeState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPaymentFeeTypeState
});

export default connect(mapStateToProps, {
  getPaymentFeeType,
  resetPaymentFeeTypeForm,
  savePaymentFeeType
})(EditPaymentFeeType);
