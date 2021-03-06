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
 **/

import React from 'react'
import { connect } from 'react-redux';
import T from 'i18n-react/dist/i18n-react';
import Swal from "sweetalert2";
import { SortableTable } from 'openstack-uicore-foundation/lib/components';
import { getSummitById }  from '../../actions/summit-actions';
import { getLocations, deleteLocation, exportLocations, updateLocationOrder } from "../../actions/location-actions";

class LocationListPage extends React.Component {

    constructor(props) {
        super(props);

        this.handleEdit = this.handleEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleNewLocation = this.handleNewLocation.bind(this);
        this.handleExport = this.handleExport.bind(this);

        this.state = {}

    }

    componentDidMount() {
        const {currentSummit} = this.props;
        if(currentSummit) {
            this.props.getLocations();
        }
    }

    handleEdit(locationId) {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/locations/${locationId}`);
    }

    handleExport(ev) {
        ev.preventDefault();
        this.props.exportLocations();
    }

    handleDelete(locationId) {
        const {deleteLocation, locations} = this.props;
        let location = locations.find(p => p.id === locationId);

        Swal.fire({
            title: T.translate("general.are_you_sure"),
            text: T.translate("location_list.remove_warning") + ' ' + location.name,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: T.translate("general.yes_delete")
        }).then(function(result){
            if (result.value) {
                deleteLocation(locationId);
            }
        });
    }

    handleNewLocation(ev) {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/locations/new`);
    }

    render(){
        const {currentSummit, locations, totalLocations} = this.props;

        const columns = [
            { columnKey: 'name', value: T.translate("location_list.name") },
            { columnKey: 'class_name', value: T.translate("location_list.class_name") }
        ];

        const table_options = {
            actions: {
                edit: { onClick: this.handleEdit },
                delete: { onClick: this.handleDelete }
            }
        }

        if(!currentSummit.id) return(<div />);

        let sortedLocations = [...locations];
        sortedLocations.sort(
            (a, b) => (a.order > b.order ? 1 : (a.order < b.order ? -1 : 0))
        );

        return(
            <div className="container">
                <h3> {T.translate("location_list.location_list")} ({totalLocations})</h3>
                <div className={'row'}>
                    <div className="col-md-6 col-md-offset-6 text-right">
                        <button className="btn btn-primary right-space" onClick={this.handleNewLocation}>
                            {T.translate("location_list.add_location")}
                        </button>
                        {/*<button className="btn btn-default" onClick={this.handleExport}>
                            {T.translate("general.export")}
                        </button>*/}
                    </div>
                </div>

                {locations.length === 0 &&
                <div className="no-items">{T.translate("location_list.no_items")}</div>
                }

                {locations.length > 0 &&
                <div>
                    <SortableTable
                        options={table_options}
                        data={sortedLocations}
                        columns={columns}
                        dropCallback={this.props.updateLocationOrder}
                        orderField="order"
                    />
                </div>
                }

            </div>
        )
    }
}

const mapStateToProps = ({ currentSummitState, currentLocationListState }) => ({
    currentSummit   : currentSummitState.currentSummit,
    ...currentLocationListState
})

export default connect (
    mapStateToProps,
    {
        getSummitById,
        getLocations,
        updateLocationOrder,
        deleteLocation,
        exportLocations
    }
)(LocationListPage);
