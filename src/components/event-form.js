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
import moment from 'moment-timezone'
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css'
import TextEditor from './editor_input'
import Dropdown from './dropdown'
import GroupedDropdown from './grouped_dropdown'
import DateTimePicker from './datetimepicker'
import TagInput from './tag_input'
import SpeakerInput from './speaker_input'
import CompanyInput from './company_input'
import GroupInput from './group_input'
import UploadInput from './upload_input'
import Input from 'react-validation/build/input'
import Form from 'react-validation/build/form'
import {required, email} from './form_validation'


class EventForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            entity: this.props.entity
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleUploadFile = this.handleUploadFile.bind(this);
        this.handleRemoveFile = this.handleRemoveFile.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({entity: nextProps.entity});
    }

    handleChange(ev) {
        let entity = this.state.entity;
        let {value, id} = ev.target;

        if (ev.target.type == 'radio') {
            id = ev.target.name;
        }

        entity[id] = value;
        this.setState({entity: entity});
    }

    handleUploadFile(file) {
        console.log('file uploaded');
        let formData = new FormData();
        formData.append('file', file);
        this.props.onAttach(this.props.currentSummit.id, this.state.entity, formData)
    }

    handleRemoveFile(ev) {
        let entity = this.state.entity;

        entity.attachment = '';
        this.setState({entity:entity});
    }

    handleSubmit(publish, ev) {
        console.log('event submitted');
        ev.preventDefault();

        this.form.validateAll();

        let {entity} = this.state;
        if (!entity.start_date) delete entity['start_date'];
        if (!entity.end_date) delete entity['end_date'];

        this.props.onSubmit(this.state.entity, publish);
    }

    isEventType(types) {
        let {entity} = this.state;
        if (!entity.type_id) return false;
        let entity_type = this.props.typeopts.find(t => t.id == entity.type_id);

        types = Array.isArray(types) ? types : [types] ;

        return ( types.indexOf(entity_type.class_name) != -1 || types.indexOf(entity_type.name) != -1 );

    }

    getFormattedTime(atime) {
        if(!atime) return atime;
        atime = atime * 1000;
        return moment(atime).tz(this.props.currentSummit.time_zone.name).format('MMMM Do YYYY, h:mm:ss a');
    }

    render() {
        let {entity} = this.state;
        let { currentSummit, levelopts, typeopts, trackopts, locationopts } = this.props;

        let event_types_ddl = typeopts.map(t => ({label: t.name, value: t.id, type: t.class_name}));

        let tracks_ddl = trackopts.map(t => ({label: t.name, value: t.id}));

        let venues = locationopts.filter(v => (v.class_name == 'SummitVenue')).map(l =>
            ({label: l.name, value: l.rooms.map(r =>
                ({label: r.name, value: r.id})
            )})
        );

        let locations_ddl = [
            {label: 'TBA', value: 0},
            ...venues
        ];

        let levels_ddl = levelopts.map(l => ({label: l, value: l}));

        return (
            <Form ref={c => { this.form = c }} >
                <input type="hidden" id="id" value={entity.id} />
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Title *</label>
                        <Input className="form-control" name="title" id="title" value={entity.title} onChange={this.handleChange} validations={[required]}/>
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Short Description / Abstract </label>
                        <TextEditor id="description" value={entity.description} onChange={this.handleChange} />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Social Summary </label>
                        <textarea className="form-control" id="social_description" value={entity.social_description} onChange={this.handleChange} />
                    </div>
                </div>
                {this.isEventType('PresentationType') &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> What can attendees expect to learn? </label>
                        <TextEditor id="attendees_expected_learnt" value={entity.attendees_expected_learnt} onChange={this.handleChange} />
                    </div>
                </div>
                }
                <div className="row form-group">
                    <div className="col-md-4">
                        <label> Head Count </label>
                        <input className="form-control" type="number" id="head_count" value={entity.head_count} onChange={this.handleChange} />
                    </div>
                    <div className="col-md-8">
                        <label> RSVP Link </label>
                        <input className="form-control" id="rsvp_link" value={entity.rsvp_link} onChange={this.handleChange} />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-4">
                        <label> Location </label>
                        <GroupedDropdown
                            id="location_id"
                            value={entity.location_id}
                            options={locations_ddl}
                            placeholder="-- Select a Venue --"
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="col-md-4" style={{paddingTop: '24px'}}>
                        <DateTimePicker
                            id="start_date"
                            onChange={this.handleChange}
                            validation={{after: currentSummit.start_date, before: entity.end_date}}
                            format={{date:"YYYY-MM-DD", time: "HH:mm:ss"}}
                            value={this.getFormattedTime(entity.start_date)}
                            inputProps={{placeholder: 'Start Date'}}
                            timezone={currentSummit.time_zone.name}
                        />
                    </div>
                    <div className="col-md-4" style={{paddingTop: '24px'}}>
                        <DateTimePicker
                            id="end_date"
                            onChange={this.handleChange}
                            validation={{after: entity.start_date, before: currentSummit.end_date}}
                            format={{date:"YYYY-MM-DD", time: "HH:mm:ss"}}
                            value={this.getFormattedTime(entity.end_date)}
                            inputProps={{placeholder: 'End Date'}}
                            timezone={currentSummit.time_zone.name}
                        />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-4">
                        <label> Event Type *</label>
                        <Dropdown
                            id="type_id"
                            value={entity.type_id}
                            onChange={this.handleChange}
                            placeholder="-- Select a Type --"
                            options={event_types_ddl}
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <label> Track *</label>
                        <Dropdown
                            id="track_id"
                            value={entity.track_id}
                            onChange={this.handleChange}
                            placeholder="-- Select a Track --"
                            options={tracks_ddl}
                            validations={[required]}
                            required
                        />
                    </div>
                    {entity.type == 'presentation' &&
                    <div className="col-md-4">
                        <label> Level </label>
                        <Dropdown
                            id="level"
                            value={entity.level}
                            onChange={this.handleChange}
                            placeholder="-- Select a Level --"
                            options={levels_ddl}
                        />
                    </div>
                    }
                </div>
                <div className="row form-group">
                    <div className="col-md-4">
                        <label> Feedback </label>
                        <div className="form-check abc-checkbox">
                            <input type="checkbox" id="allow_feedback" checked={entity.allow_feedback} onChange={this.handleChange} className="form-check-input" />
                            <label className="form-check-label" htmlFor="feedback"> Allow feedback ? </label>
                        </div>
                    </div>
                    {this.isEventType('PresentationType') &&
                    <div className="col-md-4">
                        <label> Recording </label>
                        <div className="form-check abc-checkbox">
                            <input id="to_record" onChange={this.handleChange} checked={entity.to_record} className="form-check-input" type="checkbox" />
                            <label className="form-check-label" htmlFor="to_record"> To record ? </label>
                        </div>
                    </div>
                    }
                    <div className="col-md-4">
                        <label> Does this talk feature an OpenStack cloud? </label><br/>
                        <div className="form-check abc-radio radio-inline">
                            <input checked={entity.feature_cloud} onChange={this.handleChange} name="feature_cloud" id="feature_cloud_1" value={1} className="form-check-input" type="radio" />
                            <label className="form-check-label" htmlFor="feature_cloud_1"> Yes </label>
                        </div>
                        <div className="form-check abc-radio radio-inline" style={{marginLeft: '100px'}}>
                            <input checked={!entity.feature_cloud} onChange={this.handleChange} name="feature_cloud" id="feature_cloud_2" value={0} className="form-check-input" type="radio" />
                            <label className="form-check-label" htmlFor="feature_cloud_2"> No </label>
                        </div>
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Tags </label>
                        <TagInput
                            id="tags"
                            value={entity.tags}
                            onChange={this.handleChange}
                            allow_new={false}
                        />
                    </div>
                </div>
                {this.isEventType('Presentation') &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Sponsors </label>
                        <CompanyInput
                            id="sponsors"
                            value={entity.sponsors}
                            onChange={this.handleChange}
                            summitId={currentSummit.id}
                            multi={true}
                        />
                    </div>
                </div>
                }
                {this.isEventType('PresentationType') &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Speakers </label>
                        <SpeakerInput
                            id="speakers"
                            value={entity.speakers}
                            onChange={this.handleChange}
                            summitId={currentSummit.id}
                            multi={true}
                        />
                    </div>
                </div>
                }
                {this.isEventType(['Keynotes', 'Panel']) &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Moderator </label>
                        <SpeakerInput
                            id="moderator"
                            value={entity.moderator}
                            onChange={this.handleChange}
                            summitId={currentSummit.id}
                            multi={false}
                        />
                    </div>
                </div>
                }
                {this.isEventType('Fishbowl') &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Discussion Leader </label>
                        <SpeakerInput
                            id="moderator"
                            value={entity.moderator}
                            onChange={this.handleChange}
                            summitId={currentSummit.id}
                            multi={false}
                        />
                    </div>
                </div>
                }
                {this.isEventType('Groups Events') &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Groups </label>
                        <GroupInput
                            id="groups"
                            value={entity.groups}
                            onChange={this.handleChange}
                            summitId={currentSummit.id}
                            multi={true}
                        />
                    </div>
                </div>
                }

                {this.isEventType('SummitEventType') &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> Attachment </label>
                        <UploadInput
                            value={entity.attachment}
                            handleUpload={this.handleUploadFile}
                            handleRemove={this.handleRemoveFile}
                            className="dropzone col-md-6"
                            multiple={this.props.multi}
                            accept="image/*"
                        />
                    </div>
                </div>
                }

                <input type="button" onClick={this.handleSubmit.bind(this, false)} className="btn btn-primary" value="Save" />
                <input type="button" onClick={this.handleSubmit.bind(this, true)} className="btn btn-primary" value="Save & Publish" />
            </Form>
        );
    }
}

export default EventForm;