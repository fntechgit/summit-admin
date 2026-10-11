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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import {
  getSponsorExtraQuestion,
  saveSponsorExtraQuestion,
  resetSponsorExtraQuestionForm,
  getExtraQuestionMeta,
  deleteSponsorExtraQuestionValue,
  getSponsorExtraQuestionValueUsage,
  saveSponsorExtraQuestionValue,
  updateSponsorExtraQuestionValueOrder
} from "../../actions/sponsor-actions";
import ExtraQuestionForm from "../../components/forms/extra-question-form";
import AddNewButton from "../../components/buttons/add-new-button";
import Member from "../../models/member";
import DeleteExtraQuestionPopup from "./sponsor-page/tabs/sponsor-general-form/delete-extra-question-popup";

function EditSponsorExtraQuestionPage({
  currentSummit,
  entity,
  errors,
  match,
  allClasses,
  member,
  ...props
}) {
  const [valueToDelete, setValueToDelete] = useState(null);
  const extraQuestionId = match.params.extra_question_id;
  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");
  // sponsors can't delete saved options, same as questions: the trash is only for admins
  const canDeleteValues = new Member(member).hasAccess(
    "sponsors-extra-questions-delete"
  );

  useEffect(() => {
    props.getExtraQuestionMeta();
  }, []);

  useEffect(() => {
    if (!extraQuestionId) {
      props.resetSponsorExtraQuestionForm();
    } else {
      props.getSponsorExtraQuestion(extraQuestionId);
    }
  }, [extraQuestionId]);

  const handleValueDelete = (valueId) => {
    setValueToDelete(entity.values.find((v) => v.id === valueId) || null);
  };

  const handleValueSave = (valueEntity) => {
    props.saveSponsorExtraQuestionValue(entity.id, valueEntity);
  };

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_sponsor.extra_question")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <ExtraQuestionForm
          currentSummit={currentSummit}
          shouldAllowSubRules={false}
          shouldShowUsage={false}
          shouldShowPrintable={false}
          shouldShowEditable={false}
          questionClasses={allClasses}
          entity={entity}
          errors={errors}
          onValueDelete={canDeleteValues ? handleValueDelete : undefined}
          onValueSave={handleValueSave}
          onSubmit={props.saveSponsorExtraQuestion}
          updateQuestionValueOrder={props.updateSponsorExtraQuestionValueOrder}
          shouldHideMandatory
          shouldHideAllowedTicketTypes
          shouldHideAllowedFeatures
        />
      )}
      {valueToDelete && (
        <DeleteExtraQuestionPopup
          extraQuestion={entity}
          extraQuestionValue={valueToDelete}
          getUsage={(valueId) =>
            props.getSponsorExtraQuestionValueUsage(entity.id, valueId)
          }
          onConfirm={(valueId, options) =>
            props.deleteSponsorExtraQuestionValue(entity.id, valueId, options)
          }
          onClose={() => setValueToDelete(null)}
        />
      )}
    </div>
  );
}

const mapStateToProps = ({
  currentSummitState,
  currentSponsorExtraQuestionState,
  loggedUserState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSponsorExtraQuestionState,
  member: loggedUserState.member
});

export default connect(mapStateToProps, {
  getExtraQuestionMeta,
  resetSponsorExtraQuestionForm,
  getSponsorExtraQuestion,
  saveSponsorExtraQuestion,
  deleteSponsorExtraQuestionValue,
  getSponsorExtraQuestionValueUsage,
  saveSponsorExtraQuestionValue,
  updateSponsorExtraQuestionValueOrder
})(EditSponsorExtraQuestionPage);
