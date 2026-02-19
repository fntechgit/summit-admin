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
import {connect} from "react-redux";
import {
  updateCartForm,
  getCartForm
} from "../../../../../actions/sponsor-cart-actions";
import EditForm from "./edit-form";

const EditCartForm = ({
  form,
  getCartForm,
  updateCartForm
}) => {

  const getForm = () => getCartForm(form.id);

  const saveForm = (values) => updateCartForm(form_id, values);

  return (
    <EditForm getForm={getForm} saveForm={saveForm} />
  );
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  getCartForm,
  updateCartForm
})(EditCartForm);
