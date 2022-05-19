/**
 * Copyright 2022 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import React from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import RatingTypeForm from "../../components/forms/rating-type-form";
import { getSummitById } from "../../actions/summit-actions";
import { getRatingType, resetRatingTypeForm, saveRatingType, deleteRatingType } from "../../actions/ranking-actions";
import Swal from "sweetalert2";

class EditRatingTypePage extends React.Component {
  constructor(props) {
    super(props);

    //props.getScoreTypes();

    this.handleValueSave = this.handleValueSave.bind(this);
    //this.handleValueDelete = this.handleValueDelete.bind(this);
  }

  //  handleValueDelete(valueId) {
  //      const { deleteOrderExtraQuestionValue, currentSummit, entity } = this.props;
  //      let value = entity.values.find(v => v.id === valueId);

  //      Swal.fire({
  //          title: T.translate("general.are_you_sure"),
  //          text: T.translate("edit_rating_type.remove_value_warning") + ' ' + value.value,
  //          type: "warning",
  //          showCancelButton: true,
  //          confirmButtonColor: "#DD6B55",
  //          confirmButtonText: T.translate("general.yes_delete")
  //      }).then(function (result) {
  //          if (result.value) {
  //              deleteOrderExtraQuestionValue(entity.id, valueId);
  //          }
  //      });
  //  }

  handleValueSave(valueEntity) {
    const { entity } = this.props;
    this.props.saveRatingType(entity.id, valueEntity);
  }

  render() {
    const { currentSummit, entity, errors } = this.props;
    const title = entity.id ? T.translate("general.edit") : T.translate("general.add");

    return (
      <div className="container">
        <h3>
          {title} {T.translate("edit_rating_type.rating_type")}
        </h3>
        <hr />
        {currentSummit && (
          <RatingTypeForm
            entity={entity}
            errors={errors}
            onValueDelete={this.handleValueDelete}
            onValueSave={this.handleValueSave}
            onSubmit={this.props.saveRatingType}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, ratingTypeState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...ratingTypeState,
});

export default connect(mapStateToProps, {
  getSummitById,
  getRatingType,
  resetRatingTypeForm,
  saveRatingType,
})(EditRatingTypePage);
