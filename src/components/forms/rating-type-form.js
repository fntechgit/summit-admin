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
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import {
  Input,
  SortableTable
} from "openstack-uicore-foundation/lib/components";
import {
  isEmpty,
  scrollToError,
  shallowEqual,
  hasErrors
} from "../../utils/methods";

class RatingTypeForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      errors: props.errors
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const state = {};
    scrollToError(this.props.errors);

    if (!shallowEqual(prevProps.entity, this.props.entity)) {
      state.entity = { ...this.props.entity };
      state.errors = {};
    }

    if (!shallowEqual(prevProps.errors, this.props.errors)) {
      state.errors = { ...this.props.errors };
    }

    if (!isEmpty(state)) {
      this.setState({ ...this.state, ...state });
    }
  }

  handleChange(ev) {
    const entity = { ...this.state.entity };
    const errors = { ...this.state.errors };
    let { value, id } = ev.target;

    errors[id] = "";
    entity[id] = value;
    this.setState({ entity: entity, errors: errors });
  }

  handleSubmit(ev) {
    ev.preventDefault();
    this.props.onSubmit(this.state.entity);
  }

  render() {
    const { entity, errors } = this.state;
    const scoreTypesColumns = [
      { columnKey: "score", value: T.translate("score_type_list.score") },
      { columnKey: "name", value: T.translate("score_type_list.name") },
      {
        columnKey: "description",
        value: T.translate("score_type_list.description")
      }
    ];

    const scoreTypesOptions = {
      title: T.translate("edit_rating_type.score_types"),
      valueKey: "score",
      labelKey: "score",
      defaultOptions: true,
      actions: {
        edit: { onClick: this.props.onEditScoreType },
        delete: { onClick: this.props.onDeleteScoreType }
      }
    };

    return (
      <form className="badge-type-form">
        <input type="hidden" id="id" value={entity.id} />
        <input type="hidden" id="order" value={entity.order} />
        <div className="row form-group">
          <div className="col-md-4">
            <label> {T.translate("edit_rating_type.name")} *</label>
            <Input
              id="name"
              className="form-control"
              error={hasErrors("name", errors)}
              onChange={this.handleChange}
              value={entity.name}
            />
          </div>
          <div className="col-md-4">
            <label> {T.translate("edit_rating_type.weight")} *</label>
            <Input
              id="weight"
              type="number"
              className="form-control"
              error={hasErrors("weight", errors)}
              onChange={this.handleChange}
              value={entity.weight}
            />
          </div>
        </div>

        {entity.id !== 0 && (
          <>
            <hr />
            <div className={"row"}>
              <div className="col-md-6">
                <h3>{T.translate("edit_rating_type.score_types")}</h3>
              </div>
            </div>
            <div className={"row"}>
              <div className="col-md-6 text-right col-md-offset-6">
                <input
                  type="button"
                  onClick={this.props.onAddScoreType}
                  className="btn btn-primary pull-right"
                  value={T.translate("edit_rating_type.add_score_type")}
                />
              </div>
            </div>
            <SortableTable
              options={scoreTypesOptions}
              data={entity.score_types}
              columns={scoreTypesColumns}
              dropCallback={this.props.onUpdateScoreTypeOrder}
              orderField="score"
            />
          </>
        )}

        <hr />

        <div className="row">
          <div className="col-md-12 submit-buttons">
            <input
              type="button"
              onClick={this.handleSubmit}
              className="btn btn-primary pull-right"
              value={T.translate("general.save")}
            />
          </div>
        </div>
      </form>
    );
  }
}

export default RatingTypeForm;
