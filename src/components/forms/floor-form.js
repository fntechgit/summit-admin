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
import T from 'i18n-react/dist/i18n-react'
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css'
import {findElementPos} from '../../utils/methods'
import Input from '../inputs/text-input'
import TextEditor from '../inputs/editor-input'
import SimpleLinkList from '../simple-link-list/index'
import Panel from '../sections/panel'
import {queryRooms} from '../../actions/location-actions'


class FloorForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            entity: {...props.entity},
            errors: props.errors,
            showRooms: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleRoomLink = this.handleRoomLink.bind(this);
        this.handleRoomEdit = this.handleRoomEdit.bind(this);
        this.handleRoomUnLink = this.handleRoomUnLink.bind(this);
    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            entity: {...nextProps.entity},
            errors: {...nextProps.errors}
        });

        //scroll to first error
        if(Object.keys(nextProps.errors).length > 0) {
            let firstError = Object.keys(nextProps.errors)[0]
            let firstNode = document.getElementById(firstError);
            if (firstNode) window.scrollTo(0, findElementPos(firstNode));
        }
    }

    handleChange(ev) {
        let entity = {...this.state.entity};
        let errors = {...this.state.errors};
        let {value, id} = ev.target;

        if (ev.target.type == 'number') {
            value = parseInt(ev.target.value);
        }

        errors[id] = '';
        entity[id] = value;
        this.setState({entity: entity, errors: errors});
    }

    handleSubmit(ev) {
        let entity = {...this.state.entity};
        ev.preventDefault();

        this.props.onSubmit(this.state.entity, this.props.history);
    }

    hasErrors(field) {
        let {errors} = this.state;
        if(field in errors) {
            return errors[field];
        }

        return '';
    }

    toggleRooms(ev) {
        ev.preventDefault();

        this.setState({showRooms: !this.state.showRooms});
    }

    handleRoomLink(value) {
        let rooms = [...this.state.entity.rooms];
        rooms.push(value);

        let entity = {...this.state.entity, rooms: rooms};
        this.setState({entity: entity});
    }

    handleRoomUnLink(value, ev) {
        ev.preventDefault();

        let rooms = this.state.entity.rooms.filter(r => r.id != value);

        let entity = {...this.state.entity, rooms: rooms};
        this.setState({entity: entity});
    }

    handleRoomEdit(roomId) {
        let {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/locations/1/rooms/${roomId}`);
    }

    render() {
        let {entity, showRooms} = this.state;

        let room_columns = [
            { columnKey: 'id', value: T.translate("general.id") },
            { columnKey: 'name', value: T.translate("general.name") },
            { columnKey: 'capacity', value: T.translate("edit_location.capacity") },
            { columnKey: 'floor', value: T.translate("edit_location.floor") }
        ];

        return (
            <form className="floor-form">
                <input type="hidden" id="id" value={entity.id} />
                <div className="row form-group">
                    <div className="col-md-4">
                        <label> {T.translate("edit_floor.name")} *</label>
                        <Input
                            id="name"
                            value={entity.name}
                            onChange={this.handleChange}
                            className="form-control"
                            error={this.hasErrors('name')}
                        />
                    </div>
                    <div className="col-md-4">
                        <label> {T.translate("edit_floor.number")}</label>
                        <Input
                            id="number"
                            type="number"
                            value={entity.number}
                            onChange={this.handleChange}
                            className="form-control"
                            error={this.hasErrors('number')}
                        />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> {T.translate("edit_floor.description")} </label>
                        <TextEditor
                            id="description"
                            value={entity.description}
                            onChange={this.handleChange}
                            error={this.hasErrors('description')}
                        />
                    </div>
                </div>

                <Panel show={showRooms} title={T.translate("edit_location.rooms")} handleClick={this.toggleRooms.bind(this)} >
                    <button className="btn btn-primary pull-right left-space" onClick={this.handleNewRoom}>
                        {T.translate("edit_location.add_room")}
                    </button>
                    <SimpleLinkList
                        title={T.translate("edit_location.rooms")}
                        values={entity.rooms}
                        columns={room_columns}
                        valueKey="room"
                        labelKey="room"
                        onEdit={this.handleRoomEdit}
                        onLink={this.handleRoomLink}
                        onUnLink={this.handleRoomUnLink}
                        queryOptions={queryRooms}
                    />
                </Panel>

                <div className="row">
                    <div className="col-md-12 submit-buttons">
                        <input type="button" onClick={this.handleSubmit}
                               className="btn btn-primary pull-right" value={T.translate("general.save")}/>
                    </div>
                </div>
            </form>
        );
    }
}

export default FloorForm;