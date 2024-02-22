import React, { useEffect, useState } from "react";
import { FormGroup, FormControl } from "react-bootstrap";
import { Dropdown, Input } from "openstack-uicore-foundation/lib/components";
import { SummitEvent } from "openstack-uicore-foundation/lib/models";
import T from "i18n-react/dist/i18n-react";
import Select from "react-select";
import history from "../../../history";

const EventsEditableTableRow = (props) => {
  const {
    index,
    event,
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
    updateEventTitle,
    updateEventSelectionPlan,
    updateEventActivityType,
    updateEventActivityCategory,
    updateEventStreamingURL,
    updateEventMeetingURL,
    updateEventEtherpadURL,
    updateEventSpeakers
  } = props;
  const [checked, setChecked] = useState(false);
  const [eventData, setEventData] = useState(event);

  useEffect(() => {
    updateSelected(index, eventData, checked);
  }, [checked, eventData]);
  useEffect(() => {
    setChecked(selectAll);
  }, [selectAll]);
  useEffect(() => {
    console.log('EventsEditableTableRow useEffect selected', selected);
    if (selected.length === 0) {
      setChecked(false);
    }
  }, [selected]);

  const onActivityTypeChanged = (ev) => {
    const event_type = activityTypeOptions.filter((a) => a.value === ev.target.value)[0]
    ?.label;
    updateEventActivityType(eventData, event_type);
  };
  const onTitleChanged = (ev) => {
    const title = ev.target.value
    updateEventTitle(eventData, title);
  };
  const onSpeakersChange = (ev) => {
    const speakers = ev.target.value;
    updateEventSpeakers(eventData, speakers);
  };
  const onActivityCategoryChange = (ev) => {
    const track = activtyCategoryOptions.filter((a) => a.value === ev.target.value)[0]
    ?.label;
    updateEventActivityCategory(eventData, track);
  };
  const onSelectionPlanChanged = (option) => {
    const selectionPlan = option.label;
    updateEventSelectionPlan(eventData, selectionPlan);
  };
  const onStreamingURLChanged = (ev) => {
    const streaming_url = ev.target.value;
    updateEventStreamingURL(eventData, streaming_url);
  };
  const onMeetingURLChanged = (ev) => {
    const meeting_url = ev.target.value;
    updateEventMeetingURL(eventData, meeting_url);
  };
  const onEtherpadURLChanged = (ev) => {
    const etherpad_link = ev.target.value;
    updateEventEtherpadURL(eventData, etherpad_link);
  };

  const handleEdit = (event_id) =>
    history.push(`/app/summits/${currentSummit.id}/events/${event_id}`);

  return (
    <>
      <td className="bulk-edit-col-checkbox">
        <Input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
      </td>
      {/** Event ID */}
      <td className="bulk-edit-col-id">{event.id}</td>
      {selected.find((s) => s.id === event.id) && editEnabled && checked ? (
        <>
          {/** Activity / Event type */}
          <td className="bulk-edit-col">
            <FormGroup>
              <Dropdown
                id="type_id"
                placeholder={
                  eventData.event_type ||
                  T.translate("bulk_actions_page.placeholders.event_type")
                }
                value={""}
                onChange={onActivityTypeChanged}
                options={activityTypeOptions}
              />
              <FormControl.Feedback />
            </FormGroup>
          </td>
          {/** Title / Presentation Name*/}
          <td className="bulk-edit-col">
            <FormGroup>
              <FormControl
                type="text"
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.event_title"
                )}
                onChange={onTitleChanged}
                defaultValue={eventData.title}
              />
              <FormControl.Feedback />
            </FormGroup>
          </td>
          {/** Selection Status */}
          <td className="bulk-edit-col">{event.selection_status}</td>
          {/** Speakers */}
          <td className="bulk-edit-col">
            <FormGroup>
              <FormControl
                type="text"
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.speakers"
                )}
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
                placeholder={
                  eventData.track ||
                  T.translate("bulk_actions_page.placeholders.track")
                }
                value={eventData.track}
                onChange={onActivityCategoryChange}
                options={activtyCategoryOptions}
              />
              <FormControl.Feedback />
            </FormGroup>
          </td>
          {/** Selection Plans */}
          <td className="bulk-edit-col">
            <FormGroup>
              <Select
                placeholder={
                  eventData.selection_plan ||
                  T.translate(
                    "schedule.placeholders.select_presentation_selection_plan"
                  )
                }
                className="selection_plan_selector"
                name="form-field-name"
                value={""}
                onChange={onSelectionPlanChanged}
                options={selectionPlanOptions}
              />
              <FormControl.Feedback />
            </FormGroup>
          </td>
          {/** Published Date */}
          <td className="bulk-edit-col">{event.published_date}</td>
          {/** Streaming URL */}
          <td className="bulk-edit-col">
            <FormGroup>
              <FormControl
                type="text"
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.streaming_url"
                )}
                onChange={onStreamingURLChanged}
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
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.meeting_url"
                )}
                onChange={onMeetingURLChanged}
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
                placeholder={T.translate(
                  "bulk_actions_page.placeholders.etherpad_link"
                )}
                onChange={onEtherpadURLChanged}
                defaultValue={event.etherpad_link}
              />
              <FormControl.Feedback />
            </FormGroup>
          </td>
        </>
      ) : (
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
      )}
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
