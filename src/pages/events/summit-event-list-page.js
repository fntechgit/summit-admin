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
import {Modal, Pagination } from 'react-bootstrap';
import {FreeTextSearch, Table, UploadInput, Input, TagInput, SpeakerInput, Dropdown, DateTimePicker} from 'openstack-uicore-foundation/lib/components';
import { SegmentedControl } from 'segmented-control'
import { epochToMomentTimeZone } from 'openstack-uicore-foundation/lib/utils/methods'
import { getSummitById }  from '../../actions/summit-actions';
import { getEvents, deleteEvent, exportEvents, importEventsCSV, importMP4AssetsFromMUX } from "../../actions/event-actions";
import {hasErrors} from "../../utils/methods";
import '../../styles/summit-event-list-page.less';

class SummitEventListPage extends React.Component {

    constructor(props) {
        super(props);

        this.handleEdit = this.handleEdit.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleNewEvent = this.handleNewEvent.bind(this);
        this.handleDeleteEvent = this.handleDeleteEvent.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.handleChangeSendSpeakerEmail = this.handleChangeSendSpeakerEmail.bind(this);
        this.handleImportEvents = this.handleImportEvents.bind(this);
        this.handleMUXImport = this.handleMUXImport.bind(this);
        this.handleChangeMUXModal = this.handleChangeMUXModal.bind(this);
        this.handleImportAssetsFromMUX = this.handleImportAssetsFromMUX.bind(this);
        this.handleExtraFilterChange = this.handleExtraFilterChange.bind(this);
        this.handleTagOrSpeakerFilterChange = this.handleTagOrSpeakerFilterChange.bind(this);        
        this.handleSetPublishedFilter = this.handleSetPublishedFilter.bind(this);
        this.handleChangeStartDate = this.handleChangeStartDate.bind(this);
        this.handleChangeEndDate = this.handleChangeEndDate.bind(this);
        this.state = {
            showImportModal: false,
            send_speaker_email:false,
            showImportFromMUXModal: false,
            importFile:null,
            muxModalState: {
                mux_token_id: "",
                mux_token_secret: "",
                mux_email_to:"",
            },
            errors:{},
        };

        this.extraFilters = {
            allows_attendee_vote_filter: false,
            allows_location_filter: false,
            allows_publishing_dates_filter: false,        
            selection_plan_id_filter: [],
            location_id_filter: [],
            selection_status_filter: [],
            track_id_filter: [],
            event_type_id_filter: [],
            speaker_id_filter: [],
            level_filter: [],
            tags_filter: [],
            published_filter: null,
            start_date_filter: '',
            end_date_filter: '',
        }
    }

    handleChangeSendSpeakerEmail(ev){
        this.setState({...this.state, send_speaker_email: ev.target.checked});
    }

    handleChangeMUXModal(ev){
        const errors = {...this.state.errors};
        const muxModalState = {...this.state.muxModalState};
        let {value, id} = ev.target;
        errors[id] = '';
        muxModalState[id] = value;
        this.setState({...this.state, muxModalState: muxModalState, errors: errors});
    }

    handleMUXImport(ev){
        ev.preventDefault();
        this.setState({...this.state , showImportFromMUXModal: true});
    }

    handleImportAssetsFromMUX(ev){
        ev.preventDefault();
        this.props.importMP4AssetsFromMUX
        (
            this.state.muxModalState.mux_token_id,
            this.state.muxModalState.mux_token_secret,
            this.state.muxModalState.mux_email_to
        ).then(() => this.setState({...this.state, muxModalState:{mux_token_id:"",  mux_token_secret:"", mux_email_to:""}}))
    }

    handleImportEvents() {
        if (this.state.importFile) {
            this.props.importEventsCSV(this.state.importFile, this.state.send_speaker_email);
        }
        this.setState({...this.state, showImportModal:false, send_speaker_email:false, importFile: null});
    }

    componentDidMount() {
        const {currentSummit} = this.props;
        if(currentSummit) {
            this.props.getEvents();
        }
    }

