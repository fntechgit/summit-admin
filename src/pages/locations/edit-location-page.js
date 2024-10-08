/**
 * Copyright 2017 OpenStack Foundation
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
import LocationForm from "../../components/forms/location-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getLocation,
  resetLocationForm,
  saveLocation,
  updateLocationMap,
  updateAddress,
  deleteFloor,
  deleteRoom,
  deleteLocationImage,
  deleteLocationMap
} from "../../actions/location-actions";

import "../../styles/edit-location-page.less";
import AddNewButton from "../../components/buttons/add-new-button";

class EditLocationPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleFloorDelete = this.handleFloorDelete.bind(this);
    this.handleRoomDelete = this.handleRoomDelete.bind(this);
    this.handleImageDelete = this.handleImageDelete.bind(this);
    this.handleMapDelete = this.handleMapDelete.bind(this);
  }

  handleFloorDelete(floorId) {
    const { deleteFloor, entity } = this.props;
    const floor = entity.floors.find((f) => f.id === floorId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_location.remove_floor_warning")} ${
        floor.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteFloor(entity.id, floorId);
      }
    });
  }

  handleRoomDelete(roomId) {
    const { deleteRoom, entity } = this.props;
    const room = entity.rooms.find((r) => r.id === roomId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_location.remove_room_warning")} ${room.name}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteRoom(entity.id, roomId);
      }
    });
  }

  handleImageDelete(imageId) {
    const { deleteLocationImage, entity } = this.props;
    const image = entity.images.find((i) => i.id === imageId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_location.remove_image_warning")} ${
        image.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteLocationImage(entity.id, imageId);
      }
    });
  }

  handleMapDelete(mapId) {
    const { deleteLocationMap, entity } = this.props;
    const map = entity.maps.find((m) => m.id === mapId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_location.remove_map_warning")} ${map.name}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteLocationMap(entity.id, mapId);
      }
    });
  }

  render() {
    const { currentSummit, allClasses, entity, errors, history, match } =
      this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");

    return (
      <div className="container">
        <h3>
          {title} {T.translate("edit_location.location")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <LocationForm
            history={history}
            currentSummit={currentSummit}
            allClasses={allClasses}
            entity={entity}
            errors={errors}
            onSubmit={this.props.saveLocation}
            onMapUpdate={this.props.updateLocationMap}
            onMarkerDragged={this.props.updateAddress}
            onFloorDelete={this.handleFloorDelete}
            onRoomDelete={this.handleRoomDelete}
            onImageDelete={this.handleImageDelete}
            onMapDelete={this.handleMapDelete}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, currentLocationState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentLocationState
});

export default connect(mapStateToProps, {
  getSummitById,
  getLocation,
  resetLocationForm,
  saveLocation,
  updateLocationMap,
  updateAddress,
  deleteFloor,
  deleteRoom,
  deleteLocationImage,
  deleteLocationMap
})(EditLocationPage);
