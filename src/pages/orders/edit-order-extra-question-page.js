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
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import ExtraQuestionForm from "../../components/forms/extra-question-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getOrderExtraQuestionMeta,
  getOrderExtraQuestion,
  resetOrderExtraQuestionForm,
  saveOrderExtraQuestion,
  deleteOrderExtraQuestionValue,
  saveOrderExtraQuestionValue,
  deleteOrderExtraQuestionsSubQuestionsRule,
  updateOrderExtraQuestionsSubQuestionsRuleOrder,
  updateOrderExtraQuestionValueOrder
} from "../../actions/order-actions";
import { getBadgeFeatures } from "../../actions/badge-actions";
import AddNewButton from "../../components/buttons/add-new-button";

class EditOrderExtraQuestionPage extends React.Component {
  constructor(props) {
    super(props);

    props.getOrderExtraQuestionMeta();
    props.getBadgeFeatures();

    this.handleValueSave = this.handleValueSave.bind(this);
    this.handleValueDelete = this.handleValueDelete.bind(this);
    this.handleRuleDelete = this.handleRuleDelete.bind(this);
  }

  handleValueDelete(valueId) {
    const { deleteOrderExtraQuestionValue, entity } = this.props;
    const value = entity.values.find((v) => v.id === valueId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_order_extra_question.remove_value_warning")} ${
        value.value
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteOrderExtraQuestionValue(entity.id, valueId);
      }
    });
  }

  handleRuleDelete(valueId) {
    const { deleteOrderExtraQuestionsSubQuestionsRule, entity } = this.props;
    const value = entity.sub_question_rules.find((v) => v.id === valueId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_order_extra_question.remove_value_warning")} ${
        value.value
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteOrderExtraQuestionsSubQuestionsRule(entity.id, valueId);
      }
    });
  }

  handleValueSave(valueEntity) {
    const { entity } = this.props;
    this.props.saveOrderExtraQuestionValue(entity.id, valueEntity);
  }

  render() {
    const {
      currentSummit,
      entity,
      errors,
      allClasses,
      updateOrderExtraQuestionsSubQuestionsRuleOrder,
      updateOrderExtraQuestionValueOrder
    } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");

    return (
      <div className="container">
        <h3>
          {title}{" "}
          {T.translate("edit_order_extra_question.order_extra_question")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <ExtraQuestionForm
            currentSummit={currentSummit}
            questionClasses={allClasses}
            entity={entity}
            errors={errors}
            shouldAllowSubRules
            shouldShowUsage
            shouldShowPrintable
            onValueDelete={this.handleValueDelete}
            onValueSave={this.handleValueSave}
            onRuleDelete={this.handleRuleDelete}
            onSubmit={this.props.saveOrderExtraQuestion}
            updateSubQuestionRuleOrder={
              updateOrderExtraQuestionsSubQuestionsRuleOrder
            }
            updateQuestionValueOrder={updateOrderExtraQuestionValueOrder}
            shouldShowEditable={false}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentOrderExtraQuestionState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentOrderExtraQuestionState
});

export default connect(mapStateToProps, {
  getSummitById,
  getOrderExtraQuestion,
  getOrderExtraQuestionMeta,
  resetOrderExtraQuestionForm,
  deleteOrderExtraQuestionValue,
  saveOrderExtraQuestionValue,
  saveOrderExtraQuestion,
  deleteOrderExtraQuestionsSubQuestionsRule,
  updateOrderExtraQuestionsSubQuestionsRuleOrder,
  getBadgeFeatures,
  updateOrderExtraQuestionValueOrder
})(EditOrderExtraQuestionPage);
