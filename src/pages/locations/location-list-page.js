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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import Switch from "react-switch";
import { SortableTable } from "openstack-uicore-foundation/lib/components";
import SummitDropdown from "../../components/summit-dropdown";

import { getSummitById } from "../../actions/summit-actions";
import {
  getLocations,
  deleteLocation,
  exportLocations,
  updateLocationOrder,
  copyLocations
} from "../../actions/location-actions";
import {
  getSyncConfig,
  updateSyncConfig,
  rebuildSync
} from "../../actions/dropbox-sync-actions";

function LocationListPage({
  currentSummit,
  history,
  locations,
  totalLocations,
  dropboxSyncState,
  ...props
}) {
  useEffect(() => {
    if (currentSummit) {
      props.getLocations();
      if (window.DROPBOX_MATERIALIZER_API_BASE_URL) {
        props.getSyncConfig();
      }
    }
  }, [currentSummit?.id]);

  if (!currentSummit.id) return <div />;

  const handleEdit = (locationId) => {
    history.push(`/app/summits/${currentSummit.id}/locations/${locationId}`);
  };

  const handleDelete = (locationId) => {
    const location = locations.find((p) => p.id === locationId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("location_list.remove_warning")} ${location.name}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        props.deleteLocation(locationId);
      }
    });
  };

  const handleNewLocation = () => {
    history.push(`/app/summits/${currentSummit.id}/locations/new`);
  };

  const handleCopyLocations = (fromSummitId) => {
    props.copyLocations(fromSummitId);
  };

  const handleSyncToggle = (checked) => {
    props.updateSyncConfig({
      dropbox_sync_enabled: checked
    });
  };

  const handleRebuild = () => {
    Swal.fire({
      title: T.translate("dropbox_sync.rebuild_confirm_title"),
      text: T.translate("dropbox_sync.rebuild_confirm_body"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("dropbox_sync.rebuild_confirm_yes")
    }).then((result) => {
      if (result.value) {
        props.rebuildSync();
      }
    });
  };

  const columns = [
    { columnKey: "name", value: T.translate("location_list.name") },
    { columnKey: "class_name", value: T.translate("location_list.class_name") }
  ];

  const table_options = {
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

  const sortedLocations = locations.sort((a, b) => a.order - b.order);

  const { syncConfig, loading: syncLoading } = dropboxSyncState;
  const showSyncPanel = !!window.DROPBOX_MATERIALIZER_API_BASE_URL;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("location_list.location_list")} ({totalLocations})
      </h3>

      {showSyncPanel && (
        <div className="panel panel-default" style={{ marginBottom: 20 }}>
          <div className="panel-heading">
            <h4 className="panel-title">
              {T.translate("dropbox_sync.panel_title")}
            </h4>
          </div>
          <div className="panel-body">
            <div className="row form-group">
              <div className="col-md-6">
                <label>
                  {T.translate("dropbox_sync.toggle_label")}
                  &nbsp;
                </label>
                <br />
                <Switch
                  id="dropbox_sync_enabled"
                  checked={syncConfig.dropbox_sync_enabled}
                  onChange={handleSyncToggle}
                  uncheckedIcon={false}
                  checkedIcon={false}
                  className="react-switch"
                  disabled={syncLoading}
                />
                <p className="help-block">
                  {T.translate("dropbox_sync.toggle_helper")}
                </p>
              </div>
            </div>
            <hr />
            <div className="row form-group">
              <div className="col-md-6">
                <h5>{T.translate("dropbox_sync.rebuild_title")}</h5>
                <p className="text-danger">
                  {T.translate("dropbox_sync.rebuild_warning")}
                </p>
                <button
                  className="btn btn-default"
                  onClick={handleRebuild}
                  disabled={syncLoading}
                >
                  <i className="fa fa-refresh" />{" "}
                  {T.translate("dropbox_sync.rebuild_button")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-md-6 col-md-offset-6 text-right">
          <button
            className="btn btn-primary right-space"
            onClick={handleNewLocation}
          >
            {T.translate("location_list.add_location")}
          </button>
          <SummitDropdown
            onClick={handleCopyLocations}
            actionLabel={T.translate("location_list.copy_locations")}
          />
        </div>
      </div>

      {locations.length === 0 && (
        <div className="no-items">{T.translate("location_list.no_items")}</div>
      )}

      {locations.length > 0 && (
        <div>
          <SortableTable
            options={table_options}
            data={sortedLocations}
            columns={columns}
            dropCallback={props.updateLocationOrder}
            orderField="order"
          />
        </div>
      )}
    </div>
  );
}

const mapStateToProps = ({
  currentSummitState,
  currentLocationListState,
  dropboxSyncState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  dropboxSyncState,
  ...currentLocationListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getLocations,
  updateLocationOrder,
  deleteLocation,
  exportLocations,
  copyLocations,
  getSyncConfig,
  updateSyncConfig,
  rebuildSync
})(LocationListPage);
