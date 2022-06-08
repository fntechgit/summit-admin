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
import { Pagination } from 'react-bootstrap';
import { FreeTextSearch, SelectableTable, Dropdown, CheckboxList, Input } from 'openstack-uicore-foundation/lib/components';
import {
    getSpeakersBySummit,
    exportSummitSpeakers,
    selectSummitSpeaker,
    unselectSummitSpeaker,
    selectAllSummitSpeakers,
    unselectAllSummitSpeakers
} from "../../actions/speaker-actions";

class SummitSpeakersListPage extends React.Component {

    constructor(props) {
        super(props);

        this.handleEdit = this.handleEdit.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleDeleteAttendance = this.handleDeleteAttendance.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.handleSelected = this.handleSelected.bind(this);
        this.handleSelectedAll = this.handleSelectedAll.bind(this);
        this.handleChangeSelectionPlanFilter = this.handleChangeSelectionPlanFilter.bind(this);
        this.handleChangeTrackFilter = this.handleChangeTrackFilter.bind(this);
        this.handleChangeActivityTypeFilter = this.handleChangeActivityTypeFilter.bind(this);
        this.handleChangeSelectionStatusFilter = this.handleChangeSelectionStatusFilter.bind(this);

        this.state = {};
    }

    componentDidMount() {
        const { currentSummit } = this.props;
        if (currentSummit) {
            this.props.getSpeakersBySummit();
        }
    }

    handleEdit(attendanceId) {
        const { currentSummit, history } = this.props;
        history.push(`/app/summits/${currentSummit.id}/speaker-attendances/${attendanceId}`);
    }

