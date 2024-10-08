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

import React from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import PaymentProfile from "../../components/forms/payment-profile-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getPaymentProfile,
  resetPaymentProfileForm,
  savePaymentProfile
} from "../../actions/ticket-actions";
import AddNewButton from "../../components/buttons/add-new-button";

class EditPaymentProfilePage extends React.Component {
  constructor(props) {
    const paymentProfileId = props.match.params.payment_profile_id;
    super(props);

    if (!paymentProfileId) {
      props.resetPaymentProfileForm();
    } else {
      props.getPaymentProfile(paymentProfileId);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.payment_profile_id;
    const newId = this.props.match.params.payment_profile_id;

    if (newId !== oldId) {
      if (!newId) {
        this.props.resetPaymentProfileForm();
      } else {
        this.props.getPaymentProfile(newId);
      }
    }
  }

  render() {
    const { currentSummit, entity, errors, match } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.name : T.translate("general.new");

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_payment_profile.payment_profile")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <PaymentProfile
            entity={entity}
            errors={errors}
            currentSummit={currentSummit}
            onSubmit={this.props.savePaymentProfile}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentPaymentProfileState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPaymentProfileState
});

export default connect(mapStateToProps, {
  getSummitById,
  getPaymentProfile,
  resetPaymentProfileForm,
  savePaymentProfile
})(EditPaymentProfilePage);
