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
import {
  getSponsorCartForm,
  updateCartForm
} from "../../../../../../../actions/sponsor-cart-actions";
import history from "../../../../../../../history";
import EditForm from "./index";

const EditCartForm = ({
  match,
  cartForm,
  getSponsorCartForm,
  updateCartForm
}) => {
  const formId = match.params.form_id;

  useEffect(() => {
    if (formId) getSponsorCartForm(formId);
  }, [formId]);

  const backToCart = () => {
    const backUrl = match.url.replace(/\/forms\/[^/]+$/, "");
    history.push(backUrl);
  };

  const saveForm = (values) => {
    updateCartForm(formId, values).then(() => {
      backToCart();
    });
  };

  if (!cartForm) return null;

  return (
    <EditForm form={cartForm} onSaveForm={saveForm} onCancel={backToCart} />
  );
};

const mapStateToProps = ({ sponsorPageCartListState }) => ({
  cartForm: sponsorPageCartListState.cartForm
});

export default connect(mapStateToProps, {
  getSponsorCartForm,
  updateCartForm
})(EditCartForm);
