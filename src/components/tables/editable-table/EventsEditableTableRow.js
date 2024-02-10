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
import React, { useEffect, useState } from 'react'
import { FormGroup, FormControl } from 'react-bootstrap';
import { Dropdown, Input } from 'openstack-uicore-foundation/lib/components'
import {SummitEvent} from "openstack-uicore-foundation/lib/models";
import T from 'i18n-react/dist/i18n-react'
import Select from "react-select";
import history from '../../../history';

const EventsEditableTableRow = (props) => {
    const { 
        event, 
        editEnabled, 
        selected, 
        updateSelected, 
        selectAll, 
        currentSummit, 
        selectionPlanOptions, 
        activityTypeOptions, 
        activtyCategoryOptions, 
        actions 
    } = props;
    const [checked, setChecked] = useState(false);
    const [eventData, setEventData] = useState(event);
    
    useEffect(() => {
        updateSelected(eventData, checked);
    }, [checked, eventData])
    useEffect(() => {
        setChecked(selectAll)
    }, [selectAll])
    useEffect(() => {
        if(selected.length === 0) {
            setChecked(false);
        }
    }, [selected]);

    const getValidationEventTitle = () => {
        let eventModel = new SummitEvent(event, currentSummit)
        let isValid    = eventModel.isValidTitle(event.title);
        return isValid ? 'success':'warning';
    }
    const getValidationEventSelectionPlan = () => {
        return null;
    }
    const onActivityTypeLocalChanged = (ev) => {
        setEventData({
            ...eventData,
            event_type: activityTypeOptions.filter(a => a.id === ev.target.value)?.label
        });
    }
    const onTitleChanged = (ev) => {
        setEventData({
            ...eventData,
            title: ev.target.value
        });
    }
    const onSpeakersChange = (ev) => {
        setEventData({
            ...eventData,
            speakers: ev.target.value
        });
    }
    const onActivityCategoryChange = (ev) => {
        setEventData({
            ...eventData,
            track: activtyCategoryOptions.filter(a => a.id === ev.target.value)?.label
        });
    }
    const onSelectionPlanChanged = (option) => {
        let selectionPlan = option.value;
        let isValid = selectionPlan == null ? false:true;
        setEventData({
            ...eventData,
            selection_plan: selectionPlan.name
        });
    }
    const onStreamingURLLocalChanged = (ev) => {
        setEventData({
            ...eventData,
            streaming_url: ev.target.value
        });
    }
    const onMeetingURLLocalChanged = (ev) => {
        setEventData({
            ...eventData,
            meeting_url: ev.target.value
        });
    }
    const onEtherpadURLLocalChanged = (ev) => {
        setEventData({
            ...eventData,
            etherpad_link: ev.target.value
        });
    }

    const handleEdit = (event_id) => history.push(`/app/summits/${currentSummit.id}/events/${event_id}`)
        
    return (
        <>
            <td className="bulk-edit-col-checkbox">
                <Input type="checkbox" checked={checked} onChange={() => setChecked(!checked)} />
            </td>
            {/** Event ID */}
            <td className="bulk-edit-col-id">
                {event.id}
            </td>
            {(selected.find(s => s.id === event.id) && editEnabled && checked) ?
                <>
                {/** Activity / Event type */}
                <td className="bulk-edit-col">
                    <FormGroup>
                        <Dropdown
                            id="type_id"
                            placeholder={eventData.event_type || T.translate("bulk_actions_page.placeholders.event_type")}
                            value={''}
                            onChange={onActivityTypeLocalChanged}
                            options={activityTypeOptions}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                {/** Title / Presentation Name*/}
                <td className="bulk-edit-col">
                    <FormGroup validationState={getValidationEventTitle()}>
                        <FormControl
                            type="text"
                            placeholder={T.translate("bulk_actions_page.placeholders.event_title")}
                            onChange={onTitleChanged}
                            defaultValue={eventData.title}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                {/** Selection Status */}
                <td className="bulk-edit-col">
                    {event.selection_status}
                </td>
                {/** Speakers */}
                <td className="bulk-edit-col">
                    <FormGroup validationState={() => {}}>
                        <FormControl
                            type="text"
                            placeholder={T.translate("bulk_actions_page.placeholders.speakers")}
                            onChange={onSpeakersChange}
                            defaultValue={eventData.speakers}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                {/** Track / Activity Category */}
                <td className="bulk-edit-col">
                    <FormGroup>
                        <Dropdown
                            id="track_activity"
                            placeholder={eventData.track || T.translate("bulk_actions_page.placeholders.track")}
                            value={eventData.track}
                            onChange={onActivityCategoryChange}
                            options={activtyCategoryOptions}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                {/** Selection Plans */}
                <td className="bulk-edit-col">
                    <FormGroup validationState={getValidationEventSelectionPlan()}>
                        <Select
                            placeholder={eventData.selection_plan || T.translate("schedule.placeholders.select_presentation_selection_plan")}
                            className="selection_plan_selector"
                            name="form-field-name"
                            value={eventData.selection_plan}
                            onChange={onSelectionPlanChanged}
                            options={selectionPlanOptions}
                        />
                        <FormControl.Feedback/>
                    </FormGroup>
                </td>
                {/** Published Date */}
                <td className="bulk-edit-col">
                    {event.published_date}
                </td>
                {/** Streaming URL */}
                <td className="bulk-edit-col">
                    <FormGroup>
                        <FormControl
                            type="text"
                            placeholder={T.translate("bulk_actions_page.placeholders.streaming_url")}
                            onChange={onStreamingURLLocalChanged}
                            defaultValue={eventData.streaming_url}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                {/** Meeting URL */}
                <td className="bulk-edit-col">
                    <FormGroup>
                        <FormControl
                            type="text"
                            placeholder={T.translate("bulk_actions_page.placeholders.meeting_url")}
                            onChange={onMeetingURLLocalChanged}
                            defaultValue={eventData.meeting_url}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                {/** Etherpad URL */}
                <td className="bulk-edit-col">
                    <FormGroup>
                        <FormControl
                            type="text"
                            placeholder={T.translate("bulk_actions_page.placeholders.etherpad_link")}
                            onChange={onEtherpadURLLocalChanged}
                            defaultValue={event.etherpad_link}
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                </td>
                </>
                :
                <>
                    <td>{event.event_type}</td>
                    <td>{event.title}</td>
                    <td>{event.selection_status}</td>
                    <td>{event.speakers}</td>
                    <td>{event.track}</td>
                    <td>{event.selection_plan}</td>
                    <td>{event.published_date}</td>
                    <td>{event.streaming_url}</td>
                    <td>{event.meeting_url}</td>
                    <td>{event.etherpad_link}</td>
                </>
            }
            {(actions.edit || actions.delete) && 
                <td className="action-display-tc">
                    {actions.edit && <span onClick={() => handleEdit(event.id)}><i className="fa fa-pencil-square-o edit-icon"></i></span>}
                    {actions.delete && <span onClick={() => {}}><i className="fa fa-trash-o delete-icon"></i></span>}
                </td>
            }
        </>
    )
    
}

export default EventsEditableTableRow;
