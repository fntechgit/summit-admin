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
import ImageForm from "../../components/forms/image-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getLocationMap,
  resetLocationMapForm,
  saveLocationMap
} from "../../actions/location-actions";
import AddNewButton from "../../components/buttons/add-new-button";

class EditLocationMapPage extends React.Component {
  constructor(props) {
    const { currentLocation, match } = props;
    const mapId = match.params.map_id;
    super(props);

    if (!mapId || !currentLocation) {
      props.resetLocationMapForm();
    } else {
      props.getLocationMap(currentLocation.id, mapId);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.map_id;
    const newId = this.props.match.params.map_id;
    const { currentLocation } = this.props;

    if (oldId !== newId && currentLocation) {
      this.props.getLocationMap(currentLocation.id, newId);
    }
  }

  render() {
    const { currentSummit, currentLocation, entity, errors, match } =
      this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.name : T.translate("general.new");

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_location.map")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <ImageForm
            history={this.props.history}
            currentSummit={currentSummit}
            locationId={currentLocation.id}
            entity={entity}
            valueField="image_url"
            errors={errors}
            onSubmit={this.props.saveLocationMap}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentLocationState,
  currentLocationMapState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  currentLocation: currentLocationState.entity,
  ...currentLocationMapState
});

export default connect(mapStateToProps, {
  getSummitById,
  getLocationMap,
  resetLocationMapForm,
  saveLocationMap
})(EditLocationMapPage);
