import React, { useEffect, useState } from "react";
import { FormGroup, FormControl } from "react-bootstrap";
import { Dropdown, Input, SpeakerInput } from "openstack-uicore-foundation/lib/components";
import T from "i18n-react/dist/i18n-react";
import history from "../../../history";
import { flattenEventData } from "../../../utils/summitUtils";

const EventsEditableTableRow = (props) => {
  const {
    event,
    columns,
    editEnabled,
    selected,
    updateSelected,
    deleteEvent,
    selectAll,
    currentSummit,
    selectionPlanOptions,
    activityTypeOptions,
    activtyCategoryOptions,
    actions,
  } = props;
  const [checked, setChecked] = useState(false);
  const speakersDefault = event.speakers?.length > 0 ? event.speakers : [];
  const [speakersList, setSpeakers] = useState(speakersDefault);
  const [editData, setEditData] = useState(event)

  const dataDisplay = flattenEventData(event, currentSummit);

  useEffect(() => {
    updateSelected(editData, checked);
  }, [checked, event]);
  useEffect(() => {
    setChecked(selectAll);
  }, [selectAll]);
  useEffect(() => {
    if (selected.length === 0) {
      setChecked(false);
    }
  }, [selected]);
  useEffect(() => {
    const newEventData = {...editData, speakers: speakersList };
    setEditData(newEventData);
  }, [speakersList])
  useEffect(() => {
    updateSelected(editData, checked);
  }, [editData])
  useEffect(() => {
    if (!editEnabled) {
      setSpeakers(speakersDefault);
    }
  }, [editEnabled]);

  const onActivityTypeChange = (ev) => {
    const type_id = activityTypeOptions.filter((a) => a.value === ev.target.value)[0]
    ?.value;
    const newEventData = {...editData, type_id: type_id};
    setEditData(newEventData);
  };
  const onTitleChange = (ev) => {
    const title = ev.target.value;
    const newEventData = {...editData, title };
    setEditData(newEventData);
  };
  const onSpeakersChange = (ev) => {
    const speakers = ev.target.value;
    setSpeakers([...speakersList, speakers]);
  };
  const onRemoveSpeaker = (speakerId) => {
    const newSpeakers = speakersList.filter(s => s.id !== speakerId);
    setSpeakers(newSpeakers);
    const newEventData = {...editData, speakers: newSpeakers};
    setEditData(newEventData);
  };
  const onActivityCategoryChange = (ev) => {
    const track_id = activtyCategoryOptions.filter((a) => a.value === ev.target.value)[0]
    ?.value;
    const newEventData = {...editData, track_id: track_id };
    setEditData(newEventData);
  };
  const onSelectionPlanChange = (option) => {
    const selection_plan_id = selectionPlanOptions.filter(s => s.value === option.target.value)[0].value;
    const newEventData = {...editData, selection_plan_id: selection_plan_id };
    setEditData(newEventData);
  };
  const onStreamingURLChange = (ev) => {
    const streaming_url = ev.target.value;
    const newEventData = {...editData, streaming_url};
    setEditData(newEventData);
  };
  const onMeetingURLChange = (ev) => {
    const meeting_url = ev.target.value;
    const newEventData = {...editData, meeting_url};
    setEditData(newEventData);
  };
  const onEtherpadURLChange = (ev) => {
    const etherpad_link = ev.target.value;
    const newEventData = {...editData, etherpad_link};
    setEditData(newEventData);
  };
  
  return (
    <>
      <td className="bulk-edit-col-checkbox">
        <input
          type="checkbox"
          onChange={() => setChecked(!checked)}
          checked={checked}
        />
      </td>
      <td className="bulk-edit-col-id">{event.id}</td>
      {selected.find((s) => s.id === event.id) && editEnabled && checked ? (
        <>
          {columns.map(col => {
            if(col.columnKey === "id") {
              return;
            }
            else if (col.columnKey === "event_type") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <Dropdown
                      id="type_id"
                      placeholder={
                        activityTypeOptions.find(at => at.value === event.type?.id).label ||
                        T.translate("bulk_actions_page.placeholders.event_type")
                      }
                      value={""}
                      onChange={onActivityTypeChange}
                      options={activityTypeOptions}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
              )
            }
            else if(col.columnKey === "title") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <FormControl
                      type="text"
                      placeholder={T.translate(
                        "bulk_actions_page.placeholders.event_title"
                      )}
                      onChange={onTitleChange}
                      defaultValue={event.title}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
            )}
            else if(col.columnKey === "speakers") {
              return (
                <td className="bulk-edit-col">
                  <SpeakerInput
                    id="speaker"
                    value={''}
                    onChange={onSpeakersChange}
                    isClearable={true}
                    placeholder={T.translate("edit_event.search_speakers")}
                    getOptionLabel={(speaker) => `${speaker.first_name} ${speaker.last_name} (${speaker.email})`}
                  />
                  <div className="speakers-list">
                    {speakersList?.length > 0 && speakersList.map(sp => <div className="speaker-list-pill" title={sp?.email} key={sp?.id}>{`${sp?.first_name} ${sp?.last_name}`} 
                      <i className="fa fa-remove" onClick={() => onRemoveSpeaker(sp.id)} />
                    </div>)}
                  </div>
                </td>
            )}
            else if(col.columnKey === "track") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <Dropdown
                      id="track_activity"
                      placeholder={
                        activtyCategoryOptions.find(ac => ac.value === event.track?.id)?.label ||
                        T.translate("bulk_actions_page.placeholders.track")
                      }
                      value={""}
                      onChange={onActivityCategoryChange}
                      options={activtyCategoryOptions}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
            )}
           else if(col.columnKey === "selection_plan") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <Dropdown
                      id="selection_plan"
                      placeholder={
                        (event.selection_plan?.id !== undefined && selectionPlanOptions.find(sp => sp.id === event.selection_plan?.id)?.label) ||
                        T.translate(
                          "schedule.placeholders.select_presentation_selection_plan"
                        )
                      }
                      value={""}
                      onChange={onSelectionPlanChange}
                      options={selectionPlanOptions}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
            )}
            else if(col.columnKey === "streaming_url") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <FormControl
                      type="text"
                      placeholder={T.translate(
                        "bulk_actions_page.placeholders.streaming_url"
                      )}
                      onChange={onStreamingURLChange}
                      defaultValue={event.streaming_url}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
            )}
            else if(col.columnKey === "meeting_url") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <FormControl
                      type="text"
                      placeholder={T.translate(
                        "bulk_actions_page.placeholders.meeting_url"
                      )}
                      onChange={onMeetingURLChange}
                      defaultValue={event.meeting_url}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
            )}
            else if(col.columnKey === "etherpad_link") {
              return (
                <td className="bulk-edit-col">
                  <FormGroup>
                    <FormControl
                      type="text"
                      placeholder={T.translate(
                        "bulk_actions_page.placeholders.etherpad_link"
                      )}
                      onChange={onEtherpadURLChange}
                      defaultValue={event.etherpad_link}
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </td>
            )}
            else {return (<td className="bulk-edit-col">{event[col.columKey]}</td>)}
          })}         
        </>
      ) : columns.map((col, i) => 
            col.columnKey !== "id" && <td key={`${dataDisplay.id}${i}`}>{dataDisplay[col.columnKey]}</td>)
      }
      {(actions.edit || actions.delete) && (
        <td className="action-display-tc">
          {actions.edit && (
            <span onClick={() => history.push(`/app/summits/${currentSummit.id}/events/${event.id}`)}>
              <i className="fa fa-pencil-square-o edit-icon"></i>
            </span>
          )}
          {actions.delete && (
            <span onClick={() => deleteEvent(event.id)}>
              <i className="fa fa-trash-o delete-icon"></i>
            </span>
          )}
        </td>
      )}
    </>
  );
};

export default EventsEditableTableRow;