    handleEdit(event_id) {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/events/${event_id}`);
    }

    handleExport(ev) {
        const {term, order, orderDir} = this.props;
        ev.preventDefault();
        this.props.exportEvents(term, order, orderDir, this.extraFilters);
    }

    handlePageChange(page) {
        const {term, order, orderDir, perPage} = this.props;
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }

    handleSort(index, key, dir, func) {
        const {term, page, perPage} = this.props;
        key = (key === 'name') ? 'last_name' : key;
        this.props.getEvents(term, page, perPage, key, dir, this.extraFilters);
    }

    handleSearch(term) {
        const {order, orderDir, page, perPage} = this.props;
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }

    handleNewEvent(ev) {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/events/new`);
    }

    handleDeleteEvent(eventId) {
        const {deleteEvent, events} = this.props;
        let event = events.find(e => e.id === eventId);

        Swal.fire({
            title: T.translate("general.are_you_sure"),
            text: T.translate("event_list.delete_event_warning") + ' ' + event.title,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: T.translate("general.yes_delete")
        }).then(function(result){
            if (result.value) {
                deleteEvent(eventId);
            }
        });
    }

    handleExtraFilterChange(ev) {
        const {term, order, orderDir, page, perPage} = this.props;
        let {value, type, id} = ev.target;
        if (type === 'checkbox') {
            value = ev.target.checked;
        }
        this.extraFilters[id] = value;        
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }

    handleTagOrSpeakerFilterChange(ev) {
        const {term, order, orderDir, page, perPage} = this.props;
        let {value, id} = ev.target;
        this.extraFilters[id] = value;
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }    

    handleSetPublishedFilter(ev) {
        const {term, order, orderDir, page, perPage} = this.props;
        this.extraFilters.published_filter = ev;
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }

    handleChangeStartDate(ev) {
        const {term, order, orderDir, page, perPage} = this.props;        
        const {value} = ev.target;
        this.extraFilters.start_date_filter = value.unix();
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }

    handleChangeEndDate(ev) {
        const {term, order, orderDir, page, perPage} = this.props;
        const {value} = ev.target;
        this.extraFilters.end_date_filter = value.unix();
        this.props.getEvents(term, page, perPage, order, orderDir, this.extraFilters);
    }


    render(){
        const {currentSummit, events, lastPage, currentPage, term, order, orderDir, totalEvents} = this.props;

        const columns = [
            { columnKey: 'id', value: T.translate("general.id"), sortable: true },
            { columnKey: 'type', value: T.translate("event_list.type") },
            { columnKey: 'title', value: T.translate("event_list.title"), sortable: true },
            { columnKey: 'status', value: T.translate("event_list.status") },
            { columnKey: 'speakers', value: T.translate("event_list.speakers") },
            { columnKey: 'created_by_fullname', value: T.translate("event_list.created_by") },
            { columnKey: 'published_date', value: T.translate("event_list.published") },
        ];

        const table_options = {
            sortCol: (order === 'last_name') ? 'name' : order,
            sortDir: orderDir,
            actions: {
                edit: {onClick: this.handleEdit},
                delete: { onClick: this.handleDeleteEvent }
            }
        }

        const selection_plans_ddl = currentSummit.selection_plans?.sort((a,b) => a.order - b.order).map((sp => ({label: sp.name, value: sp.id})));

        const location_ddl = currentSummit.locations?.sort((a,b) => a.order - b.order).map((l => ({label: l.name, value: l.id})));

        const selection_status_ddl = [
            {label: 'Selected', value: 'selected'},
            {label: 'Rejected', value: 'rejected'},
            {label: 'Alternate', value: 'alternate'},
        ];

        const track_ddl = currentSummit.tracks?.sort((a,b) => a.order - b.order).map((t => ({label: t.name, value: t.id})));

        const event_type_ddl = currentSummit.event_types?.sort((a,b) => a.order - b.order).map((t => ({label: t.name, value: t.id})));

        const level_ddl = [
            {label: 'Beginner', value: 'beginner'},
            {label: 'Intermediate', value: 'intermediate'},
            {label: 'Advanced', value: 'advanced'},
            {label: 'N/A', value: 'na'},
        ];

        if(!currentSummit.id) return(<div />);

        return(
            <div className="container summit-event-list-filters">
                <h3> {T.translate("event_list.event_list")} ({totalEvents})</h3>
                <div className={'row'}>
                    <div className={'col-md-6'}>
                        <FreeTextSearch
                            value={term ?? ''}
                            placeholder={T.translate("event_list.placeholders.search_events")}
                            onSearch={this.handleSearch}
                        />
                    </div>
                    <div className="col-md-6 text-right">
                        <button className="btn btn-primary right-space" onClick={this.handleNewEvent}>
                            {T.translate("event_list.add_event")}
                        </button>
                        <button className="btn btn-default right-space" onClick={this.handleExport}>
                            {T.translate("general.export")}
                        </button>
                        <button className="btn btn-default right-space" onClick={this.handleMUXImport}>
                            {T.translate("event_list.mux_import")}
                        </button>
                        <button className="btn btn-default" onClick={() => this.setState({showImportModal:true})}>
                            {T.translate("event_list.import")}
                        </button>
                    </div>
                </div>                
                <div className={'row'}>
                    <div className={'col-md-6'}>
                        <div className='panel panel-default'>
                            <div className="panel-body">
                                <div className="form-check abc-checkbox checkbox-inline">
                                    <input type="checkbox" id="allows_attendee_vote_filter" 
                                        onChange={this.handleExtraFilterChange} className="form-check-input" />
                                    <label className="form-check-label" htmlFor="allows_attendee_vote_filter"> 
                                        {T.translate("event_list.allows_attendee_vote_filter")} </label>
                                </div>
                                <div className="form-check abc-checkbox checkbox-inline">
                                    <input type="checkbox" id="allows_location_filter" 
                                        onChange={this.handleExtraFilterChange}  className="form-check-input" />
                                    <label className="form-check-label" htmlFor="allows_location_filter"> 
                                        {T.translate("event_list.allows_location_filter")} </label>
                                </div>
                                <div className="form-check abc-checkbox checkbox-inline">
                                    <input type="checkbox" id="allows_publishing_dates_filter" 
                                        onChange={this.handleExtraFilterChange}  className="form-check-input" />
                                    <label className="form-check-label" htmlFor="allows_publishing_dates_filter"> 
                                        {T.translate("event_list.allows_publishing_dates_filter")} </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={'col-md-6'}>                         
                        <Dropdown
                            id="selection_plan_id_filter"
                            placeholder={T.translate("event_list.placeholders.selection_plan")}
                            value={this.extraFilters.selection_plan_id_filter}
                            onChange={this.handleExtraFilterChange}
                            options={selection_plans_ddl}
                            isClearable={true}
                            isMulti={true}
                        />
                    </div>
                </div>
                <div className={'row'}>                    
                    <div className={'col-md-6'}>
                        <Dropdown
                            id="location_id_filter"
                            placeholder={T.translate("event_list.placeholders.location")}
                            value={this.extraFilters.location_id_filter}
                            onChange={this.handleExtraFilterChange}
                            options={location_ddl}
                            isClearable={true}
                            isMulti={true}
                        />
                    </div>
                    <div className={'col-md-6'}> 
                        <Dropdown
                            id="selection_status_filter"
                            placeholder={T.translate("event_list.placeholders.selection_status")}
                            value={this.extraFilters.selection_status_filter}
                            onChange={this.handleExtraFilterChange}
                            options={selection_status_ddl}
                            isClearable={true}
                            isMulti={true}
                        />
                    </div>
                </div>
                <div className={'row'}>                    
                    <div className={'col-md-6'}>
                        <SegmentedControl
                            name="published_filter"
                            options={[
                                { label: "All", value: null, default: this.extraFilters.published_filter === null},
                                { label: "Published", value: "published",default: this.extraFilters.published_filter === "published"},
                                { label: "Non Published", value: "non_published", default: this.extraFilters.published_filter === "non_published"},
                            ]}
                            setValue={newValue => this.handleSetPublishedFilter(newValue)}
                            style={{ width: "100%", height:40, color: '#337ab7', fontSize: '10px'  }}
                        />                        
                    </div>
                    <div className={'col-md-6'}> 
                        <Dropdown
                            id="track_id_filter"
                            placeholder={T.translate("event_list.placeholders.track")}
                            value={this.extraFilters.track_id_filter}
                            onChange={this.handleExtraFilterChange}
                            options={track_ddl}
                            isClearable={true}
                            isMulti={true}
                        />
                    </div>
                </div>
                <div className={'row'}>
                    <div className={'col-md-6'}>
                        <Dropdown
                            id="event_type_id_filter"
                            placeholder={T.translate("event_list.placeholders.event_type")}
                            value={this.extraFilters.event_type_id_filter}
                            onChange={this.handleExtraFilterChange}
                            options={event_type_ddl}
                            isClearable={true}
                            isMulti={true}
                        />
                    </div>
                    <div className={'col-md-6'}> 
                        <SpeakerInput
                            id="speaker_id_filter"
                            placeholder={T.translate("event_list.placeholders.speaker")}
                            value={this.extraFilters.speaker_id_filter}
                            onChange={this.handleTagOrSpeakerFilterChange}
                            summitId={currentSummit.id}
                            isMulti={true}
                            isClearable={true}                            
                        />
                    </div>
                </div>
                <div className={'row'}>
                    <div className={'col-md-6'}>
                        <Dropdown
                            id="level_filter"
                            placeholder={T.translate("event_list.placeholders.level")}
                            value={this.extraFilters.level_filter}
                            onChange={this.handleExtraFilterChange}
                            options={level_ddl}
                            isClearable={true}
                            isMulti={true}
                        />
                    </div>
                    <div className={'col-md-6'}> 
                        <TagInput
                            id="tags_filter"
                            placeholder={T.translate("event_list.placeholders.tags")}
                            value={this.extraFilters.tags_filter}
                            onChange={this.handleTagOrSpeakerFilterChange}
                            summitId={currentSummit.id}
                            isMulti={true}
                            isClearable={true}
                        />
                    </div>
                </div>
                <div className={'row'}>
                    <div className={'col-md-6'}>
                        <DateTimePicker
                            id="start_date_filter"
                            format={{date:"YYYY-MM-DD", time: "HH:mm"}}                            
                            inputProps={{placeholder: T.translate("event_list.placeholders.start_date")}}
                            timezone={currentSummit.time_zone.name}                            
                            onChange={this.handleChangeStartDate}                            
                            value={epochToMomentTimeZone(this.extraFilters.start_date_filter, currentSummit.time_zone_id)}
                        />
                    </div>
                    <div className={'col-md-6'}>
                        <DateTimePicker
                            id="end_date_filter"
                            format={{date:"YYYY-MM-DD", time: "HH:mm"}}                            
                            inputProps={{placeholder: T.translate("event_list.placeholders.end_date")}}
                            timezone={currentSummit.time_zone.name}                            
                            onChange={this.handleChangeEndDate}                            
                            value={epochToMomentTimeZone(this.extraFilters.end_date_filter, currentSummit.time_zone_id)}
                        />
                    </div>
                </div>
 
                {events.length === 0 &&
                    <div>{T.translate("event_list.no_events")}</div>
                }

                {events.length > 0 &&
                <div>
                    <Table
                        options={table_options}
                        data={events}
                        columns={columns}
                        onSort={this.handleSort}
                    />
                    <Pagination
                        bsSize="medium"
                        prev
                        next
                        first
                        last
                        ellipsis
                        boundaryLinks
                        maxButtons={10}
                        items={lastPage}
                        activePage={currentPage}
                        onSelect={this.handlePageChange}
                    />
                </div>
                }

                <Modal show={this.state.showImportModal} onHide={() => this.setState({showImportModal:false})} >
                    <Modal.Header closeButton>
                        <Modal.Title>{T.translate("event_list.import_events")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-md-12">
                                Format must be the following:<br />
                                (Minimal data required)<br />
                                * title ( text )<br />
                                * abstract (text )<br />
                                * type_id (int) or type (string type name)<br />
                                * track_id (int) or track ( string track name)<br />
                            </div>
                            <div className="col-md-12 ticket-import-upload-wrapper">
                                <UploadInput
                                    value={this.state.importFile && this.state.importFile.name}
                                    handleUpload={(file) => this.setState({importFile: file})}
                                    handleRemove={() => this.setState({importFile: null})}
                                    className="dropzone col-md-6"
                                    multiple={false}
                                    accept=".csv"
                                />
                            </div>
                            <div className="col-md-12 checkboxes-div">
                                    <div className="form-check abc-checkbox">
                                        <input type="checkbox" id="send_speaker_email" checked={this.state.send_speaker_email}
                                               onChange={this.handleChangeSendSpeakerEmail} className="form-check-input" />
                                        <label className="form-check-label" htmlFor="send_speaker_email">
                                            {T.translate("event_list.send_speaker_email")}
                                        </label>
                                    </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button disabled={!this.state.importFile} className="btn btn-primary" onClick={this.handleImportEvents}>
                            {T.translate("event_list.ingest")}
                        </button>
                    </Modal.Footer>
                </Modal>

                <Modal show={this.state.showImportFromMUXModal} onHide={() => this.setState({showImportFromMUXModal:false})} >
                    <Modal.Header closeButton>
                        <Modal.Title>{T.translate("event_list.mux_import")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-md-4">
                                <label> {T.translate("event_list.mux_token_id")}</label>
                                &nbsp;
                                <i className="fa fa-info-circle" aria-hidden="true" title={T.translate("event_list.mux_token_id_info")} />
                                <Input
                                    id="mux_token_id"
                                    value={this.state.muxModalState.mux_token_id}
                                    onChange={this.handleChangeMUXModal}
                                    className="form-control"
                                    error={hasErrors('mux_token_id', this.state.errors)}
                                />
                            </div>
                            <div className="col-md-4">
                                <label> {T.translate("event_list.mux_token_secret")}</label>
                                &nbsp;
                                <i className="fa fa-info-circle" aria-hidden="true" title={T.translate("event_list.mux_token_secret_info")} />
                                <Input
                                    id="mux_token_secret"
                                    value={this.state.muxModalState.mux_token_secret}
                                    onChange={this.handleChangeMUXModal}
                                    className="form-control"
                                    error={hasErrors('mux_token_secret', this.state.errors)}
                                />
                            </div>
                            <div className="col-md-4">
                                <label> {T.translate("event_list.mux_email_to")}</label>
                                &nbsp;
                                <i className="fa fa-info-circle" aria-hidden="true" title={T.translate("event_list.mux_email_to_info")} />
                                <Input
                                    id="mux_email_to"
                                    type="email"
                                    value={this.state.muxModalState.mux_email_to}
                                    onChange={this.handleChangeMUXModal}
                                    className="form-control"
                                    error={hasErrors('mux_email_to', this.state.errors)}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn btn-primary" onClick={this.handleImportAssetsFromMUX}>
                            {T.translate("event_list.import")}
                        </button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

const mapStateToProps = ({ currentSummitState, currentEventListState }) => ({
    currentSummit   : currentSummitState.currentSummit,
    ...currentEventListState
})

export default connect (
    mapStateToProps,
    {
        getSummitById,
        getEvents,
        deleteEvent,
        exportEvents,
        importEventsCSV,
        importMP4AssetsFromMUX,
    }
)(SummitEventListPage);