    handlePageChange(page) {
        const { term, order, orderDir, perPage } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, order, orderDir);
    }

    handleSort(index, key, dir, func) {
        const { term, page, perPage } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, key, dir);
    }

    handleSearch(term) {
        const { order, orderDir, page, perPage } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, order, orderDir);
    }

    handleDeleteAttendance(attendanceId) {
        const { deleteAttendance, attendances } = this.props;
        let attendance = attendances.find(a => a.id === attendanceId);

        Swal.fire({
            title: T.translate("general.are_you_sure"),
            text: T.translate("speaker_attendance_list.delete_attendance_warning") + ' ' + attendance.speaker_name,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: T.translate("general.yes_delete")
        }).then(function (result) {
            if (result.value) {
                deleteAttendance(attendanceId);
            }
        });
    }

    handleChangeSelectionPlanFilter(ev) {
        const { value: newSelectionPlanFilter } = ev.target;
        const { term, order, page, orderDir, perPage, trackFilter, activityTypeFilter, selectionStatusFilter } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, order, orderDir,
            {
                selectionPlanFilter: newSelectionPlanFilter, trackFilter, activityTypeFilter, selectionStatusFilter
            });
    }

    handleChangeTrackFilter(ev) {
        const { value: newTrackFilter } = ev.target;
        const { term, order, page, orderDir, perPage, selectionPlanFilter, activityTypeFilter, selectionStatusFilter } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, order, orderDir,
            {
                selectionPlanFilter, trackFilter: newTrackFilter, activityTypeFilter, selectionStatusFilter
            });
    }

    handleChangeActivityTypeFilter(ev) {
        const { value: newActivityTypeFilter } = ev.target;
        const { term, order, page, orderDir, perPage, selectionPlanFilter, trackFilter, selectionStatusFilter } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, order, orderDir,
            {
                selectionPlanFilter, trackFilter, activityTypeFilter: newActivityTypeFilter, selectionStatusFilter
            });
    }

    handleChangeSelectionStatusFilter(ev) {
        const { value: newSelectionStatusFilter } = ev.target;
        const { term, order, page, orderDir, perPage, selectionPlanFilter, trackFilter, activityTypeFilter } = this.props;
        this.props.getSpeakersBySummit(term, page, perPage, order, orderDir,
            {
                selectionPlanFilter, trackFilter, activityTypeFilter, selectionStatusFilter: newSelectionStatusFilter
            });
    }

    handleExport(ev) {
        const { term, order, orderDir } = this.props;
        ev.preventDefault();

        this.props.exportSummitSpeakers(term, order, orderDir);
    }

    handleSelected(speaker_id, isSelected) {
        if (isSelected) {
            this.props.selectSummitSpeaker(speaker_id);
            return;
        }
        this.props.unselectSummitSpeaker(speaker_id);
    }

    handleSelectedAll(ev) {
        let selectedAll = ev.target.checked;
        this.props.selectAllSummitSpeakers();
        if (!selectedAll) {
            //clear all selected
            this.props.unselectAllSummitSpeakers();
        }
    }

    render() {
        const { currentSummit, speakers, lastPage, currentPage, term, order, orderDir, totalSpeakers, selectedSpeakers,
            selectedAll, selectionPlanFilter, trackFilter, activityTypeFilter, selectionStatusFilter, } = this.props;

        console.log('speakers', speakers)

        const columns = [
            { columnKey: 'name', value: T.translate("general.name"), sortable: true },
            { columnKey: 'email', value: T.translate("general.email"), åsortable: true },
            { columnKey: 'accepted', value: T.translate("summit_speakers_list.accepted") },
            { columnKey: 'rejected', value: T.translate("summit_speakers_list.rejected") },
            { columnKey: 'alternate', value: T.translate("summit_speakers_list.alternate") },
        ];

        const selectionPlansDDL = currentSummit.selection_plans.map(selectionPlan => ({ label: selectionPlan.name, value: selectionPlan.name }));
        const tracksDDL = currentSummit.tracks.map(track => ({ label: track.name, value: track.name }));
        const activityTypesDDL = currentSummit.event_types.map(track => ({ label: track.name, value: track.name }));
        const selectionStatusDDL = [
            { label: 'Accepted', value: 'accepted' },
            { label: 'Alternate', value: 'alternate' },
            { label: 'Rejected', value: 'rejected' }
        ];
        let flowEventsDDL = [
            { label: '-- SELECT EMAIL EVENT --', value: '' },
            { label: 'SUMMIT_REGISTRATION__ATTENDEE_TICKET_REGENERATE_HASH', value: 'SUMMIT_REGISTRATION__ATTENDEE_TICKET_REGENERATE_HASH' },
            { label: 'SUMMIT_REGISTRATION_INVITE_ATTENDEE_TICKET_EDITION', value: 'SUMMIT_REGISTRATION_INVITE_ATTENDEE_TICKET_EDITION' },
            { label: 'SUMMIT_REGISTRATION_ATTENDEE_ALL_TICKETS_EDITION', value: 'SUMMIT_REGISTRATION_ATTENDEE_ALL_TICKETS_EDITION' },
            { label: 'SUMMIT_REGISTRATION_INCOMPLETE_ATTENDEE_REMINDER', value: 'SUMMIT_REGISTRATION_INCOMPLETE_ATTENDEE_REMINDER' },
        ];

        const table_options = {
            sortCol: order,
            sortDir: orderDir,
            actions: {
                edit: {
                    onClick: this.handleEdit,
                    onSelected: this.handleSelected,
                    onSelectedAll: this.handleSelectedAll
                }
            },
            selectedIds: selectedSpeakers,
            selectedAll: selectedAll,
        }

        if (!currentSummit.id) return (<div />);

        return (
            <div className="container">
                <h3> {T.translate("summit_speakers_list.summit_speakers_list")} ({totalSpeakers})</h3>
                <div className={'row'}>
                    <div className={'col-md-6'}>
                        <FreeTextSearch
                            value={term}
                            placeholder={T.translate("summit_speakers_list.placeholders.search_speakers")}
                            onSearch={this.handleSearch}
                        />
                    </div>
                    <div className="col-md-6 text-right">
                        <button className="btn btn-default right-space" onClick={this.handleExport}>
                            {T.translate("general.export")}
                        </button>
                    </div>
                </div>
                <div className='row'>
                    <div className="col-md-3" style={{ height: "61px", paddingTop: "8px" }}>
                        <Dropdown
                            id="selectionPlanFilter"
                            value={selectionPlanFilter}
                            onChange={this.handleChangeSelectionPlanFilter}
                            options={selectionPlansDDL}
                            isClearable={true}
                            placeholder={"Filter By Selection Plan"}
                            isMulti
                        />
                    </div>
                    <div className="col-md-3" style={{ height: "61px", paddingTop: "8px" }}>
                        <Dropdown
                            id="trackFilter"
                            value={trackFilter}
                            onChange={this.handleChangeTrackFilter}
                            options={tracksDDL}
                            isClearable={true}
                            placeholder={"Filter By Track"}
                            isMulti
                        />
                    </div>
                    <div className="col-md-3" style={{ height: "61px", paddingTop: "8px" }}>
                        <Dropdown
                            id="activityTypeFilter"
                            value={activityTypeFilter}
                            onChange={this.handleChangeActivityTypeFilter}
                            options={activityTypesDDL}
                            isClearable={true}
                            placeholder={"Filter By Activity Type"}
                            isMulti
                        />
                    </div>
                    <div className="col-md-3">
                        <CheckboxList
                            id="selectionStatusFilter"
                            value={selectionStatusFilter}
                            onChange={this.handleChangeSelectionStatusFilter}
                            options={selectionStatusDDL}
                            isClearable={true}
                            placeholder={"Filter By Selection Status"}
                            isMulti
                        />
                    </div>
                </div>

                <div className='row'>
                    <div className="col-md-6" style={{ height: "61px", paddingTop: "8px" }}>
                        <Dropdown
                            id="activityTypeFilter"
                            value={activityTypeFilter}
                            onChange={this.handleChangeActivityTypeFilter}
                            options={flowEventsDDL}
                            isClearable={true}
                            isMulti
                        />
                    </div>
                    <div className={'col-md-4'} style={{ height: "61px", paddingTop: "8px" }}>
                        <Input
                            value={term}
                            placeholder={T.translate("summit_speakers_list.placeholders.test_recipient")}
                        // onChange={this.handleChangeRecipient}
                        />
                    </div>
                    <div className={'col-md-2'} style={{ height: "61px", paddingTop: "8px" }}>
                        <button className="btn btn-default right-space" onClick={() => console.log('click')}>
                            {T.translate("summit_speakers_list.send_emails")}
                        </button>
                    </div>
                </div>

                {speakers.length === 0 &&
                    <div>{T.translate("summit_speakers_list.no_attendances")}</div>
                }

                {speakers.length > 0 &&
                    <div>
                        <SelectableTable
                            options={table_options}
                            data={speakers}
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

            </div>
        )
    }
}

const mapStateToProps = ({ currentSummitState, currentSummitSpeakersListState }) => ({
    currentSummit: currentSummitState.currentSummit,
    ...currentSummitSpeakersListState
})

export default connect(
    mapStateToProps,
    {
        getSpeakersBySummit,
        exportSummitSpeakers,
        selectSummitSpeaker,
        unselectSummitSpeaker,
        selectAllSummitSpeakers,
        unselectAllSummitSpeakers
    }
)(SummitSpeakersListPage);
