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
import { SimpleForm } from "openstack-uicore-foundation/lib/components";
import { getSummitById } from "../../actions/summit-actions";
import {
  getAccessLevel,
  resetAccessLevelForm,
  saveAccessLevel
} from "../../actions/badge-actions";
import AddNewButton from "../../components/buttons/add-new-button";

class EditAccessLevelPage extends React.Component {
  constructor(props) {
    const accessLevelId = props.match.params.access_level_id;
    super(props);

    if (!accessLevelId) {
      props.resetAccessLevelForm();
    } else {
      props.getAccessLevel(accessLevelId);
    }

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.access_level_id;
    const newId = this.props.match.params.access_level_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetAccessLevelForm();
      } else {
        this.props.getAccessLevel(newId);
      }
    }
  }

  handleSubmit(entity) {
    this.props.saveAccessLevel(entity);
  }

  render() {
    const { currentSummit, entity, errors, match, history } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.name : T.translate("general.new");

    const fields = [
      {
        type: "text",
        name: "name",
        label: T.translate("edit_access_level.name")
      },
      /* {type: 'text', name: 'tag_name', label: T.translate("edit_access_level.tag_name")}, */
      {
        type: "textarea",
        name: "description",
        label: T.translate("edit_access_level.description")
      },
      {
        type: "textarea",
        name: "template_content",
        label: T.translate("edit_access_level.template_content")
      },
      {
        type: "checkbox",
        name: "is_default",
        label: T.translate("edit_access_level.default")
      }
    ];

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_access_level.access_level")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <SimpleForm
            entity={entity}
            errors={errors}
            fields={fields}
            onSubmit={this.handleSubmit}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, currentAccessLevelState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentAccessLevelState
});

export default connect(mapStateToProps, {
  getSummitById,
  getAccessLevel,
  resetAccessLevelForm,
  saveAccessLevel
})(EditAccessLevelPage);
