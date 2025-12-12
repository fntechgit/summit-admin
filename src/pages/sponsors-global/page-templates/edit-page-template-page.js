/**
 * Copyright 2024 OpenStack Foundation
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
import FormTemplateForm from "../../../components/forms/form-template-form";
import {
  getFormTemplate,
  resetFormTemplateForm,
  saveFormTemplate,
  deleteFormTemplateMetaFieldType,
  deleteFormTemplateMetaFieldTypeValue,
  deleteFormTemplateMaterial
} from "../../../actions/form-template-actions";

const EditPageTemplatePage = (props) => {
  const {
    match,
    entity,
    errors,
    getFormTemplate,
    resetFormTemplateForm,
    saveFormTemplate,
    deleteFormTemplateMetaFieldType,
    deleteFormTemplateMetaFieldTypeValue,
    deleteFormTemplateMaterial
  } = props;
  const formTemplateId = match.params.form_template_id;

  useEffect(() => {
    if (!formTemplateId) {
      resetFormTemplateForm();
    } else {
      getFormTemplate(formTemplateId);
    }
  }, [formTemplateId, getFormTemplate, resetFormTemplateForm]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_form_template.form_template")}
      </h3>
      <hr />
      <FormTemplateForm
        entity={entity}
        errors={errors}
        onMetaFieldTypeDeleted={deleteFormTemplateMetaFieldType}
        onMetaFieldTypeValueDeleted={deleteFormTemplateMetaFieldTypeValue}
        onMaterialDeleted={deleteFormTemplateMaterial}
        onSubmit={saveFormTemplate}
      />
    </div>
  );
};

const mapStateToProps = ({ currentFormTemplateState }) => ({
  ...currentFormTemplateState
});

export default connect(mapStateToProps, {
  getFormTemplate,
  resetFormTemplateForm,
  saveFormTemplate,
  deleteFormTemplateMetaFieldType,
  deleteFormTemplateMetaFieldTypeValue,
  deleteFormTemplateMaterial
})(EditPageTemplatePage);
