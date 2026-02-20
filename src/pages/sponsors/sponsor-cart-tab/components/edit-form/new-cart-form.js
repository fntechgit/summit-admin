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
import {
  addCartForm,
  getSponsorForm
} from "../../../../../actions/sponsor-cart-actions";
import EditForm from "./index";

const NewCartForm = ({
  formId,
  addOn,
  sponsorForm,
  onCancel,
  getSponsorForm,
  addCartForm
}) => {
  useEffect(() => {
    getSponsorForm(formId);
  }, []);

  const saveForm = (values) => addCartForm(formId, addOn?.addon_id, values);

  if (!sponsorForm) return null;

  return (
    <EditForm
      form={{ ...sponsorForm, ...addOn }}
      saveForm={saveForm}
      onCancel={onCancel}
    />
  );
};

const mapStateToProps = ({ sponsorPageCartListState }) => ({
  sponsorForm: sponsorPageCartListState.sponsorForm
});

export default connect(mapStateToProps, {
  getSponsorForm,
  addCartForm
})(NewCartForm);
